import { IdeaStore } from '@raz2/idea-store'
import { createLogger } from '@raz2/shared'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaFilter } from '@raz2/shared'
import type { ExtendedIdea, Subtask, KanbanColumn, CreateIdeaRequest, UpdateIdeaRequest } from '../types'

export class IdeaService {
  private store: IdeaStore
  private logger = createLogger('idea-service')

  constructor(store: IdeaStore) {
    this.store = store
  }

  async createIdea(request: CreateIdeaRequest): Promise<ExtendedIdea> {
    try {
      const baseInput: CreateIdeaInput = {
        title: request.title,
        content: request.content,
        category: request.category,
        priority: request.priority,
        tags: request.tags,
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

      this.logger.info('Created idea with subtasks', {
        ideaId: idea.id,
        subtaskCount: subtasks.length
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

  private createKanbanColumns(subtasks: Subtask[]): KanbanColumn[] {
    const columns: KanbanColumn[] = [
      { id: 'todo', title: 'To Do', subtasks: [] },
      { id: 'in_progress', title: 'In Progress', subtasks: [] },
      { id: 'review', title: 'Review', subtasks: [] },
      { id: 'done', title: 'Done', subtasks: [] }
    ]

    subtasks.forEach(subtask => {
      const column = columns.find(col => col.id === subtask.status)
      if (column) {
        column.subtasks.push(subtask)
      }
    })

    return columns
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 