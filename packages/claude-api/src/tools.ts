import type { IdeaService } from '@raz2/telegram-bot/src/idea-service'

export interface Tool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
  }
}

export interface ToolCall {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, any>
}

export interface ToolResult {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

export const createIdeaManagementTools = (): Tool[] => [
  {
    name: 'create_idea',
    description: 'Create a new strategic idea, product insight, or business thought. Use this when the user wants to capture, record, or save an idea.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A clear, concise title for the idea'
        },
        content: {
          type: 'string',
          description: 'Detailed description of the idea, insight, or thought'
        },
        category: {
          type: 'string',
          enum: ['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations'],
          description: 'The category that best fits this idea'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level of the idea'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags to categorize and make the idea searchable'
        }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'search_ideas',
    description: 'Search through existing ideas using semantic search. Use this when the user asks to find, look up, or retrieve specific ideas.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant ideas'
        },
        category: {
          type: 'string',
          enum: ['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations'],
          description: 'Optional: filter by specific category'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'list_all_ideas',
    description: 'Get a comprehensive overview of all ideas with statistics and recent entries. Use this when the user wants to see all ideas, get an overview, or understand their idea landscape.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of recent ideas to include (default: 20)'
        },
        include_stats: {
          type: 'boolean',
          description: 'Whether to include category statistics (default: true)'
        }
      },
      required: []
    }
  }
]

export class ToolExecutor {
  constructor(private ideaService: IdeaService) {}

  async executeToolCall(toolCall: ToolCall, userId: string, chatId: number): Promise<ToolResult> {
    try {
      let result: string

      switch (toolCall.name) {
        case 'create_idea':
          result = await this.createIdea(toolCall.input, userId, chatId)
          break
        case 'search_ideas':
          result = await this.searchIdeas(toolCall.input, userId)
          break
        case 'list_all_ideas':
          result = await this.listAllIdeas(toolCall.input, userId)
          break
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`)
      }

      return {
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: result
      }
    } catch (error) {
      return {
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true
      }
    }
  }

  private async createIdea(input: any, userId: string, chatId: number): Promise<string> {
    const { title, content, category = 'strategy', priority = 'medium', tags = [] } = input

    const idea = await this.ideaService.captureStrategicIdea(
      title,
      content,
      userId,
      chatId,
      category,
      priority,
      tags
    )

    if (!idea) {
      throw new Error('Failed to create idea - idea service may be disabled')
    }

    return `✅ Created idea "${title}" (ID: ${idea.id})
📋 Category: ${category} | Priority: ${priority}
🏷️ Tags: ${tags.length > 0 ? tags.join(', ') : 'none'}
📝 Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}

The idea has been saved and is now searchable.`
  }

  private async searchIdeas(input: any, userId: string): Promise<string> {
    const { query, category, limit = 10 } = input

    const results = await this.ideaService.searchRelevantIdeas(query, userId, limit, category)

    if (results.length === 0) {
      return `🔍 No ideas found matching "${query}"${category ? ` in category "${category}"` : ''}.

Try:
- Different search terms
- Broader keywords
- Removing category filter`
    }

    let response = `🔍 Found ${results.length} idea${results.length === 1 ? '' : 's'} matching "${query}":\n\n`

    results.forEach((result, index) => {
      const idea = result.idea
      response += `${index + 1}. **${idea.title}** (${idea.category} | ${idea.priority})\n`
      response += `   💡 ${idea.content.substring(0, 120)}${idea.content.length > 120 ? '...' : ''}\n`
      response += `   🏷️ ${idea.tags.join(', ')}\n`
      response += `   📊 Relevance: ${Math.round(result.score * 100)}%\n\n`
    })

    return response
  }

  private async listAllIdeas(input: any, userId: string): Promise<string> {
    const { limit = 20, include_stats = true } = input

    const [recentIdeas, stats] = await Promise.all([
      this.ideaService.getUserIdeas(userId, limit),
      include_stats ? this.ideaService.getStats(userId) : null
    ])

    let response = '📊 **Your Ideas Overview**\n\n'

    if (stats) {
      response += `📈 **Statistics:**\n`
      response += `• Total ideas: ${stats.count}\n`
      
      if (Object.keys(stats.categories).length > 0) {
        response += `• By category:\n`
        Object.entries(stats.categories)
          .sort(([,a], [,b]) => b - a)
          .forEach(([category, count]) => {
            response += `  - ${category}: ${count}\n`
          })
      }
      response += '\n'
    }

    if (recentIdeas.length === 0) {
      response += '💡 No ideas captured yet. Start creating ideas by describing your thoughts!'
      return response
    }

    response += `📋 **Recent Ideas** (showing ${Math.min(limit, recentIdeas.length)} of ${stats?.count || recentIdeas.length}):\n\n`

    recentIdeas.forEach((idea, index) => {
      const createdDate = new Date(idea.createdAt).toLocaleDateString()
      response += `${index + 1}. **${idea.title}** (${idea.category})\n`
      response += `   📅 ${createdDate} | Priority: ${idea.priority} | Status: ${idea.status}\n`
      response += `   💭 ${idea.content.substring(0, 100)}${idea.content.length > 100 ? '...' : ''}\n`
      if (idea.tags.length > 0) {
        response += `   🏷️ ${idea.tags.join(', ')}\n`
      }
      response += '\n'
    })

    return response
  }
} 