export interface Memory {
  id: string
  content: string
  metadata: MemoryMetadata
  createdAt: Date
  updatedAt: Date
}

export interface MemoryMetadata {
  userId?: string
  chatId?: number
  category?: string
  importance?: number
  tags?: string[]
  source?: string
  [key: string]: any
}

export interface MemoryWithVector extends Memory {
  vector: number[]
}

export interface MemorySearchResult {
  memory: Memory
  score: number
  distance: number
}

export interface MemorySearchOptions {
  limit?: number
  threshold?: number
  filter?: MemoryFilter
  includeMetadata?: boolean
}

export interface MemoryFilter {
  userId?: string
  chatId?: number
  category?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface MemoryStoreConfig {
  redisUrl: string
  indexName: string
  vectorDimension: number
  openaiApiKey: string
  embeddingModel: string
}

export interface CreateMemoryInput {
  content: string
  metadata?: Partial<MemoryMetadata>
}

export interface UpdateMemoryInput {
  id: string
  content?: string
  metadata?: Partial<MemoryMetadata>
}

export interface EmbeddingResponse {
  vector: number[]
  tokens: number
} 