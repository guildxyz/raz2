export type IdeaCategory = 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'

export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'

export type IdeaStatus = 'active' | 'in_progress' | 'completed' | 'archived' | 'cancelled'

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
}

export interface UpdateIdeaInput {
  id: string
  title?: string
  content?: string
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
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