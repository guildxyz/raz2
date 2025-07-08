import { z } from 'zod'

export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, any>
  required?: string[]
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

export abstract class BaseTool {
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly inputSchema: ToolInputSchema

  protected validateInput(args: Record<string, any>): any {
    return args
  }

  abstract execute(args: Record<string, any>): Promise<string | ToolResult>

  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    
    if (typeof error === 'string') {
      return error
    }
    
    return 'An unknown error occurred'
  }

  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      throw new Error(`${errorMessage}: ${this.formatError(error)}`)
    }
  }
} 