import { IdeaStore, type Idea, type IdeaSearchResult, type CreateIdeaInput, type UpdateIdeaInput, type Reminder } from '@raz2/idea-store'
import { createLogger } from '@raz2/shared'
import { ClaudeClient } from '@raz2/claude-api'

interface AIProcessedIdea {
  title: string
  description: string
  suggestedCategory?: string
  suggestedPriority?: string
  suggestedTags?: string[]
}

export class IdeaService {
  private ideaStore: IdeaStore | null = null
  private claude: ClaudeClient | null = null
  private logger = createLogger('idea-service')
  private isEnabled = false
  private isInitialized = false

  constructor(ideaStore?: IdeaStore, claude?: ClaudeClient) {
    if (ideaStore) {
      this.ideaStore = ideaStore
      this.isEnabled = true
      this.logger.info('Idea service initialized with store')
    } else {
      this.logger.info('Idea service initialized without store (disabled)')
    }
    
    if (claude) {
      this.claude = claude
      this.logger.info('AI processing enabled for idea enhancement')
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isEnabled || !this.ideaStore || this.isInitialized) {
      return
    }

    try {
      this.logger.info('Initializing idea store connection and index...')
      await this.ideaStore.initialize()
      this.isInitialized = true
      this.logger.info('Idea store initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error('Failed to initialize idea store', {
        error: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown'
        },
        isEnabled: this.isEnabled,
        hasStore: !!this.ideaStore,
        isInitialized: this.isInitialized
      })
      this.isEnabled = false
      throw error
    }
  }

  async initializeStore(): Promise<void> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.warn('Cannot initialize idea store - service is disabled or store is null')
      return
    }

    if (this.isInitialized) {
      this.logger.debug('Idea store already initialized')
      return
    }

    await this.ensureInitialized()
  }

  private async processIdeaWithAI(content: string, originalTitle?: string): Promise<AIProcessedIdea> {
    if (!this.claude) {
      return {
        title: originalTitle || 'Strategic Idea',
        description: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      }
    }

    try {
      const prompt = `Analyze the following business idea/insight and provide a structured response:

Content: "${content}"
Original title: "${originalTitle || 'Not provided'}"

Please provide:
1. A clear, concise title (max 80 characters) that captures the essence of the idea
2. A brief description (max 200 characters) that summarizes the key points
3. Suggested category from: strategy, product, sales, partnerships, competitive, market, team, operations
4. Suggested priority from: low, medium, high, urgent
5. 3-5 relevant tags for categorization

Format your response as JSON:
{
  "title": "...",
  "description": "...",
  "suggestedCategory": "...",
  "suggestedPriority": "...",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`

      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      
      try {
        const jsonStart = response.content.indexOf('{')
        const jsonEnd = response.content.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = response.content.substring(jsonStart, jsonEnd + 1)
          const parsed = JSON.parse(jsonStr)
          
          return {
            title: parsed.title || originalTitle || 'Strategic Idea',
            description: parsed.description || content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            suggestedCategory: parsed.suggestedCategory,
            suggestedPriority: parsed.suggestedPriority,
            suggestedTags: parsed.suggestedTags
          }
        }
      } catch (parseError) {
        this.logger.warn('Failed to parse AI response as JSON', {
          error: parseError instanceof Error ? parseError : new Error(String(parseError)),
          response: response.content.substring(0, 200)
        })
      }
      
      const titleMatch = response.content.match(/title['":]?\s*['"](.*?)['"]/i)
      const descMatch = response.content.match(/description['":]?\s*['"](.*?)['"]/i)
      
      return {
        title: titleMatch?.[1] || originalTitle || 'Strategic Idea',
        description: descMatch?.[1] || content.substring(0, 200) + (content.length > 200 ? '...' : '')
      }
      
    } catch (error) {
      this.logger.error('Failed to process idea with AI', {
        error: error instanceof Error ? error : new Error(String(error)),
        contentLength: content.length
      })
      
      return {
        title: originalTitle || 'Strategic Idea',
        description: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      }
    }
  }

  async captureStrategicIdea(
    title: string,
    content: string,
    userId: string,
    chatId: number,
    category: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations' = 'strategy',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    tags: string[] = [],
    reminderDate?: Date
  ): Promise<Idea | null> {
    if (!this.isEnabled || !this.ideaStore) {
      return null
    }

    try {
      await this.ensureInitialized()
      
      const shouldEnhanceWithAI = title === 'Manual Capture' || title.length < 10 || /^(idea|thought|note)$/i.test(title.trim())
      
      let finalTitle = title
      let finalContent = content
      let finalCategory = category
      let finalPriority = priority
      let finalTags = [...tags, 'telegram', 'captured']
      
      if (shouldEnhanceWithAI && content.length > 10) {
        this.logger.info('Enhancing idea with AI processing', {
          originalTitle: title,
          contentLength: content.length,
          userId,
          chatId
        })
        
        const processed = await this.processIdeaWithAI(content, title)
        
        finalTitle = processed.title
        
        if (processed.description && processed.description !== content) {
          finalContent = `${processed.description}\n\nOriginal content: ${content}`
        }
        
        if (processed.suggestedCategory && category === 'strategy') {
          finalCategory = processed.suggestedCategory as typeof category
        }
        
        if (processed.suggestedPriority && priority === 'medium') {
          finalPriority = processed.suggestedPriority as typeof priority
        }
        
        if (processed.suggestedTags) {
          finalTags = [...finalTags, ...processed.suggestedTags, 'ai-enhanced']
        }
        
        this.logger.info('AI processing completed', {
          originalTitle: title,
          enhancedTitle: finalTitle,
          suggestedCategory: processed.suggestedCategory,
          suggestedPriority: processed.suggestedPriority,
          suggestedTags: processed.suggestedTags,
          userId,
          chatId
        })
      }
      
      const ideaInput: CreateIdeaInput = {
        title: finalTitle,
        content: finalContent,
        category: finalCategory,
        priority: finalPriority,
        tags: finalTags,
        userId,
        chatId,
        reminders: reminderDate ? [{
          type: 'once',
          scheduledFor: reminderDate,
          message: `Review strategic idea: ${finalTitle}`
        }] : []
      }

      const idea = await this.ideaStore.createIdea(ideaInput)

      this.logger.info('Captured strategic idea', {
        ideaId: idea.id,
        title: finalTitle,
        category: finalCategory,
        priority: finalPriority,
        userId,
        chatId,
        hasReminder: !!reminderDate,
        wasEnhanced: shouldEnhanceWithAI
      })

      return idea
    } catch (error) {
      this.logger.error('Failed to capture strategic idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        title,
        category,
        userId,
        chatId
      })
      return null
    }
  }

  async captureClientInsight(
    content: string,
    userId: string,
    chatId: number,
    clientName?: string,
    dealSize?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'high'
  ): Promise<Idea | null> {
    if (!this.isEnabled || !this.ideaStore) {
      return null
    }

    try {
      await this.ensureInitialized()
      
      const title = clientName ? `Client Insight: ${clientName}` : 'Client Insight'
      const tags = ['client-insight', 'sales']
      if (clientName) tags.push(clientName.toLowerCase().replace(/\s+/g, '-'))
      if (dealSize) tags.push(`deal-${dealSize.toLowerCase()}`)

      const idea = await this.ideaStore.createIdea({
        title,
        content,
        category: 'sales',
        priority,
        tags,
        userId,
        chatId
      })

      this.logger.info('Captured client insight', {
        ideaId: idea.id,
        clientName,
        dealSize,
        priority,
        userId,
        chatId
      })

      return idea
    } catch (error) {
      this.logger.error('Failed to capture client insight', {
        error: error instanceof Error ? error : new Error(String(error)),
        clientName,
          userId,
        chatId
      })
      return null
    }
  }

  async captureProductIdea(
    title: string,
    content: string,
    userId: string,
    chatId: number,
    userImpact?: string,
    technicalComplexity?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<Idea | null> {
    if (!this.isEnabled || !this.ideaStore) {
      return null
    }

    try {
      await this.ensureInitialized()
      
      const tags = ['product-idea', 'guild-platform']
      if (userImpact) tags.push(`impact-${userImpact.toLowerCase()}`)
      if (technicalComplexity) tags.push(`complexity-${technicalComplexity.toLowerCase()}`)

      const idea = await this.ideaStore.createIdea({
        title,
        content,
        category: 'product',
        priority,
        tags,
        userId,
        chatId
      })

      this.logger.info('Captured product idea', {
        ideaId: idea.id,
        title,
        userImpact,
        technicalComplexity,
        priority,
        userId,
        chatId
      })

      return idea
    } catch (error) {
      this.logger.error('Failed to capture product idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        title,
        userId,
        chatId
      })
      return null
    }
  }

  async searchRelevantIdeas(
    query: string,
    userId: string,
    limit: number = 5,
    category?: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'
  ): Promise<IdeaSearchResult[]> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.debug('Search skipped - service disabled or store not available', {
        isEnabled: this.isEnabled,
        hasStore: !!this.ideaStore
      })
      return []
    }

    try {
      await this.ensureInitialized()
      
      const results = await this.ideaStore.searchIdeas(query, {
        limit,
        threshold: 0.1,
        filter: { 
          userId,
          category
        }
      })

      this.logger.debug('Retrieved relevant ideas', {
        query: query.substring(0, 50),
        userId,
        category,
        resultCount: results.length,
        scores: results.map((r: IdeaSearchResult) => r.score.toFixed(3))
      })

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error('Failed to search ideas', {
        error: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown'
        },
        userId,
        query: query.substring(0, 50),
        category,
        isEnabled: this.isEnabled,
        isInitialized: this.isInitialized
      })
      return []
    }
  }

  async getUserIdeas(userId: string, limit: number = 20): Promise<Idea[]> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.warn('Cannot get user ideas - service disabled or store is null')
      return []
    }

    try {
      await this.ensureInitialized()
      
      const ideas = await this.ideaStore.listIdeas({ userId }, limit)
      
      this.logger.info('Retrieved user strategic ideas', {
        userId,
        count: ideas.length,
        limit
      })
      
      return ideas
    } catch (error) {
      this.logger.error('Failed to get user strategic ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        userId,
        limit
      })
      return []
    }
  }

  async createIdea(input: CreateIdeaInput): Promise<Idea | null> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.warn('Cannot create idea - service disabled or store is null')
      return null
    }

    try {
      await this.ensureInitialized()
      
      const idea = await this.ideaStore.createIdea(input)
      
      this.logger.info('Created idea via API', {
        ideaId: idea.id,
        title: idea.title,
        userId: idea.userId
      })
      
      return idea
    } catch (error) {
      this.logger.error('Failed to create idea via API', {
        error: error instanceof Error ? error : new Error(String(error)),
        title: input.title,
        userId: input.userId
      })
      return null
    }
  }

  async updateIdea(input: UpdateIdeaInput): Promise<Idea | null> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.warn('Cannot update idea - service disabled or store is null')
      return null
    }

    try {
      await this.ensureInitialized()
      
      const idea = await this.ideaStore.updateIdea(input)
      
      if (idea) {
        this.logger.info('Updated idea via API', {
          ideaId: idea.id,
          title: idea.title,
          userId: idea.userId
        })
      }
      
      return idea
    } catch (error) {
      this.logger.error('Failed to update idea via API', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: input.id
      })
      return null
    }
  }

  async deleteIdea(ideaId: string, userId: string): Promise<boolean> {
    if (!this.isEnabled || !this.ideaStore) {
      return false
    }

    try {
      const idea = await this.ideaStore.getIdea(ideaId)
      if (!idea || idea.userId !== userId) {
        this.logger.warn('Attempted to delete idea not owned by user', {
          ideaId,
          userId,
          ideaExists: !!idea,
          ideaUserId: idea?.userId
        })
        return false
      }

      const deleted = await this.ideaStore.deleteIdea(ideaId)
      
      this.logger.info('Deleted idea', {
        ideaId,
        userId,
        success: deleted
      })

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId,
        userId
      })
      return false
    }
  }

  async getDueReminders(): Promise<Reminder[]> {
    if (!this.isEnabled || !this.ideaStore) {
      return []
    }

    try {
      await this.ensureInitialized()
      
      const reminders = await this.ideaStore.getDueReminders()
      
      this.logger.info('Retrieved due reminders', {
        count: reminders.length
      })

      return reminders
    } catch (error) {
      this.logger.error('Failed to get due reminders', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return []
    }
  }

  async markReminderSent(reminderId: string): Promise<void> {
    if (!this.isEnabled || !this.ideaStore) {
      return
    }

    try {
      await this.ensureInitialized()
      await this.ideaStore.markReminderSent(reminderId)
      
      this.logger.info('Marked reminder as sent', { reminderId })
    } catch (error) {
      this.logger.error('Failed to mark reminder as sent', {
        error: error instanceof Error ? error : new Error(String(error)),
        reminderId
      })
    }
  }

  buildStrategicContext(ideas: IdeaSearchResult[], maxLength: number = 1000): string {
    if (ideas.length === 0) {
      return ''
    }

    const context = ideas
      .slice(0, 5)
      .map((result, index) => {
        const idea = result.idea
        return `${index + 1}. [${idea.category.toUpperCase()}] ${idea.title} (Priority: ${idea.priority})\n   ${idea.content.substring(0, 200)}${idea.content.length > 200 ? '...' : ''}`
      })
      .join('\n\n')

    if (context.length <= maxLength) {
      return context
    }

    return context.substring(0, maxLength - 3) + '...'
  }

  async getStats(userId?: string): Promise<{ count: number; categories: Record<string, number> }> {
    if (!this.isEnabled || !this.ideaStore) {
      this.logger.debug('Get stats skipped - service disabled or store not available', {
        isEnabled: this.isEnabled,
        hasStore: !!this.ideaStore
      })
      return { count: 0, categories: {} }
    }

    try {
      await this.ensureInitialized()
      
      const ideas = await this.ideaStore.listIdeas(userId ? { userId } : undefined, 1000)

      const categories = ideas.reduce((acc: Record<string, number>, idea: Idea) => {
        acc[idea.category] = (acc[idea.category] || 0) + 1
        return acc
      }, {})

      return {
        count: ideas.length,
        categories
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error('Failed to get stats', {
        error: {
          message: errorMessage,
          stack: errorStack,
          name: error instanceof Error ? error.name : 'Unknown'
        },
        userId,
        isEnabled: this.isEnabled,
        isInitialized: this.isInitialized
      })
      return { count: 0, categories: {} }
    }
  }

  isIdeaEnabled(): boolean {
    return this.isEnabled
  }

  async disconnect(): Promise<void> {
    if (this.ideaStore) {
      await this.ideaStore.disconnect()
    }
  }
} 