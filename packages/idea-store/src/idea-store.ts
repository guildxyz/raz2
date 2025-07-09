import { desc, eq, and, sql, cosineDistance, inArray } from 'drizzle-orm'
import { createLogger } from '@raz2/shared'
import { EmbeddingService } from './embedding'
import { createDatabase, enablePgVector, type Database } from './db'
import { ideas, reminders, type IdeaRow, type ReminderRow } from './schema'
import type {
  Idea,
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
  private db: Database
  private embedding: EmbeddingService
  private logger = createLogger('idea-store')
  private config: IdeaStoreConfig
  private isConnected = false
  private isInitialized = false

  constructor(config: IdeaStoreConfig) {
    this.config = config
    this.db = createDatabase(config.databaseUrl)
    this.embedding = new EmbeddingService(config.openaiApiKey, config.embeddingModel)
    this.logger.info('IdeaStore initialized with PostgreSQL + pgvector')
  }

  async initialize(): Promise<void> {
    try {
      await enablePgVector(this.db)
      this.isConnected = true
      this.isInitialized = true
      this.logger.info('Idea store initialized successfully with pgvector')
    } catch (error) {
      this.logger.error('Failed to initialize idea store', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  async createIdea(input: CreateIdeaInput): Promise<Idea> {
    try {
      const embeddingResponse = await this.embedding.generateEmbedding(
        `${input.title} ${input.content}`
      )

      const [ideaRow] = await this.db
        .insert(ideas)
        .values({
          title: input.title,
          content: input.content,
          category: input.category || 'strategy',
          priority: input.priority || 'medium',
          status: 'active',
          tags: input.tags || [],
          userId: input.userId,
          chatId: input.chatId,
          embedding: embeddingResponse.vector,
        })
        .returning()

      let reminderRows: ReminderRow[] = []
      if (input.reminders && input.reminders.length > 0) {
        reminderRows = await this.db
          .insert(reminders)
          .values(
            input.reminders.map((reminder: CreateReminderInput) => ({
              ideaId: ideaRow.id,
              type: reminder.type,
              scheduledFor: reminder.scheduledFor,
              message: reminder.message,
              isActive: true,
              isSent: false,
            }))
          )
          .returning()
      }

      this.logger.info('Idea created successfully', {
        id: ideaRow.id,
        title: input.title,
        reminders: reminderRows.length
      })

      return this.mapIdeaRowToIdea(ideaRow, reminderRows)
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
      const [ideaRow] = await this.db
        .select()
        .from(ideas)
        .where(eq(ideas.id, id))
        .limit(1)

      if (!ideaRow) {
        return null
      }

      const reminderRows = await this.db
        .select()
        .from(reminders)
        .where(eq(reminders.ideaId, id))

      return this.mapIdeaRowToIdea(ideaRow, reminderRows)
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
      const updateData: Partial<IdeaRow> = {
        updatedAt: new Date(),
      }

      if (input.title) updateData.title = input.title
      if (input.content) updateData.content = input.content
      if (input.category) updateData.category = input.category
      if (input.priority) updateData.priority = input.priority
      if (input.status) updateData.status = input.status
      if (input.tags) updateData.tags = input.tags

      if (input.title || input.content) {
        const existingIdea = await this.getIdea(input.id)
        if (!existingIdea) return null

        const embeddingText = `${input.title || existingIdea.title} ${input.content || existingIdea.content}`
        const embeddingResponse = await this.embedding.generateEmbedding(embeddingText)
        updateData.embedding = embeddingResponse.vector
      }

      const [updatedIdeaRow] = await this.db
        .update(ideas)
        .set(updateData)
        .where(eq(ideas.id, input.id))
        .returning()

      if (!updatedIdeaRow) {
        return null
      }

      if (input.reminders) {
        await this.db.delete(reminders).where(eq(reminders.ideaId, input.id))
        
        if (input.reminders.length > 0) {
          await this.db
            .insert(reminders)
            .values(
              input.reminders.map((reminder: CreateReminderInput) => ({
                ideaId: input.id,
                type: reminder.type,
                scheduledFor: reminder.scheduledFor,
                message: reminder.message,
                isActive: true,
                isSent: false,
              }))
            )
        }
      }

      const reminderRows = await this.db
        .select()
        .from(reminders)
        .where(eq(reminders.ideaId, input.id))

      this.logger.info('Idea updated successfully', {
        id: updatedIdeaRow.id,
        title: updatedIdeaRow.title
      })

      return this.mapIdeaRowToIdea(updatedIdeaRow, reminderRows)
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
      const result = await this.db
        .delete(ideas)
        .where(eq(ideas.id, id))
        .returning({ id: ideas.id })

      const deleted = result.length > 0
      this.logger.info('Idea deleted', { id, deleted })
      return deleted
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
      const { limit = 10, threshold = 0.1, filter } = options

      this.logger.debug('Generating embedding for search query', {
        query: query.substring(0, 100),
        queryLength: query.length
      })

      const queryEmbedding = await this.embedding.generateEmbedding(query)
      const similarity = sql`1 - (${cosineDistance(ideas.embedding, queryEmbedding.vector)})`

      const baseQuery = this.db
        .select({
          idea: ideas,
          similarity
        })
        .from(ideas)

      const conditions = [sql`${similarity} > ${threshold}`]
      
      if (filter) {
        if (filter.userId) conditions.push(eq(ideas.userId, filter.userId))
        if (filter.chatId) conditions.push(eq(ideas.chatId, filter.chatId))
        if (filter.category) conditions.push(eq(ideas.category, filter.category))
        if (filter.priority) conditions.push(eq(ideas.priority, filter.priority))
        if (filter.status) conditions.push(eq(ideas.status, filter.status))
        if (filter.tags && filter.tags.length > 0) {
          conditions.push(sql`${ideas.tags} && ${filter.tags}`)
        }
      }

      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(desc(similarity))
        .limit(limit)

      const searchResults: IdeaSearchResult[] = []

      for (const result of results) {
        const reminderRows = await this.db
          .select()
          .from(reminders)
          .where(eq(reminders.ideaId, result.idea.id))

        const idea = this.mapIdeaRowToIdea(result.idea, reminderRows)
        const score = Number(result.similarity)

        searchResults.push({
          idea,
          score,
          distance: 1 - score
        })
      }

      this.logger.info('Idea search completed', {
        query: query.substring(0, 100),
        resultsCount: searchResults.length,
        threshold
      })

      return searchResults
    } catch (error) {
      this.logger.error('Failed to search ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        query: query.substring(0, 100)
      })
      throw error
    }
  }

  async listIdeas(filter?: IdeaFilter, limit: number = 50): Promise<Idea[]> {
    try {
      const baseQuery = this.db
        .select()
        .from(ideas)

      const conditions = []
      if (filter) {
        if (filter.userId) conditions.push(eq(ideas.userId, filter.userId))
        if (filter.chatId) conditions.push(eq(ideas.chatId, filter.chatId))
        if (filter.category) conditions.push(eq(ideas.category, filter.category))
        if (filter.priority) conditions.push(eq(ideas.priority, filter.priority))
        if (filter.status) conditions.push(eq(ideas.status, filter.status))
        if (filter.tags && filter.tags.length > 0) {
          conditions.push(sql`${ideas.tags} && ${filter.tags}`)
        }
      }

      const queryWithFilter = conditions.length > 0 
        ? baseQuery.where(and(...conditions))
        : baseQuery

      const ideaRows = await queryWithFilter
        .orderBy(desc(ideas.createdAt))
        .limit(limit)

      const resultIdeas: Idea[] = []

      for (const ideaRow of ideaRows) {
        const reminderRows = await this.db
          .select()
          .from(reminders)
          .where(eq(reminders.ideaId, ideaRow.id))

        resultIdeas.push(this.mapIdeaRowToIdea(ideaRow, reminderRows))
      }

      this.logger.info('Listed ideas', {
        count: resultIdeas.length,
        filter
      })

      return resultIdeas
    } catch (error) {
      this.logger.error('Failed to list ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        filter
      })
      throw error
    }
  }

  async getDueReminders(): Promise<Reminder[]> {
    try {
      const now = new Date()
      const dueReminderRows = await this.db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.isActive, true),
            eq(reminders.isSent, false),
            sql`${reminders.scheduledFor} <= ${now}`
          )
        )

      return dueReminderRows.map(this.mapReminderRowToReminder)
    } catch (error) {
      this.logger.error('Failed to get due reminders', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  async markReminderSent(reminderId: string): Promise<void> {
    try {
      await this.db
        .update(reminders)
        .set({
          isSent: true,
          updatedAt: new Date()
        })
        .where(eq(reminders.id, reminderId))

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
      const [result] = await this.db
        .select({
          count: sql<number>`count(*)`
        })
        .from(ideas)

      return {
        count: result.count,
        indexSize: 0
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
      this.isConnected = false
      this.logger.info('Disconnected from PostgreSQL')
    } catch (error) {
      this.logger.error('Error disconnecting from PostgreSQL', {
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }

  private mapIdeaRowToIdea(ideaRow: IdeaRow, reminderRows: ReminderRow[] = []): Idea {
    return {
      id: ideaRow.id,
      title: ideaRow.title,
      content: ideaRow.content,
      category: ideaRow.category,
      priority: ideaRow.priority,
      status: ideaRow.status,
      tags: ideaRow.tags || [],
      userId: ideaRow.userId,
      chatId: ideaRow.chatId || undefined,
      createdAt: ideaRow.createdAt,
      updatedAt: ideaRow.updatedAt,
      reminders: reminderRows.map(this.mapReminderRowToReminder)
    }
  }

  private mapReminderRowToReminder(reminderRow: ReminderRow): Reminder {
    return {
      id: reminderRow.id,
      ideaId: reminderRow.ideaId,
      type: reminderRow.type,
      scheduledFor: reminderRow.scheduledFor,
      message: reminderRow.message || undefined,
      isActive: reminderRow.isActive,
      isSent: reminderRow.isSent,
      createdAt: reminderRow.createdAt,
      updatedAt: reminderRow.updatedAt
    }
  }
} 