import { createClient, RedisClientType } from 'redis'
import { SchemaFieldTypes, VectorAlgorithms } from '@redis/search'
import { createLogger } from '@raz2/shared'
import { EmbeddingService } from './embedding'
import type {
  Idea,
  IdeaWithVector,
  IdeaSearchResult,
  IdeaSearchOptions,
  IdeaStoreConfig,
  CreateIdeaInput,
  UpdateIdeaInput,
  IdeaFilter,
  Reminder,
  CreateReminderInput,
  IdeaCategory,
  IdeaPriority,
  IdeaStatus
} from './types'

export class IdeaStore {
  private client: RedisClientType
  private embedding: EmbeddingService
  private logger = createLogger('idea-store')
  private config: IdeaStoreConfig
  private isConnected = false

  constructor(config: IdeaStoreConfig) {
    this.config = config
    this.client = createClient({ url: config.redisUrl })
    this.embedding = new EmbeddingService(config.openaiApiKey, config.embeddingModel)

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      this.logger.error('Redis client error', { 
        error: error instanceof Error ? error : new Error(String(error)) 
      })
    })

    this.client.on('connect', () => {
      this.logger.info('Connected to Redis')
      this.isConnected = true
    })

    this.client.on('disconnect', () => {
      this.logger.warn('Disconnected from Redis')
      this.isConnected = false
    })
  }

  async initialize(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect()
      }

      await this.createIndex()
      this.logger.info('Idea store initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize idea store', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  private async createIndex(): Promise<void> {
    try {
      // Check if index exists and drop it to recreate with updated schema
      try {
        await this.client.ft.info(this.config.indexName)
        this.logger.info('Existing index found, dropping to recreate with updated schema', { indexName: this.config.indexName })
        await this.client.ft.dropIndex(this.config.indexName)
      } catch (error) {
        // Index doesn't exist, which is fine
        this.logger.info('No existing index found, creating new one', { indexName: this.config.indexName })
      }

      await this.client.ft.create(
        this.config.indexName,
        {
          '$.id': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.title': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.content': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.category': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.priority': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.status': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.userId': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.chatId': {
            type: SchemaFieldTypes.NUMERIC,
            SORTABLE: true
          },
          '$.tags': {
            type: SchemaFieldTypes.TAG,
            SEPARATOR: ','
          },
          '$.createdAt': {
            type: SchemaFieldTypes.NUMERIC,
            SORTABLE: true
          },
          '$.updatedAt': {
            type: SchemaFieldTypes.NUMERIC,
            SORTABLE: true
          },
          '$.vector': {
            type: SchemaFieldTypes.VECTOR,
            ALGORITHM: VectorAlgorithms.HNSW,
            TYPE: 'FLOAT32',
            DIM: this.config.vectorDimension,
            DISTANCE_METRIC: 'COSINE'
          }
        },
        {
          ON: 'JSON',
          PREFIX: 'idea:'
        }
      )

      this.logger.info('Vector index created successfully', { 
        indexName: this.config.indexName,
        dimension: this.config.vectorDimension
      })
    } catch (error) {
      this.logger.error('Failed to create vector index', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  async createIdea(input: CreateIdeaInput): Promise<Idea> {
    try {
      const id = `idea:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const timestamp = now.getTime()

      const embeddingResponse = await this.embedding.generateEmbedding(
        `${input.title} ${input.content}`
      )

      const ideaWithVector: IdeaWithVector = {
        id: id.replace('idea:', ''),
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium',
        status: 'active',
        tags: input.tags || [],
        userId: input.userId,
        chatId: input.chatId,
        createdAt: timestamp,
        updatedAt: timestamp,
        vector: embeddingResponse.vector,
        reminders: []
      }

      if (input.reminders) {
        ideaWithVector.reminders = input.reminders.map((reminder: any) => ({
          id: `reminder:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ideaId: ideaWithVector.id,
          type: reminder.type,
          scheduledFor: reminder.scheduledFor,
          message: reminder.message,
          isActive: true,
          isSent: false,
          createdAt: timestamp,
          updatedAt: timestamp
        }))
      }

      await this.client.json.set(id, '$', ideaWithVector as any)

      for (const reminder of ideaWithVector.reminders || []) {
        await this.client.json.set(`reminder:${reminder.id}`, '$', reminder as any)
      }

      this.logger.info('Idea created successfully', {
        id: ideaWithVector.id,
        title: input.title,
        reminders: ideaWithVector.reminders?.length || 0
      })

      const { vector, ...idea } = ideaWithVector
      // Convert timestamps back to Date objects for the return value
      idea.createdAt = new Date(idea.createdAt)
      idea.updatedAt = new Date(idea.updatedAt)
      
      return idea
    } catch (error) {
      this.logger.error('Failed to create idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        title: input.title
      })
      throw error
    }
  }

  async getIdea(id: string): Promise<Idea | null> {
    try {
      const key = id.startsWith('idea:') ? id : `idea:${id}`
      const data = await this.client.json.get(key, { path: '$' })

      if (!data || !Array.isArray(data) || data.length === 0) {
        return null
      }

      const ideaWithVector = data[0] as unknown as any
      const { vector, ...idea } = ideaWithVector

      // Convert timestamps back to Date objects
      idea.createdAt = new Date(idea.createdAt)
      idea.updatedAt = new Date(idea.updatedAt)

      // Convert reminder timestamps if they exist
      if (idea.reminders) {
        idea.reminders = idea.reminders.map((reminder: any) => ({
          ...reminder,
          createdAt: new Date(reminder.createdAt),
          updatedAt: new Date(reminder.updatedAt),
          scheduledFor: new Date(reminder.scheduledFor)
        }))
      }

      return idea
    } catch (error) {
      this.logger.error('Failed to get idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        id
      })
      return null
    }
  }

  async updateIdea(input: UpdateIdeaInput): Promise<Idea | null> {
    try {
      const key = input.id.startsWith('idea:') ? input.id : `idea:${input.id}`
      const existing = await this.client.json.get(key, { path: '$' })

      if (!existing || !Array.isArray(existing) || existing.length === 0) {
        return null
      }

      const ideaWithVector = existing[0] as unknown as IdeaWithVector
      const timestamp = new Date().getTime()

      if (input.title) ideaWithVector.title = input.title
      if (input.content) ideaWithVector.content = input.content
      if (input.category) ideaWithVector.category = input.category
      if (input.priority) ideaWithVector.priority = input.priority
      if (input.status) ideaWithVector.status = input.status
      if (input.tags) ideaWithVector.tags = input.tags

      if (input.title || input.content) {
        const embeddingResponse = await this.embedding.generateEmbedding(
          `${ideaWithVector.title} ${ideaWithVector.content}`
        )
        ideaWithVector.vector = embeddingResponse.vector
      }

      if (input.reminders) {
        ideaWithVector.reminders = input.reminders.map((reminder: any) => ({
          id: `reminder:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ideaId: ideaWithVector.id,
          type: reminder.type,
          scheduledFor: reminder.scheduledFor,
          message: reminder.message,
          isActive: true,
          isSent: false,
          createdAt: timestamp,
          updatedAt: timestamp
        }))
      }

      ideaWithVector.updatedAt = timestamp

      await this.client.json.set(key, '$', ideaWithVector as any)

      for (const reminder of ideaWithVector.reminders || []) {
        await this.client.json.set(`reminder:${reminder.id}`, '$', reminder as any)
      }

      this.logger.info('Idea updated successfully', {
        id: ideaWithVector.id,
        title: ideaWithVector.title
      })

      const { vector, ...idea } = ideaWithVector
      // Convert timestamps back to Date objects for the return value
      idea.createdAt = new Date(idea.createdAt)
      idea.updatedAt = new Date(idea.updatedAt)
      
      return idea
    } catch (error) {
      this.logger.error('Failed to update idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        id: input.id
      })
      throw error
    }
  }

  async deleteIdea(id: string): Promise<boolean> {
    try {
      const key = id.startsWith('idea:') ? id : `idea:${id}`
      const result = await this.client.del(key)
      
      this.logger.info('Idea deleted', { id, deleted: result > 0 })
      return result > 0
    } catch (error) {
      this.logger.error('Failed to delete idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        id
      })
      return false
    }
  }

  async searchIdeas(query: string, options: IdeaSearchOptions = {}): Promise<IdeaSearchResult[]> {
    try {
      if (!this.isConnected) {
        this.logger.error('Redis client not connected for search operation')
        throw new Error('Redis client not connected')
      }

      const { limit = 10, threshold = 0.1, filter } = options

      this.logger.debug('Generating embedding for search query', {
        query: query.substring(0, 100),
        queryLength: query.length
      })

      const queryEmbedding = await this.embedding.generateEmbedding(query)

      let searchQuery = '*'
      if (filter) {
        const filterParts: string[] = []
        
        if (filter.userId) {
          filterParts.push(`@userId:${filter.userId}`)
        }
        if (filter.chatId) {
          filterParts.push(`@chatId:[${filter.chatId} ${filter.chatId}]`)
        }
        if (filter.category) {
          filterParts.push(`@category:${filter.category}`)
        }
        if (filter.priority) {
          filterParts.push(`@priority:${filter.priority}`)
        }
        if (filter.status) {
          filterParts.push(`@status:${filter.status}`)
        }
        if (filter.tags && filter.tags.length > 0) {
          filterParts.push(`@tags:{${filter.tags.join('|')}}`)
        }

        if (filterParts.length > 0) {
          searchQuery = filterParts.join(' ')
        }
      }

      this.logger.debug('Executing vector search', {
        indexName: this.config.indexName,
        searchQuery,
        vectorDimension: queryEmbedding.vector.length,
        limit
      })

      const results = await this.client.ft.search(
        this.config.indexName,
        searchQuery,
        {
          PARAMS: {
            BLOB: Buffer.from(new Float32Array(queryEmbedding.vector).buffer)
          },
          SORTBY: {
            BY: '__vector_score',
            DIRECTION: 'ASC'
          },
          LIMIT: {
            from: 0,
            size: limit
          },
          RETURN: ['$'],
          DIALECT: 2
        }
      )

      const ideas: IdeaSearchResult[] = []

      for (const doc of results.documents) {
        if (doc.value) {
          const ideaWithVector = JSON.parse(doc.value['$'] as string) as any
          const score = parseFloat(doc.id.split(':')[1] || '0')
          
          if (score >= threshold) {
            const { vector, ...idea } = ideaWithVector
            
            // Convert timestamps back to Date objects
            idea.createdAt = new Date(idea.createdAt)
            idea.updatedAt = new Date(idea.updatedAt)

            // Convert reminder timestamps if they exist
            if (idea.reminders) {
              idea.reminders = idea.reminders.map((reminder: any) => ({
                ...reminder,
                createdAt: new Date(reminder.createdAt),
                updatedAt: new Date(reminder.updatedAt),
                scheduledFor: new Date(reminder.scheduledFor)
              }))
            }

            ideas.push({
              idea,
              score,
              distance: 1 - score
            })
          }
        }
      }

      this.logger.info('Idea search completed', {
        query: query.substring(0, 100),
        resultsCount: ideas.length,
        totalFound: results.total,
        searchQuery,
        threshold
      })

      return ideas
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error('Failed to search ideas', {
        error: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown'
        },
        query: query.substring(0, 100),
        indexName: this.config.indexName,
        isConnected: this.isConnected
      })
      throw error
    }
  }

  async listIdeas(filter?: IdeaFilter, limit: number = 50): Promise<Idea[]> {
    try {
      if (!this.isConnected) {
        this.logger.error('Redis client not connected for list operation')
        throw new Error('Redis client not connected')
      }

      let searchQuery = '*'
      
      if (filter) {
        const filterParts: string[] = []
        
        if (filter.userId) {
          filterParts.push(`@userId:${filter.userId}`)
        }
        if (filter.chatId) {
          filterParts.push(`@chatId:[${filter.chatId} ${filter.chatId}]`)
        }
        if (filter.category) {
          filterParts.push(`@category:${filter.category}`)
        }
        if (filter.priority) {
          filterParts.push(`@priority:${filter.priority}`)
        }
        if (filter.status) {
          filterParts.push(`@status:${filter.status}`)
        }

        if (filterParts.length > 0) {
          searchQuery = filterParts.join(' ')
        }
      }

      this.logger.debug('Executing list search', {
        indexName: this.config.indexName,
        searchQuery,
        limit,
        filter
      })

      const results = await this.client.ft.search(
        this.config.indexName,
        searchQuery,
        {
          LIMIT: { from: 0, size: limit },
          SORTBY: { BY: 'createdAt', DIRECTION: 'DESC' },
          RETURN: ['$']
        }
      )

      const ideas: Idea[] = []

      for (const doc of results.documents) {
        if (doc.value) {
          const ideaWithVector = JSON.parse(doc.value['$'] as string) as any
          const { vector, ...idea } = ideaWithVector
          
          // Convert timestamps back to Date objects
          idea.createdAt = new Date(idea.createdAt)
          idea.updatedAt = new Date(idea.updatedAt)

          // Convert reminder timestamps if they exist
          if (idea.reminders) {
            idea.reminders = idea.reminders.map((reminder: any) => ({
              ...reminder,
              createdAt: new Date(reminder.createdAt),
              updatedAt: new Date(reminder.updatedAt),
              scheduledFor: new Date(reminder.scheduledFor)
            }))
          }

          ideas.push(idea)
        }
      }

      this.logger.info('Listed ideas', { 
        count: ideas.length, 
        filter,
        searchQuery,
        totalFound: results.total
      })
      return ideas
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error('Failed to list ideas', {
        error: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown'
        },
        filter,
        indexName: this.config.indexName,
        isConnected: this.isConnected
      })
      throw error
    }
  }

  async getDueReminders(): Promise<Reminder[]> {
    try {
      const now = new Date()
      const reminderKeys = await this.client.keys('reminder:*')
      const dueReminders: Reminder[] = []

      for (const key of reminderKeys) {
        const data = await this.client.json.get(key, { path: '$' })
        if (data && Array.isArray(data) && data.length > 0) {
          const reminder = data[0] as any
          
          // Convert timestamps back to Date objects
          reminder.scheduledFor = new Date(reminder.scheduledFor)
          reminder.createdAt = new Date(reminder.createdAt)
          reminder.updatedAt = new Date(reminder.updatedAt)

          if (reminder.isActive && !reminder.isSent && reminder.scheduledFor <= now) {
            dueReminders.push(reminder)
          }
        }
      }

      return dueReminders
    } catch (error) {
      this.logger.error('Failed to get due reminders', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  async markReminderSent(reminderId: string): Promise<void> {
    try {
      const key = reminderId.startsWith('reminder:') ? reminderId : `reminder:${reminderId}`
      const timestamp = new Date().getTime()
      
      await this.client.json.set(key, '$.isSent', true)
      await this.client.json.set(key, '$.updatedAt', timestamp)
      
      this.logger.info('Reminder marked as sent', { reminderId })
    } catch (error) {
      this.logger.error('Failed to mark reminder as sent', {
        error: error instanceof Error ? error : new Error(String(error)),
        reminderId
      })
      throw error
    }
  }

  async getStats(): Promise<{ count: number; indexSize: number }> {
    try {
      const info = await this.client.ft.info(this.config.indexName)
      
      return {
        count: parseInt(info.numDocs?.toString() || '0'),
        indexSize: parseInt(info.invertedSzMb?.toString() || '0')
      }
    } catch (error) {
      this.logger.error('Failed to get stats', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return { count: 0, indexSize: 0 }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect()
        this.logger.info('Disconnected from Redis')
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', {
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }
} 