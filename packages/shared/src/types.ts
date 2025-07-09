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

export interface ClaudeToolCall {
  name: string
  input: Record<string, any>
}

export interface ClaudeToolResult {
  tool_use_id: string
  content: string
  is_error?: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolCall {
  name: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
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
  mcpServerHost: string
  mcpServerPort: number
  nodeEnv: string
  logLevel: string
  port: number
  weatherApiKey?: string
  newsApiKey?: string
  redisUrl?: string
  openaiApiKey?: string
  memoryIndexName?: string
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