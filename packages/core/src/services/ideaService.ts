import { IdeaStore } from '@raz2/idea-store'
import { createLogger } from '@raz2/shared'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaFilter, IdeaCategory, IdeaPriority } from '@raz2/shared'
import type { ExtendedIdea, Subtask, KanbanColumn, CreateIdeaRequest, UpdateIdeaRequest } from '../types'
import { AIService } from './aiService'

export class IdeaService {
  private store: IdeaStore
  private aiService?: AIService
  private logger = createLogger('idea-service')

  constructor(store: IdeaStore, aiService?: AIService) {
    this.store = store
    this.aiService = aiService
  }

  async createIdea(request: CreateIdeaRequest): Promise<ExtendedIdea> {
    try {
      let enhancedTitle = request.title
      let enhancedContent = request.content
      let finalCategory = request.category
      let finalPriority = request.priority
      let finalTags = request.tags || []

      if (this.aiService && (request.title === 'Manual Capture' || request.title.length < 10)) {
        this.logger.info('Enhancing idea with AI processing', {
          originalTitle: request.title,
          contentLength: request.content.length
        })

        const enhancement = await this.aiService.enhanceIdea(request.title, request.content)
        
        if (enhancement.enhancedTitle) {
          enhancedTitle = enhancement.enhancedTitle
        }
        if (enhancement.enhancedContent) {
          enhancedContent = enhancement.enhancedContent
        }
        if (enhancement.suggestedCategory && !request.category) {
          finalCategory = enhancement.suggestedCategory as IdeaCategory
        }
        if (enhancement.suggestedPriority && !request.priority) {
          finalPriority = enhancement.suggestedPriority as IdeaPriority
        }
        if (enhancement.suggestedTags) {
          finalTags = [...finalTags, ...enhancement.suggestedTags].filter((tag, index, arr) => 
            arr.indexOf(tag) === index
          )
        }
      }

      const baseInput: CreateIdeaInput = {
        title: enhancedTitle,
        content: enhancedContent,
        category: finalCategory,
        priority: finalPriority,
        tags: finalTags,
        userId: request.userId,
        chatId: request.chatId,
        reminders: request.reminders
      }

      const idea = await this.store.createIdea(baseInput)
      
      let subtasks: Subtask[] = []
      let aiBreakdown = undefined

      if (request.generateSubtasks !== false) {
        subtasks = [
          {
            id: this.generateId(),
            title: 'Research and Planning',
            description: `Research requirements and create plan for: ${enhancedTitle}`,
            status: 'todo' as const,
            priority: 'high' as const,
            estimatedHours: 2,
            tags: ['research', 'planning'],
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: this.generateId(),
            title: 'Implementation',
            description: `Implement the main components for: ${enhancedTitle}`,
            status: 'todo' as const,
            priority: 'high' as const,
            estimatedHours: 4,
            tags: ['development'],
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }

      const extendedIdea: ExtendedIdea = {
        ...idea,
        subtasks,
        kanbanColumns: this.createKanbanColumns(subtasks),
        aiBreakdown
      }

      this.logger.info('Created idea with AI enhancement', {
        ideaId: idea.id,
        originalTitle: request.title,
        enhancedTitle: enhancedTitle,
        subtaskCount: subtasks.length,
        aiEnhanced: !!this.aiService
      })

      return extendedIdea
    } catch (error) {
      this.logger.error('Failed to create idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        title: request.title
      })
      throw error
    }
  }

  async updateIdea(request: UpdateIdeaRequest): Promise<ExtendedIdea | null> {
    try {
      const baseInput: UpdateIdeaInput = {
        id: request.id,
        title: request.title,
        content: request.content,
        category: request.category,
        priority: request.priority,
        status: request.status,
        tags: request.tags,
        reminders: request.reminders
      }

      const idea = await this.store.updateIdea(baseInput)
      if (!idea) return null

      let subtasks = request.subtasks || []
      let aiBreakdown = undefined

      if (request.regenerateSubtasks && request.title && request.content) {
        subtasks = [
          {
            id: this.generateId(),
            title: 'Research and Planning',
            description: `Research requirements and create plan for: ${request.title}`,
            status: 'todo' as const,
            priority: 'high' as const,
            estimatedHours: 2,
            tags: ['research', 'planning'],
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: this.generateId(),
            title: 'Implementation',
            description: `Implement the main components for: ${request.title}`,
            status: 'todo' as const,
            priority: 'high' as const,
            estimatedHours: 4,
            tags: ['development'],
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }

      const extendedIdea: ExtendedIdea = {
        ...idea,
        subtasks,
        kanbanColumns: this.createKanbanColumns(subtasks),
        aiBreakdown
      }

      return extendedIdea
    } catch (error) {
      this.logger.error('Failed to update idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: request.id
      })
      throw error
    }
  }

  async deleteIdea(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.store.deleteIdea(id)
      
      this.logger.info('Deleted idea', {
        ideaId: id,
        userId,
        success: result
      })

      return result
    } catch (error) {
      this.logger.error('Failed to delete idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: id
      })
      throw error
    }
  }

  async listIdeas(filter?: IdeaFilter, limit: number = 50): Promise<ExtendedIdea[]> {
    try {
      const ideas = await this.store.listIdeas(filter, limit)
      
      return ideas.map(idea => ({
        ...idea,
        subtasks: [],
        kanbanColumns: this.createKanbanColumns([]),
        aiBreakdown: undefined
      }))
    } catch (error) {
      this.logger.error('Failed to list ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        filter
      })
      throw error
    }
  }

  async searchIdeas(query: string, limit: number = 20): Promise<ExtendedIdea[]> {
    try {
      const results = await this.store.searchIdeas(query, { limit })
      
      return results.map(result => ({
        ...result.idea,
        subtasks: [],
        kanbanColumns: this.createKanbanColumns([]),
        aiBreakdown: undefined
      }))
    } catch (error) {
      this.logger.error('Failed to search ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        query
      })
      throw error
    }
  }

  async analyzeIdea(id: string): Promise<any> {
    try {
      const idea = await this.store.getIdea(id)
      if (!idea || !this.aiService) return null

      const content = `${idea.title}\n\n${idea.content}`
      const response = await this.aiService.processRequest({
        type: 'generate_insights',
        content,
        context: {
          category: idea.category,
          priority: idea.priority,
          tags: idea.tags
        }
      })

      if (response.success) {
        this.logger.info('Generated AI insights for idea', {
          ideaId: id,
          insightCount: response.insights?.length || 0
        })
        return response.data
      }

      return null
    } catch (error) {
      this.logger.error('Failed to analyze idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: id
      })
      return null
    }
  }

  async getIdeaStats(): Promise<{
    total: number
    byCategory: Record<string, number>
    byPriority: Record<string, number>
    byStatus: Record<string, number>
    recent: number
  }> {
    try {
      const ideas = await this.store.listIdeas(undefined, 1000)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const byCategory: Record<string, number> = {}
      const byPriority: Record<string, number> = {}
      const byStatus: Record<string, number> = {}
      let recent = 0

      ideas.forEach(idea => {
        byCategory[idea.category] = (byCategory[idea.category] || 0) + 1
        byPriority[idea.priority] = (byPriority[idea.priority] || 0) + 1
        byStatus[idea.status] = (byStatus[idea.status] || 0) + 1
        
        if (idea.createdAt >= weekAgo) {
          recent++
        }
      })

      return {
        total: ideas.length,
        byCategory,
        byPriority,
        byStatus,
        recent
      }
    } catch (error) {
      this.logger.error('Failed to get idea stats', { 
        error: error instanceof Error ? error : new Error(String(error))
      })
      return {
        total: 0,
        byCategory: {},
        byPriority: {},
        byStatus: {},
        recent: 0
      }
    }
  }

  private createKanbanColumns(subtasks: Subtask[]): KanbanColumn[] {
    return [
      {
        id: 'todo',
        title: 'To Do',
        subtasks: subtasks.filter(t => t.status === 'todo')
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        subtasks: subtasks.filter(t => t.status === 'in_progress')
      },
      {
        id: 'review',
        title: 'Review',
        subtasks: subtasks.filter(t => t.status === 'review')
      },
      {
        id: 'done',
        title: 'Done',
        subtasks: subtasks.filter(t => t.status === 'done')
      }
    ]
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
} 