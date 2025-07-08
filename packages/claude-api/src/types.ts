export interface ToolCall {
  id: string
  name: string
  input: Record<string, any>
}

export interface ToolResult {
  toolCallId: string
  result: string
  isError: boolean
}

export interface ClaudeResponse {
  content: string
  toolCalls?: ToolCall[]
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
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
  maxToolCalls: number
}

export interface MCPServerConfig {
  host: string
  port: number
  command?: string
  args?: string[]
  timeout?: number
} 