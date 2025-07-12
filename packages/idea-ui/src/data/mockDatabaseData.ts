export interface TableInfo {
  name: string
  rowCount: number
  sizeBytes: number
  lastUpdated: Date
  schema: string
}

export interface Migration {
  id: string
  name: string
  description: string
  status: 'pending' | 'applied' | 'failed'
  appliedAt?: Date
  executionTime?: number
}

export interface DatabaseStats {
  totalSize: string
  totalTables: number
  totalRows: number
  vectorEmbeddings: number
  indexSize: string
  connectionPool: {
    active: number
    idle: number
    waiting: number
  }
  performance: {
    avgQueryTime: string
    slowQueries: number
    cacheHitRate: string
  }
}

export interface QueryLog {
  id: string
  query: string
  duration: string
  timestamp: Date
  status: 'success' | 'error'
}

export const mockDatabaseStats: DatabaseStats = {
  totalSize: '1.2 GB',
  totalTables: 3,
  totalRows: 1247,
  vectorEmbeddings: 1247,
  indexSize: '45 MB',
  connectionPool: {
    active: 3,
    idle: 2,
    waiting: 0
  },
  performance: {
    avgQueryTime: '15ms',
    slowQueries: 2,
    cacheHitRate: '98.5%'
  }
}

export const mockTables: TableInfo[] = [
  {
    name: 'ideas',
    rowCount: 1247,
    sizeBytes: 1024 * 1024 * 800,
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
    schema: 'public'
  },
  {
    name: 'reminders',
    rowCount: 234,
    sizeBytes: 1024 * 1024 * 50,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    schema: 'public'
  },
  {
    name: 'drizzle_migrations',
    rowCount: 5,
    sizeBytes: 1024 * 10,
    lastUpdated: new Date('2024-07-09'),
    schema: 'drizzle'
  }
]

export const mockMigrations: Migration[] = [
  {
    id: '20250709192049',
    name: 'serious_nekra',
    description: 'Add pgvector extension',
    status: 'applied',
    appliedAt: new Date('2024-07-09T19:20:49Z'),
    executionTime: 245
  },
  {
    id: '20250709192039',
    name: 'quiet_mauler',
    description: 'Create ideas and reminders tables with vector embeddings',
    status: 'applied',
    appliedAt: new Date('2024-07-09T19:20:39Z'),
    executionTime: 189
  }
]

export const mockVectorStats = {
  totalVectors: 1247,
  dimension: 1536,
  indexType: 'hnsw',
  indexParameters: { m: 16, ef_construction: 64 },
  avgSimilarityScore: 0.85,
  searchPerformance: '12ms avg'
}

export const mockRecentQueries: QueryLog[] = [
  { 
    id: '1', 
    query: 'SELECT * FROM ideas WHERE category = $1 ORDER BY created_at DESC LIMIT 10',
    duration: '8ms',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    status: 'success'
  },
  {
    id: '2',
    query: 'SELECT *, 1 - (embedding <=> $1) as similarity FROM ideas ORDER BY similarity DESC LIMIT 5',
    duration: '23ms',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'success'
  },
  {
    id: '3',
    query: 'INSERT INTO ideas (title, content, embedding) VALUES ($1, $2, $3)',
    duration: '15ms',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    status: 'success'
  }
] 