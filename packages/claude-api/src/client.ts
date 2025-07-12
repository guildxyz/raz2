import Anthropic from '@anthropic-ai/sdk'
import { 
  loadEnvironmentConfig, 
  createLogger, 
  retry, 
  formatError,
  type ClaudeMessage 
} from '@raz2/shared'
import type { ClaudeResponse } from './types'
import { createIdeaManagementTools, ToolExecutor, type Tool, type ToolCall, type ToolResult } from './tools'

export class ClaudeClient {
  private client: Anthropic
  private config = loadEnvironmentConfig()
  private logger = createLogger('claude-api')
  private tools: Tool[] = []
  private toolExecutor?: ToolExecutor

  constructor() {
    this.client = new Anthropic({
      apiKey: this.config.anthropicApiKey
    })
    
    this.logger.info('Claude client initialized for strategic intelligence', { 
      model: this.config.claudeModel 
    })
  }

  async initialize(): Promise<void> {
    this.logger.info('Claude client ready for strategic intelligence conversations')
  }

  enableIdeaTools(toolExecutor: ToolExecutor): void {
    this.tools = createIdeaManagementTools()
    this.toolExecutor = toolExecutor
    this.logger.info('Idea management tools enabled', { 
      toolCount: this.tools.length,
      tools: this.tools.map(t => t.name)
    })
  }

  async sendMessage(
    message: string, 
    conversationHistory: ClaudeMessage[] = [],
    userId?: string,
    chatId?: number,
    enableTools: boolean = true,
    isCommand: boolean = false,
    personalityPrompt?: string
  ): Promise<ClaudeResponse> {
    this.logger.info('Processing strategic intelligence query', { 
      messageLength: message.length,
      historyLength: conversationHistory.length,
      hasTools: this.tools.length > 0,
      toolsEnabled: enableTools
    })

    const messages: ClaudeMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    try {
      const response = await this.makeClaudeRequest(messages, userId, chatId, enableTools, isCommand, personalityPrompt)
      
      this.logger.info('Strategic intelligence response generated', { 
        responseLength: response.content.length 
      })
      
      return response
    } catch (error) {
      this.logger.error('Error processing strategic intelligence query', { 
        error: error instanceof Error ? error : new Error(formatError(error))
      })
      throw error
    }
  }

  private async makeClaudeRequest(
    messages: ClaudeMessage[], 
    userId?: string, 
    chatId?: number,
    enableTools: boolean = true,
    isCommand: boolean = false,
    personalityPrompt?: string
  ): Promise<ClaudeResponse> {
    const filteredMessages = messages
      .filter(msg => msg.role !== 'system' && msg.content.trim())
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    this.logger.debug('Sending strategic intelligence query to Claude', {
      messageCount: filteredMessages.length,
      hasTools: this.tools.length > 0
    })
    
    return retry(async () => {
      const anthropicMessages: any[] = []
      
      // Convert messages to Anthropic format
      for (const msg of filteredMessages) {
        anthropicMessages.push({
          role: msg.role,
          content: msg.content
        })
      }

      // Initial request to Claude
      const requestParams: any = {
        model: this.config.claudeModel,
        max_tokens: 4000,
        messages: anthropicMessages,
        system: this.getSystemPrompt(isCommand, personalityPrompt),
      }
      
      // Only add tools if they exist and are enabled
      if (this.tools.length > 0 && enableTools) {
        requestParams.tools = this.tools
      }
      
      let response = await this.client.messages.create(requestParams)

      let content = ''
      let toolUseDetected = false

      // Process initial response
      for (const contentBlock of response.content) {
        if (contentBlock.type === 'text') {
          content += contentBlock.text
        } else if (contentBlock.type === 'tool_use') {
          toolUseDetected = true
          if (this.toolExecutor && userId && chatId !== undefined) {
            content += await this.handleToolUse(contentBlock, anthropicMessages, userId, chatId, enableTools)
          } else {
            const toolName = (contentBlock as any).name || 'unknown'
            content += `\n[Tool requested: ${toolName} but tool execution not available]\n`
          }
        }
      }

      this.logger.debug('Strategic intelligence response received', {
        contentLength: content.length,
        usage: response.usage,
        toolUseDetected
      })

      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      }
    }, 3, 1000)
  }

  private async handleToolUse(
    toolUse: any, 
    conversationMessages: any[], 
    userId: string, 
    chatId: number,
    enableTools: boolean
  ): Promise<string> {
    if (!this.toolExecutor) {
      return `\n[Tool ${toolUse.name} requested but no executor available]\n`
    }

    try {
      this.logger.info('Executing tool', { 
        toolName: toolUse.name, 
        toolId: toolUse.id,
        userId,
        chatId
      })

      const toolCall: ToolCall = {
        type: 'tool_use',
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input
      }

      const toolResult = await this.toolExecutor.executeToolCall(toolCall, userId, chatId)

      // Continue conversation with tool result
      const updatedMessages = [
        ...conversationMessages,
        {
          role: 'assistant',
          content: [toolUse]
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolResult.tool_use_id,
              content: toolResult.content,
              is_error: toolResult.is_error
            }
          ]
        }
      ]

      // Get Claude's final response after tool execution
      const finalRequestParams: any = {
        model: this.config.claudeModel,
        max_tokens: 4000,
        messages: updatedMessages,
        system: this.getSystemPrompt(true),
      }
      
      if (enableTools && this.tools.length > 0) {
        finalRequestParams.tools = this.tools
      }
      
      const finalResponse = await this.client.messages.create(finalRequestParams)

      let finalContent = ''
      for (const contentBlock of finalResponse.content) {
        if (contentBlock.type === 'text') {
          finalContent += contentBlock.text
        }
      }

      return finalContent

    } catch (error) {
      this.logger.error('Tool execution failed', { 
        error: error instanceof Error ? error : new Error(String(error)),
        toolName: toolUse.name,
        toolId: toolUse.id
      })
      return `\n[Error executing ${toolUse.name}: ${error instanceof Error ? error.message : String(error)}]\n`
    }
  }

  private getSystemPrompt(isCommand: boolean = false, personalityPrompt?: string): string {
    if (isCommand) {
      const basePrompt = `You are a strategic business intelligence assistant for the CEO of Guild.xyz, a platform with 6+ million users and thousands of enterprise clients.

Your role is to help with:
- Strategic planning and decision making
- Product strategy and roadmap insights  
- Enterprise sales intelligence and client insights
- Competitive analysis and market intelligence
- Partnership and business development opportunities
- Team and operational strategy

Provide thoughtful, actionable insights that consider the scale and complexity of managing a platform with millions of users. Focus on strategic thinking, business intelligence, and executive-level decision support.`

      if (this.tools.length > 0) {
        return basePrompt + `

IMPORTANT: You have access to idea management tools that allow you to:
1. **create_idea** - Save strategic insights, product ideas, or business thoughts
2. **search_ideas** - Find previously captured ideas using semantic search  
3. **list_all_ideas** - Get an overview of all captured ideas with statistics

Use these tools proactively when:
- The user mentions an idea, insight, or thought worth capturing
- The user asks about previous ideas or wants to find something
- The user wants to see their idea landscape or get an overview
- You think something should be remembered for future reference

Always be helpful in organizing and retrieving the user's strategic thinking.`
      }
      return basePrompt
    }

    let casualPrompt = `You are a crypto founder with a 140 IQ and 10+ years building in AI and crypto. You're technical, experienced, and have deep insights from building in these spaces.

Keep responses brief and conversational - like chatting with a peer who gets it. You understand:
- DeFi protocols, smart contracts, tokenomics
- AI/ML systems, neural networks, LLMs  
- Web3 infrastructure, blockchain architecture
- Crypto markets, trading, yield farming
- Building products that combine AI + crypto

Be casual but knowledgeable. Share quick insights or ask smart follow-up questions when relevant.`

    if (personalityPrompt) {
      casualPrompt += `\n\n--- PERSONALITY ADAPTATION ---\n${personalityPrompt}`
    }

    return casualPrompt
  }

  async shutdown(): Promise<void> {
    this.logger.info('Claude client shutdown')
  }
} 