export interface MemoryStoreConfig {
  redisUrl: string
  openaiApiKey: string
  indexName: string
  embeddingModel: string
  vectorDimension: number
}

export interface MemoryDisplayRow {
  id: string
  content: string
  category: string
  importance: number
  tags: string[]
  userId?: string
  chatId?: number
  createdAt: Date
  updatedAt: Date
}

export interface MemoryStoreStats {
  count: number
  indexSize: number
}

export interface FilterOptions {
  userId?: string
  chatId?: number
  category?: string
  tags?: string[]
}

export interface SortOptions {
  field: keyof MemoryDisplayRow
  direction: 'asc' | 'desc'
}

export interface MemoryStoreConnection {
  isConnected: boolean
  error: string | null
  connecting: boolean
} 