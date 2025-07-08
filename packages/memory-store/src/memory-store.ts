import { createClient, RedisClientType } from 'redis'
import { SchemaFieldTypes, VectorAlgorithms } from '@redis/search'
import { createLogger } from '@raz2/shared'
import { EmbeddingService } from './embedding'
import type {
  Memory,
  MemoryWithVector,
  MemorySearchResult,
  MemorySearchOptions,
  MemoryStoreConfig,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryFilter
} from './types'

export class MemoryStore {
  private client: RedisClientType
  private embedding: EmbeddingService
  private logger = createLogger('memory-store')
  private config: MemoryStoreConfig
  private isConnected = false

  constructor(config: MemoryStoreConfig) {
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
      this.logger.info('Memory store initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize memory store', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  private async createIndex(): Promise<void> {
    try {
      // Check if index already exists
      try {
        await this.client.ft.info(this.config.indexName)
        this.logger.info('Vector index already exists', { indexName: this.config.indexName })
        return
      } catch (error) {
        // Index doesn't exist, create it
      }

      await this.client.ft.create(
        this.config.indexName,
        {
          '$.id': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.content': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.metadata.userId': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.metadata.chatId': {
            type: SchemaFieldTypes.NUMERIC,
            SORTABLE: true
          },
          '$.metadata.category': {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true
          },
          '$.metadata.importance': {
            type: SchemaFieldTypes.NUMERIC,
            SORTABLE: true
          },
          '$.metadata.tags': {
            type: SchemaFieldTypes.TAG,
            SEPARATOR: ','
          },
          '$.createdAt': {
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
          PREFIX: 'memory:'
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

  async createMemory(input: CreateMemoryInput): Promise<Memory> {
    try {
      const id = `memory:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()

      // Generate embedding for the content
      const embeddingResponse = await this.embedding.generateEmbedding(input.content)

      const memoryWithVector: MemoryWithVector = {
        id: id.replace('memory:', ''),
        content: input.content,
        metadata: {
          importance: 1,
          tags: [],
          ...input.metadata
        },
        createdAt: now,
        updatedAt: now,
        vector: embeddingResponse.vector
      }

      // Store in Redis
      await this.client.json.set(id, '$', memoryWithVector)

      this.logger.info('Memory created successfully', {
        id: memoryWithVector.id,
        contentLength: input.content.length,
        tokens: embeddingResponse.tokens
      })

      // Return memory without vector for API response
      const { vector, ...memory } = memoryWithVector
      return memory
    } catch (error) {
      this.logger.error('Failed to create memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        contentLength: input.content.length
      })
      throw error
    }
  }

  async getMemory(id: string): Promise<Memory | null> {
    try {
      const key = id.startsWith('memory:') ? id : `memory:${id}`
      const data = await this.client.json.get(key, { path: '$' })

      if (!data || !Array.isArray(data) || data.length === 0) {
        return null
      }

      const memoryWithVector = data[0] as MemoryWithVector
      const { vector, ...memory } = memoryWithVector

      // Convert date strings back to Date objects
      memory.createdAt = new Date(memory.createdAt)
      memory.updatedAt = new Date(memory.updatedAt)

      return memory
    } catch (error) {
      this.logger.error('Failed to get memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        id
      })
      return null
    }
  }

  async updateMemory(input: UpdateMemoryInput): Promise<Memory | null> {
    try {
      const key = input.id.startsWith('memory:') ? input.id : `memory:${input.id}`
      const existing = await this.client.json.get(key, { path: '$' })

      if (!existing || !Array.isArray(existing) || existing.length === 0) {
        return null
      }

      const memoryWithVector = existing[0] as MemoryWithVector
      const now = new Date()

      // Update content and regenerate embedding if content changed
      if (input.content && input.content !== memoryWithVector.content) {
        const embeddingResponse = await this.embedding.generateEmbedding(input.content)
        memoryWithVector.vector = embeddingResponse.vector
        memoryWithVector.content = input.content
      }

      // Update metadata
      if (input.metadata) {
        memoryWithVector.metadata = {
          ...memoryWithVector.metadata,
          ...input.metadata
        }
      }

      memoryWithVector.updatedAt = now

      await this.client.json.set(key, '$', memoryWithVector)

      this.logger.info('Memory updated successfully', { id: input.id })

      const { vector, ...memory } = memoryWithVector
      memory.updatedAt = now
      return memory
    } catch (error) {
      this.logger.error('Failed to update memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        id: input.id
      })
      throw error
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const key = id.startsWith('memory:') ? id : `memory:${id}`
      const result = await this.client.del(key)
      
      this.logger.info('Memory deleted', { id, deleted: result > 0 })
      return result > 0
    } catch (error) {
      this.logger.error('Failed to delete memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        id
      })
      return false
    }
  }

  async searchMemories(query: string, options: MemorySearchOptions = {}): Promise<MemorySearchResult[]> {
    try {
      const { limit = 10, threshold = 0.1, filter } = options

      // Generate embedding for the query
      const queryEmbedding = await this.embedding.generateEmbedding(query)

      // Build search query
      let searchQuery = '*'
      if (filter) {
        const filterParts: string[] = []
        
        if (filter.userId) {
          filterParts.push(`@metadata_userId:${filter.userId}`)
        }
        if (filter.chatId) {
          filterParts.push(`@metadata_chatId:[${filter.chatId} ${filter.chatId}]`)
        }
        if (filter.category) {
          filterParts.push(`@metadata_category:${filter.category}`)
        }
        if (filter.tags && filter.tags.length > 0) {
          filterParts.push(`@metadata_tags:{${filter.tags.join('|')}}`)
        }

        if (filterParts.length > 0) {
          searchQuery = filterParts.join(' ')
        }
      }

      // Perform vector search
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

      const memories: MemorySearchResult[] = []

      for (const doc of results.documents) {
        if (doc.value) {
          const memoryWithVector = JSON.parse(doc.value['$'] as string) as MemoryWithVector
          const score = parseFloat(doc.id.split(':')[1] || '0')
          
          // Apply threshold filter
          if (score >= threshold) {
            const { vector, ...memory } = memoryWithVector
            
            // Convert date strings back to Date objects
            memory.createdAt = new Date(memory.createdAt)
            memory.updatedAt = new Date(memory.updatedAt)

            memories.push({
              memory,
              score,
              distance: 1 - score // Convert similarity to distance
            })
          }
        }
      }

      this.logger.info('Memory search completed', {
        query: query.substring(0, 100),
        resultsCount: memories.length,
        totalFound: results.total
      })

      return memories
    } catch (error) {
      this.logger.error('Failed to search memories', {
        error: error instanceof Error ? error : new Error(String(error)),
        query: query.substring(0, 100)
      })
      throw error
    }
  }

  async listMemories(filter?: MemoryFilter, limit: number = 50): Promise<Memory[]> {
    try {
      let searchQuery = '*'
      
      if (filter) {
        const filterParts: string[] = []
        
        if (filter.userId) {
          filterParts.push(`@metadata_userId:${filter.userId}`)
        }
        if (filter.chatId) {
          filterParts.push(`@metadata_chatId:[${filter.chatId} ${filter.chatId}]`)
        }
        if (filter.category) {
          filterParts.push(`@metadata_category:${filter.category}`)
        }

        if (filterParts.length > 0) {
          searchQuery = filterParts.join(' ')
        }
      }

      const results = await this.client.ft.search(
        this.config.indexName,
        searchQuery,
        {
          LIMIT: { from: 0, size: limit },
          SORTBY: { BY: 'createdAt', DIRECTION: 'DESC' },
          RETURN: ['$']
        }
      )

      const memories: Memory[] = []

      for (const doc of results.documents) {
        if (doc.value) {
          const memoryWithVector = JSON.parse(doc.value['$'] as string) as MemoryWithVector
          const { vector, ...memory } = memoryWithVector
          
          // Convert date strings back to Date objects
          memory.createdAt = new Date(memory.createdAt)
          memory.updatedAt = new Date(memory.updatedAt)

          memories.push(memory)
        }
      }

      this.logger.info('Listed memories', { count: memories.length, filter })
      return memories
    } catch (error) {
      this.logger.error('Failed to list memories', {
        error: error instanceof Error ? error : new Error(String(error)),
        filter
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