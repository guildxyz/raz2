import { BaseTool, ToolInputSchema } from './base'

export class EchoTool extends BaseTool {
  readonly name = 'echo'
  readonly description = 'Echo back the provided message'
  readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back'
      }
    },
    required: ['message']
  }

  async execute(args: Record<string, any>): Promise<string> {
    const { message } = this.validateInput(args)
    
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string')
    }

    return `Echo: ${message}`
  }
} 