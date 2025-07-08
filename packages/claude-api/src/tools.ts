import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createLogger, loadEnvironmentConfig, formatError } from '@raz2/shared'
import { z } from 'zod'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ToolDefinition } from './types'

export class MCPToolManager {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private logger = createLogger('mcp-tool-manager')
  private config = loadEnvironmentConfig()
  private availableTools: ToolDefinition[] = []

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MCP client connection')
      
      // Find the project root directory (go up from packages/telegram-bot)
      const projectRoot = resolve(process.cwd(), '../..')
      const mcpServerPath = resolve(projectRoot, 'packages/mcp-server/dist/index.js')
      
      this.logger.info('MCP server path resolved', { 
        cwd: process.cwd(),
        projectRoot,
        mcpServerPath
      })
      
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpServerPath]
      })

      this.client = new Client({
        name: 'raz2-client',
        version: '1.0.0'
      })

      await this.client.connect(this.transport)
      
      await this.loadAvailableTools()
      
      this.logger.info('MCP client initialized successfully', {
        toolCount: this.availableTools.length,
        tools: this.availableTools.map(t => t.name)
      })
    } catch (error) {
      this.logger.error('Failed to initialize MCP client', { 
        error: error instanceof Error ? error : new Error(formatError(error))
      })
      throw new Error(`MCP initialization failed: ${formatError(error)}`)
    }
  }

  private async loadAvailableTools(): Promise<void> {
    if (!this.client) {
      throw new Error('MCP client not initialized')
    }

    try {
      const response = await this.client.request({
        method: 'tools/list',
        params: {}
      }, z.object({ tools: z.array(z.any()) }))

      this.availableTools = response.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))

      this.logger.debug('Loaded available tools', { 
        toolCount: this.availableTools.length 
      })
    } catch (error) {
      this.logger.error('Failed to load available tools', { 
        error: error instanceof Error ? error : new Error(formatError(error))
      })
      this.availableTools = []
    }
  }

  async getAvailableTools(): Promise<ToolDefinition[]> {
    return [...this.availableTools]
  }

  async executeTool(toolName: string, input: Record<string, any>): Promise<string> {
    if (!this.client) {
      throw new Error('MCP client not initialized')
    }

    const tool = this.availableTools.find(t => t.name === toolName)
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`)
    }

    this.logger.info('Executing MCP tool', { 
      tool: toolName, 
      input 
    })

    try {
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: input
        }
      }, z.object({ 
        isError: z.boolean().optional(),
        content: z.array(z.object({ text: z.string().optional() })).optional()
      }))

      if (response.isError) {
        throw new Error(response.content?.[0]?.text || 'Tool execution failed')
      }

      const result = response.content?.[0]?.text || 'No result returned'
      
      this.logger.info('Tool executed successfully', { 
        tool: toolName,
        resultLength: result.length 
      })

      return result
    } catch (error) {
      this.logger.error('Tool execution failed', { 
        tool: toolName,
        error: error instanceof Error ? error : new Error(formatError(error)),
        input 
      })
      throw new Error(`Tool execution failed: ${formatError(error)}`)
    }
  }

  async refreshTools(): Promise<void> {
    await this.loadAvailableTools()
    this.logger.info('Tools refreshed', { 
      toolCount: this.availableTools.length 
    })
  }

  async isToolAvailable(toolName: string): Promise<boolean> {
    return this.availableTools.some(tool => tool.name === toolName)
  }

  async getToolDefinition(toolName: string): Promise<ToolDefinition | null> {
    return this.availableTools.find(tool => tool.name === toolName) || null
  }

  async shutdown(): Promise<void> {
    if (this.client && this.transport) {
      try {
        await this.client.close()
        this.logger.info('MCP client connection closed')
      } catch (error) {
        this.logger.error('Error closing MCP client', { 
          error: error instanceof Error ? error : new Error(formatError(error))
        })
      }
    }
    
    this.client = null
    this.transport = null
    this.availableTools = []
  }

  isInitialized(): boolean {
    return this.client !== null
  }
} 