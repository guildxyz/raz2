import Anthropic from '@anthropic-ai/sdk'
import { 
  loadEnvironmentConfig, 
  createLogger, 
  retry, 
  formatError,
  type ClaudeMessage 
} from '@raz2/shared'
import type { ClaudeResponse } from './types'

export class ClaudeClient {
  private client: Anthropic
  private config = loadEnvironmentConfig()
  private logger = createLogger('claude-api')

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

  async sendMessage(
    message: string, 
    conversationHistory: ClaudeMessage[] = []
  ): Promise<ClaudeResponse> {
    this.logger.info('Processing strategic intelligence query', { 
      messageLength: message.length,
      historyLength: conversationHistory.length 
    })

    const messages: ClaudeMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    try {
      const response = await this.makeClaudeRequest(messages)
      
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

  private async makeClaudeRequest(messages: ClaudeMessage[]): Promise<ClaudeResponse> {
    const filteredMessages = messages
      .filter(msg => msg.role !== 'system' && msg.content.trim())
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    this.logger.debug('Sending strategic intelligence query to Claude', {
      messageCount: filteredMessages.length
    })
    
    return retry(async () => {
      const response = await this.client.messages.create({
        model: this.config.claudeModel,
        max_tokens: 4000,
        messages: filteredMessages,
        system: `You are a strategic business intelligence assistant for the CEO of Guild.xyz, a platform with 6+ million users and thousands of enterprise clients.

Your role is to help with:
- Strategic planning and decision making
- Product strategy and roadmap insights  
- Enterprise sales intelligence and client insights
- Competitive analysis and market intelligence
- Partnership and business development opportunities
- Team and operational strategy

Provide thoughtful, actionable insights that consider the scale and complexity of managing a platform with millions of users. Focus on strategic thinking, business intelligence, and executive-level decision support.`
      })

      let content = ''
      for (const contentBlock of response.content) {
        if (contentBlock.type === 'text') {
          content += contentBlock.text
        }
      }

      this.logger.debug('Strategic intelligence response received', {
        contentLength: content.length,
        usage: response.usage
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

  async shutdown(): Promise<void> {
    this.logger.info('Claude client shutdown')
  }
} 