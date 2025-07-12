export type IdeaCategory = 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'

export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'

export type IdeaStatus = 'active' | 'in_progress' | 'completed' | 'archived' | 'cancelled'

export type SubtaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Subtask {
  id: string
  title: string
  description?: string
  status: SubtaskStatus
  priority: IdeaPriority
  assignee?: string
  estimatedHours?: number
  tags: string[]
  dependencies: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface KanbanColumn {
  id: SubtaskStatus
  title: string
  subtasks: Subtask[]
  limit?: number
}

export interface AITaskBreakdown {
  subtasks: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>[]
  reasoning: string
  estimatedTotalHours: number
}

export interface Idea {
  id: string
  title: string
  content: string
  category: IdeaCategory
  priority: IdeaPriority
  status: IdeaStatus
  tags: string[]
  userId: string
  chatId?: number
  subtasks: Subtask[]
  kanbanColumns: KanbanColumn[]
  aiBreakdown?: AITaskBreakdown
  createdAt: Date
  updatedAt: Date
}

export interface CreateIdeaInput {
  title: string
  content: string
  category?: IdeaCategory
  priority?: IdeaPriority
  tags?: string[]
  userId: string
  chatId?: number
  generateSubtasks?: boolean
}

export interface UpdateIdeaInput {
  id: string
  title?: string
  content?: string
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
  subtasks?: Subtask[]
  regenerateSubtasks?: boolean
}

export interface IdeaFilter {
  userId?: string
  chatId?: number
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface IdeaFormData {
  title: string
  content: string
  category: IdeaCategory
  priority: IdeaPriority
  tags: string[]
}

export interface IdeaStoreContextType {
  ideas: Idea[]
  loading: boolean
  error: string | null
  createIdea: (idea: CreateIdeaInput) => Promise<void>
  updateIdea: (idea: UpdateIdeaInput) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  refreshIdeas: () => Promise<void>
} 