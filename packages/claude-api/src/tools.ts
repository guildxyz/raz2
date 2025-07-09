import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createLogger, loadEnvironmentConfig, formatError } from '@raz2/shared'
import { z } from 'zod'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export class MCPToolManager {
  async initialize(): Promise<void> {
    return Promise.resolve()
  }

  async getAvailableTools(): Promise<any[]> {
    return []
  }

  async executeTool(toolName: string, input: Record<string, any>): Promise<string> {
    throw new Error('MCP tools disabled - using Claude native capabilities for strategic intelligence')
  }

  async shutdown(): Promise<void> {
    return Promise.resolve()
  }

  isInitialized(): boolean {
    return true
  }
} 