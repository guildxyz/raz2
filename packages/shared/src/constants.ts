export const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot'

export const CLAUDE_MODELS = {
  SONNET: 'claude-3-sonnet-20240229',
  HAIKU: 'claude-3-haiku-20240307',
  OPUS: 'claude-3-opus-20240229'
} as const

export const MCP_PROTOCOL_VERSION = '2024-11-05'

export const DEFAULT_PORTS = {
  BOT: 3000,
  MCP_SERVER: 3001
} as const

export const MESSAGE_LIMITS = {
  TELEGRAM_MAX_LENGTH: 4096,
  CLAUDE_MAX_TOKENS: 4000,
  MCP_MAX_CONTENT_LENGTH: 10000
} as const

export const COMMAND_DESCRIPTIONS = {
  start: 'Initialize the bot and get welcome message',
  help: 'Show available commands and their descriptions',
  weather: 'Get weather information for a city',
  time: 'Get current time and date',
  calc: 'Calculate mathematical expressions',
  echo: 'Echo back your message',
  status: 'Check bot status and health'
} as const

export const ERROR_MESSAGES = {
  INVALID_COMMAND: 'Invalid command. Use /help to see available commands.',
  MISSING_ARGUMENT: 'Missing required argument. Use /help for command usage.',
  API_ERROR: 'An error occurred while processing your request. Please try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  UNAUTHORIZED: 'Unauthorized access. Please check your credentials.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  PARSING_ERROR: 'Failed to parse the response. Please try again.',
  TOOL_ERROR: 'Tool execution failed. Please check your input and try again.'
} as const

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const

export const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5'

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2
} as const

export const HEALTH_CHECK_ENDPOINTS = {
  BOT: '/health',
  MCP_SERVER: '/health'
} as const

export const MEMORY_STORE_CONFIG = {
  DEFAULT_INDEX_NAME: 'memories',
  DEFAULT_VECTOR_DIMENSION: 1536,
  DEFAULT_EMBEDDING_MODEL: 'text-embedding-3-small',
  SEARCH_LIMIT: 10,
  SIMILARITY_THRESHOLD: 0.1
} as const

export const REDIS_CONFIG = {
  DEFAULT_PORT: 6379,
  DEFAULT_HOST: 'localhost',
  CONNECTION_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3
} as const 