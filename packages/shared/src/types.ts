export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  entities?: TelegramMessageEntity[]
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
  url?: string
  user?: TelegramUser
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface BotCommand {
  command: string
  description: string
  handler: (message: TelegramMessage, args: string[]) => Promise<string>
}

export interface EnvironmentConfig {
  telegramBotToken: string
  anthropicApiKey: string
  claudeModel: string
  nodeEnv: string
  logLevel: string
  port: number
  redisUrl?: string
  openaiApiKey?: string
  ideaIndexName?: string
  embeddingModel?: string
  webServerEnabled?: string
  webServerPort?: string
  webServerHost?: string
}

export interface LogContext {
  userId?: string | number
  chatId?: number
  messageId?: number
  command?: string
  error?: Error
  [key: string]: any
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
  createdAt: Date
  updatedAt: Date
  reminders?: Reminder[]
}

export interface IdeaWithVector extends Idea {
  vector: number[]
}

export interface Reminder {
  id: string
  ideaId: string
  type: ReminderType
  scheduledFor: Date
  message?: string
  isActive: boolean
  isSent: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IdeaSearchResult {
  idea: Idea
  score: number
  distance: number
}

export interface IdeaSearchOptions {
  limit?: number
  threshold?: number
  filter?: IdeaFilter
  includeMetadata?: boolean
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

export interface IdeaStoreConfig {
  redisUrl: string
  indexName: string
  vectorDimension: number
  openaiApiKey: string
  embeddingModel: string
}

export interface CreateIdeaInput {
  title: string
  content: string
  category?: IdeaCategory
  priority?: IdeaPriority
  tags?: string[]
  userId: string
  chatId?: number
  reminders?: CreateReminderInput[]
}

export interface UpdateIdeaInput {
  id: string
  title?: string
  content?: string
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
  reminders?: CreateReminderInput[]
}

export interface CreateReminderInput {
  type: ReminderType
  scheduledFor: Date
  message?: string
}

export interface EmbeddingResponse {
  vector: number[]
  tokens: number
}

export type IdeaCategory = 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'

export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'

export type IdeaStatus = 'active' | 'in_progress' | 'completed' | 'archived' | 'cancelled'

export type ReminderType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom' 