import { MemoryStore, type Memory, type MemorySearchResult, type CreateMemoryInput } from '@raz2/memory-store'
import { createLogger } from '@raz2/shared'

export class MemoryService {
  private memoryStore: MemoryStore | null = null
  private logger = createLogger('memory-service')
  private isEnabled = false
  private isInitialized = false

  constructor(memoryStore?: MemoryStore) {
    if (memoryStore) {
      this.memoryStore = memoryStore
      this.isEnabled = true
      this.logger.info('Memory service initialized with store')
    } else {
      this.logger.info('Memory service initialized without store (disabled)')
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isEnabled || !this.memoryStore || this.isInitialized) {
      return
    }

    try {
      await this.memoryStore.initialize()
      this.isInitialized = true
      this.logger.info('Memory store initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize memory store', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      // Disable memory service if initialization fails
      this.isEnabled = false
      throw error
    }
  }

  async storeConversationMemory(
    content: string,
    userId: string,
    chatId: number,
    userName?: string
  ): Promise<Memory | null> {
    if (!this.isEnabled || !this.memoryStore) {
      return null
    }

    try {
      await this.ensureInitialized()
      const memory = await this.memoryStore.createMemory({
        content,
        metadata: {
          userId,
          chatId,
          category: 'conversation',
          importance: 1,
          tags: ['chat', 'conversation'],
          source: 'telegram',
          userName
        }
      })

      this.logger.info('Stored conversation memory', {
        memoryId: memory.id,
        userId,
        chatId,
        contentLength: content.length
      })

      return memory
    } catch (error) {
      this.logger.error('Failed to store conversation memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId,
        chatId,
        contentLength: content.length
      })
      return null
    }
  }

  async storeUserPreference(
    content: string,
    userId: string,
    chatId: number,
    importance: number = 3
  ): Promise<Memory | null> {
    if (!this.isEnabled || !this.memoryStore) {
      return null
    }

    try {
      await this.ensureInitialized()
      
      const memory = await this.memoryStore.createMemory({
        content,
        metadata: {
          userId,
          chatId,
          category: 'preference',
          importance,
          tags: ['preference', 'user-info'],
          source: 'telegram'
        }
      })

      this.logger.info('Stored user preference', {
        memoryId: memory.id,
        userId,
        importance,
        contentLength: content.length
      })

      return memory
    } catch (error) {
      this.logger.error('Failed to store user preference', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId,
        contentLength: content.length
      })
      return null
    }
  }

  async searchRelevantMemories(
    query: string,
    userId: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    if (!this.isEnabled || !this.memoryStore) {
      return []
    }

    try {
      await this.ensureInitialized()
      
      const results = await this.memoryStore.searchMemories(query, {
        limit,
        threshold: 0.1,
        filter: { userId }
      })

      this.logger.debug('Retrieved relevant memories', {
        query: query.substring(0, 50),
        userId,
        resultCount: results.length,
        scores: results.map((r: MemorySearchResult) => r.score.toFixed(3))
      })

      return results
    } catch (error) {
      this.logger.error('Failed to search memories', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId,
        query: query.substring(0, 50)
      })
      return []
    }
  }

  async getUserMemories(userId: string, limit: number = 20): Promise<Memory[]> {
    if (!this.isEnabled || !this.memoryStore) {
      return []
    }

    try {
      await this.ensureInitialized()
      
      const memories = await this.memoryStore.listMemories({ userId }, limit)
      
      this.logger.info('Retrieved user memories', {
        userId,
        count: memories.length
      })

      return memories
    } catch (error) {
      this.logger.error('Failed to get user memories', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId
      })
      return []
    }
  }

  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    if (!this.isEnabled || !this.memoryStore) {
      return false
    }

    try {
      const memory = await this.memoryStore.getMemory(memoryId)
      if (!memory || memory.metadata.userId !== userId) {
        this.logger.warn('Attempted to delete memory not owned by user', {
          memoryId,
          userId,
          memoryExists: !!memory,
          memoryUserId: memory?.metadata.userId
        })
        return false
      }

      const deleted = await this.memoryStore.deleteMemory(memoryId)
      
      this.logger.info('Deleted memory', {
        memoryId,
        userId,
        success: deleted
      })

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete memory', {
        error: error instanceof Error ? error : new Error(String(error)),
        memoryId,
        userId
      })
      return false
    }
  }

  buildMemoryContext(memories: MemorySearchResult[], maxLength: number = 1000): string {
    if (memories.length === 0) {
      return ''
    }

    const contextParts = ['Previous relevant context:']
    let currentLength = contextParts[0].length

    for (const { memory, score } of memories) {
      const memoryText = `- ${memory.content} (${memory.metadata.category || 'general'})`
      
      if (currentLength + memoryText.length > maxLength) {
        break
      }

      contextParts.push(memoryText)
      currentLength += memoryText.length
    }

    if (contextParts.length === 1) {
      return ''
    }

    return contextParts.join('\n')
  }

  async getStats(userId?: string): Promise<{ count: number; categories: Record<string, number> }> {
    if (!this.isEnabled || !this.memoryStore) {
      return { count: 0, categories: {} }
    }

    try {
      const memories = await this.memoryStore.listMemories(
        userId ? { userId } : undefined, 
        1000
      )

      const categories: Record<string, number> = {}
      for (const memory of memories) {
        const category = memory.metadata.category || 'general'
        categories[category] = (categories[category] || 0) + 1
      }

      return {
        count: memories.length,
        categories
      }
    } catch (error) {
      this.logger.error('Failed to get memory stats', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId
      })
      return { count: 0, categories: {} }
    }
  }

  isMemoryEnabled(): boolean {
    return this.isEnabled
  }
} 