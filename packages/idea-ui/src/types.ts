export interface IdeaStoreStats {
  count: number
  indexSize: number
  categories: Record<string, number>
}

export interface IdeaDisplayRow {
  id: string
  title: string
  content: string
  category: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  userId: string
  chatId?: number
  hasReminders: boolean
}

export interface IdeaStoreConfig {
  redisUrl: string
  openaiApiKey: string
  indexName: string
  embeddingModel: string
  vectorDimension: number
}

export interface FilterOptions {
  userId?: string
  chatId?: number
  category?: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'active' | 'in_progress' | 'completed' | 'archived' | 'cancelled'
  tags?: string[]
}

export interface SortOptions {
  field: keyof IdeaDisplayRow
  direction: 'asc' | 'desc'
}

export interface IdeaStoreConnection {
  isConnected: boolean
  error: string | null
  connecting: boolean
} 