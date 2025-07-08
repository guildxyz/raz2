import Anthropic from '@anthropic-ai/sdk'
import { 
  loadEnvironmentConfig, 
  createLogger, 
  retry, 
  formatError,
  type ClaudeMessage 
} from '@raz2/shared'
import { MCPToolManager } from './tools'
import type { ClaudeResponse, ToolCall, ToolResult } from './types'

export class ClaudeClient {
  private client: Anthropic
  private config = loadEnvironmentConfig()
  private logger = createLogger('claude-api')
  private toolManager: MCPToolManager

  constructor() {
    this.client = new Anthropic({
      apiKey: this.config.anthropicApiKey
    })
    
    this.toolManager = new MCPToolManager()
    this.logger.info('Claude client initialized', { 
      model: this.config.claudeModel 
    })
  }

  async initialize(): Promise<void> {
    await this.toolManager.initialize()
    this.logger.info('Claude client fully initialized with tools')
  }

  async sendMessage(
    message: string, 
    conversationHistory: ClaudeMessage[] = [],
    maxToolCalls: number = 5
  ): Promise<ClaudeResponse> {
    this.logger.info('Sending message to Claude', { 
      messageLength: message.length,
      historyLength: conversationHistory.length 
    })

    const messages: ClaudeMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    let toolCallCount = 0
    let response: ClaudeResponse

    while (toolCallCount < maxToolCalls) {
      try {
        response = await this.makeClaudeRequest(messages)
        
        if (!response.toolCalls || response.toolCalls.length === 0) {
          this.logger.info('Claude responded without tool calls', { 
            responseLength: response.content.length 
          })
          return response
        }

        this.logger.info('Claude requested tool calls', { 
          toolCount: response.toolCalls.length,
          tools: response.toolCalls.map(t => t.name)
        })

        const toolResults = await this.executeToolCalls(response.toolCalls)
        
        // Only add assistant message if it has content
        if (response.content.trim()) {
          messages.push({ role: 'assistant', content: response.content })
        }
        
        // Add tool results as user message
        const toolResultsContent = this.formatToolResults(toolResults)
        if (toolResultsContent.trim()) {
          messages.push({ role: 'user', content: toolResultsContent })
        }

        toolCallCount++
      } catch (error) {
        this.logger.error('Error in Claude conversation', { 
          error: error instanceof Error ? error : new Error(formatError(error)),
          toolCallCount 
        })
        throw error
      }
    }

    this.logger.warn('Maximum tool calls reached', { maxToolCalls })
    return response!
  }

  private async makeClaudeRequest(messages: ClaudeMessage[]): Promise<ClaudeResponse> {
    const tools = await this.toolManager.getAvailableTools()
    
    const filteredMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    this.logger.debug('Sending messages to Claude API', {
      messageCount: filteredMessages.length,
      messages: filteredMessages.map((msg, idx) => ({
        index: idx,
        role: msg.role,
        contentLength: msg.content.length,
        isEmpty: !msg.content.trim(),
        preview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
      }))
    })
    
    return retry(async () => {
      const response = await this.client.messages.create({
        model: this.config.claudeModel,
        max_tokens: 4000,
        messages: filteredMessages,
        ...(tools.length > 0 && {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema
          }))
        })
      } as any)

      const toolCalls: ToolCall[] = []
      let content = ''

      for (const contentBlock of response.content) {
        if (contentBlock.type === 'text') {
          content += contentBlock.text
        } else if (contentBlock.type === 'tool_use') {
          const toolUseBlock = contentBlock as any; // Type assertion for tool_use block
          toolCalls.push({
            id: toolUseBlock.id,
            name: toolUseBlock.name,
            input: toolUseBlock.input as Record<string, any>
          })
        }
      }

      this.logger.debug('Claude API response', {
        contentLength: content.length,
        toolCallCount: toolCalls.length,
        usage: response.usage
      })

      return {
        content,
        toolCalls,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      }
    }, 3, 1000)
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = []
    
    for (const toolCall of toolCalls) {
      try {
        this.logger.info('Executing tool', { 
          tool: toolCall.name, 
          input: toolCall.input 
        })
        
        const result = await this.toolManager.executeTool(
          toolCall.name, 
          toolCall.input
        )
        
        results.push({
          toolCallId: toolCall.id,
          result,
          isError: false
        })
        
        this.logger.info('Tool executed successfully', { 
          tool: toolCall.name,
          resultLength: result.length 
        })
      } catch (error) {
        const errorMessage = formatError(error)
        
        this.logger.error('Tool execution failed', { 
          tool: toolCall.name,
          error: error instanceof Error ? error : new Error(errorMessage),
          input: toolCall.input 
        })
        
        results.push({
          toolCallId: toolCall.id,
          result: `Error: ${errorMessage}`,
          isError: true
        })
      }
    }
    
    return results
  }

  private formatToolResults(results: ToolResult[]): string {
    return results.map(result => {
      if (result.isError) {
        return `Tool ${result.toolCallId} failed: ${result.result}`
      }
      return `Tool ${result.toolCallId} result: ${result.result}`
    }).join('\n\n')
  }

  async listAvailableTools(): Promise<string[]> {
    const tools = await this.toolManager.getAvailableTools()
    return tools.map(tool => tool.name)
  }

  async getToolDescription(toolName: string): Promise<string | null> {
    const tools = await this.toolManager.getAvailableTools()
    const tool = tools.find(t => t.name === toolName)
    return tool?.description || null
  }

  async shutdown(): Promise<void> {
    await this.toolManager.shutdown()
    this.logger.info('Claude client shut down')
  }
} 