export interface ClaudeResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

export interface ConversationContext {
  userId: number
  chatId: number
  messageHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
  lastActivity: number
}

export interface ClaudeAPIConfig {
  apiKey: string
  model: string
  maxTokens: number
} 