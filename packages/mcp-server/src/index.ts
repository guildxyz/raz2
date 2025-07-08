#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js'
import { createLogger, loadEnvironmentConfig } from '@claude-telegram-bot/shared'
import { WeatherTool } from './tools/weather'
import { CalculatorTool } from './tools/calculator'
import { TimeTool } from './tools/time'
import { EchoTool } from './tools/echo'

const logger = createLogger('mcp-server')

class MCPServer {
  private server: Server
  private tools: Map<string, any> = new Map()

  constructor() {
    this.server = new Server(
      {
        name: 'raz2-mcp-server',
        version: '1.0.0'
      }
    )

    this.setupTools()
    this.setupHandlers()
  }

  private setupTools() {
    const weatherTool = new WeatherTool()
    const calculatorTool = new CalculatorTool()
    const timeTool = new TimeTool()
    const echoTool = new EchoTool()

    this.tools.set('get_weather', weatherTool)
    this.tools.set('calculate', calculatorTool)
    this.tools.set('get_time', timeTool)
    this.tools.set('echo', echoTool)

    logger.info('Initialized MCP tools', { 
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys())
    })
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))

      logger.debug('Listed tools', { toolCount: tools.length })
      
      return { tools }
    })

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      logger.info('Tool call requested', { toolName: name, arguments: args })

      const tool = this.tools.get(name)
      if (!tool) {
        const errorMessage = `Unknown tool: ${name}`
        logger.error(errorMessage, { availableTools: Array.from(this.tools.keys()) })
        throw new Error(errorMessage)
      }

      try {
        const result = await tool.execute(args)
        logger.info('Tool executed successfully', { toolName: name, result })
        
        return {
          content: [
            {
              type: 'text' as const,
              text: typeof result === 'string' ? result : JSON.stringify(result)
            }
          ]
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Tool execution failed', { 
          toolName: name, 
          error: error instanceof Error ? error : new Error(errorMessage),
          arguments: args 
        })
        
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error executing tool ${name}: ${errorMessage}`
            }
          ],
          isError: true
        }
      }
    })
  }

  async start() {
    const transport = new StdioServerTransport()
    
    logger.info('Starting MCP server...')
    
    await this.server.connect(transport)
    
    logger.info('MCP server started successfully', {
      transport: 'stdio',
      toolCount: this.tools.size
    })
  }
}

async function main() {
  try {
    const config = loadEnvironmentConfig()
    logger.info('MCP server initializing', { 
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel 
    })

    const mcpServer = new MCPServer()
    await mcpServer.start()
  } catch (error) {
    logger.error('Failed to start MCP server', { 
      error: error instanceof Error ? error : new Error(String(error))
    })
    process.exit(1)
  }
}

// Check if this module is being run directly
if (process.argv[1] && process.argv[1].includes('mcp-server')) {
  main().catch((error) => {
    logger.error('Unhandled error in main', { error: error instanceof Error ? error : new Error(String(error)) })
    process.exit(1)
  })
} 