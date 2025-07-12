import type { EnvironmentConfig, LogContext, TelegramMessage } from './types.js'
import { EnvironmentConfigSchema } from './schemas.js'

export function loadEnvironmentConfig(): EnvironmentConfig {
  const env = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    claudeModel: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    mcpServerHost: process.env.MCP_SERVER_HOST || 'localhost',
    mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    port: parseInt(process.env.PORT || '3000'),
    weatherApiKey: process.env.WEATHER_API_KEY,
    newsApiKey: process.env.NEWS_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL,
    webServerEnabled: process.env.WEB_SERVER_ENABLED,
    webServerPort: process.env.WEB_SERVER_PORT,
    webServerHost: process.env.WEB_SERVER_HOST
  }

  return EnvironmentConfigSchema.parse(env)
}

export function createLogger(service: string) {
  const logLevel = process.env.LOG_LEVEL || 'info'
  const levels = ['error', 'warn', 'info', 'debug']
  const currentLevelIndex = levels.indexOf(logLevel)

  function shouldLog(level: string): boolean {
    const levelIndex = levels.indexOf(level)
    return levelIndex <= currentLevelIndex
  }

  function formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${service}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  return {
    error: (message: string, context?: LogContext) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, context))
      }
    },
    warn: (message: string, context?: LogContext) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, context))
      }
    },
    info: (message: string, context?: LogContext) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, context))
      }
    },
    debug: (message: string, context?: LogContext) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, context))
      }
    }
  }
}

export function parseCommand(text: string): { command: string; args: string[] } {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) {
    return { command: '', args: [] }
  }

  const parts = trimmed.slice(1).split(/\s+/)
  const command = parts[0] || ''
  const args = parts.slice(1)

  return { command: command.toLowerCase(), args }
}

export function extractMentionedText(message: TelegramMessage): string {
  if (!message.text || !message.entities) {
    return message.text || ''
  }

  let result = message.text
  const entities = [...message.entities].reverse()

  for (const entity of entities) {
    if (entity.type === 'mention' || entity.type === 'text_mention') {
      const before = result.slice(0, entity.offset)
      const after = result.slice(entity.offset + entity.length)
      result = before + after
    }
  }

  return result.trim()
}

export function truncateText(text: string, maxLength: number = 4000): string {
  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.slice(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unknown error occurred'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(async (error) => {
    if (attempts <= 1) {
      throw error
    }
    
    await sleep(delay)
    return retry(fn, attempts - 1, delay * 2)
  })
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim()
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
} 