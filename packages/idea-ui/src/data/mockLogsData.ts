export interface LogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  source: 'telegram-bot' | 'idea-store' | 'claude-api' | 'web-server' | 'database'
  category: string
  message: string
  details?: any
  userId?: string
  chatId?: number
  duration?: number
  stackTrace?: string
}

export interface LogLevel {
  id: string
  label: string
  color: string
  bgColor: string
}

export interface LogSource {
  id: string
  label: string
  icon: string
  color: string
}

export const logLevels: LogLevel[] = [
  { id: 'debug', label: 'Debug', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'info', label: 'Info', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'warn', label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'error', label: 'Error', color: 'text-red-600', bgColor: 'bg-red-100' },
  { id: 'fatal', label: 'Fatal', color: 'text-red-800', bgColor: 'bg-red-200' }
]

export const logSources: LogSource[] = [
  { id: 'telegram-bot', label: 'Telegram Bot', icon: 'Bot', color: 'text-blue-600' },
  { id: 'idea-store', label: 'Idea Store', icon: 'Database', color: 'text-green-600' },
  { id: 'claude-api', label: 'Claude API', icon: 'Zap', color: 'text-purple-600' },
  { id: 'web-server', label: 'Web Server', icon: 'Server', color: 'text-orange-600' },
  { id: 'database', label: 'Database', icon: 'Database', color: 'text-indigo-600' }
]

export const mockLogEntries: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    level: 'info',
    source: 'telegram-bot',
    category: 'message_processing',
    message: 'Processing new message from user',
    details: {
      userId: '123456789',
      username: 'razvan',
      messageLength: 47,
      messageType: 'text'
    },
    userId: '123456789',
    chatId: 456,
    duration: 245
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    level: 'error',
    source: 'claude-api',
    category: 'api_request',
    message: 'Claude API request failed with timeout',
    details: {
      requestId: 'req_abc123',
      timeout: 30000,
      retryAttempt: 1
    },
    stackTrace: 'Error: Request timeout\n  at ApiClient.request (claude-api.js:145)\n  at async processMessage (bot.js:89)'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    level: 'info',
    source: 'idea-store',
    category: 'database',
    message: 'Successfully created new idea with vector embedding',
    details: {
      ideaId: 'idea_xyz789',
      embeddingDimension: 1536,
      vectorSimilarity: 0.92
    },
    duration: 156
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    level: 'warn',
    source: 'web-server',
    category: 'performance',
    message: 'Slow response time detected for dashboard request',
    details: {
      path: '/analytics',
      responseTime: 2500,
      threshold: 2000
    },
    duration: 2500
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    level: 'debug',
    source: 'database',
    category: 'query',
    message: 'Executing vector similarity search',
    details: {
      query: 'SELECT *, 1 - (embedding <=> $1) as similarity FROM ideas ORDER BY similarity DESC LIMIT 5',
      executionTime: 23,
      resultCount: 5
    },
    duration: 23
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    level: 'info',
    source: 'telegram-bot',
    category: 'startup',
    message: 'Bot started successfully',
    details: {
      botId: '7842156789',
      username: 'raz2_bot',
      features: ['idea_management', 'claude_integration', 'vector_search']
    }
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    level: 'error',
    source: 'idea-store',
    category: 'database',
    message: 'Failed to connect to PostgreSQL database',
    details: {
      error: 'connection refused',
      host: 'localhost',
      port: 5432,
      database: 'raz2_db'
    },
    stackTrace: 'ConnectionError: connection refused\n  at DatabaseClient.connect (db.js:67)\n  at IdeaStore.initialize (idea-store.js:34)'
  }
] 