interface IdeaService {
  captureStrategicIdea(
    title: string,
    content: string,
    userId: string,
    chatId: number,
    category: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations',
    priority: 'low' | 'medium' | 'high' | 'urgent',
    tags: string[],
    reminderDate?: Date
  ): Promise<any>
  searchRelevantIdeas(
    query: string,
    userId: string,
    limit: number,
    category?: 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'
  ): Promise<any[]>
  getUserIdeas(userId: string, limit: number): Promise<any[]>
  getStats(userId?: string): Promise<{ count: number; categories: Record<string, number> }>
  deleteIdea(ideaId: string, userId: string): Promise<boolean>
}

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

interface ValidationError {
  field: string
  message: string
}

export const createIdeaManagementTools = (): Tool[] => [
  {
    name: 'create_idea',
    description: 'Create a new strategic idea, product insight, or business thought. Use this when the user wants to capture, record, or save an idea. Always include a meaningful title and detailed content.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A clear, concise title for the idea (3-100 characters)',
          minLength: 3,
          maxLength: 100
        },
        content: {
          type: 'string',
          description: 'Detailed description of the idea, insight, or thought (minimum 10 characters)',
          minLength: 10
        },
        category: {
          type: 'string',
          enum: ['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations'],
          description: 'The category that best fits this idea'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level of the idea (default: medium)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant tags to categorize and make the idea searchable (max 10 tags)',
          maxItems: 10
        }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'search_ideas',
    description: 'Search through existing ideas using semantic search. Use this when the user asks to find, look up, or retrieve specific ideas. Provide a clear search query.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant ideas (minimum 2 characters)',
          minLength: 2
        },
        category: {
          type: 'string',
          enum: ['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations'],
          description: 'Optional: filter by specific category'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
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
          description: 'Maximum number of recent ideas to include (1-100, default: 20)',
          minimum: 1,
          maximum: 100
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
      const validationErrors = this.validateToolInput(toolCall)
      if (validationErrors.length > 0) {
        return {
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: this.formatValidationErrors(validationErrors),
          is_error: true
        }
      }

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
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: `❌ Error executing ${toolCall.name}: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        is_error: true
      }
    }
  }

  private validateToolInput(toolCall: ToolCall): ValidationError[] {
    const errors: ValidationError[] = []
    const tools = createIdeaManagementTools()
    const toolDef = tools.find(t => t.name === toolCall.name)
    
    if (!toolDef) {
      errors.push({ field: 'tool', message: `Unknown tool: ${toolCall.name}` })
      return errors
    }

    const { properties, required } = toolDef.input_schema
    
    for (const field of required) {
      if (!(field in toolCall.input) || toolCall.input[field] === undefined || toolCall.input[field] === null) {
        errors.push({ field, message: `Required field '${field}' is missing` })
      }
    }

    for (const [field, value] of Object.entries(toolCall.input)) {
      if (value === undefined || value === null) continue
      
      const fieldSchema = properties[field]
      if (!fieldSchema) continue

      if (fieldSchema.type === 'string') {
        if (typeof value !== 'string') {
          errors.push({ field, message: `Field '${field}' must be a string` })
        } else {
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push({ field, message: `Field '${field}' must be at least ${fieldSchema.minLength} characters` })
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push({ field, message: `Field '${field}' must be at most ${fieldSchema.maxLength} characters` })
          }
          if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            errors.push({ field, message: `Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}` })
          }
        }
      } else if (fieldSchema.type === 'number') {
        if (typeof value !== 'number') {
          errors.push({ field, message: `Field '${field}' must be a number` })
        } else {
          if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
            errors.push({ field, message: `Field '${field}' must be at least ${fieldSchema.minimum}` })
          }
          if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
            errors.push({ field, message: `Field '${field}' must be at most ${fieldSchema.maximum}` })
          }
        }
      } else if (fieldSchema.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({ field, message: `Field '${field}' must be an array` })
        } else {
          if (fieldSchema.maxItems !== undefined && value.length > fieldSchema.maxItems) {
            errors.push({ field, message: `Field '${field}' must have at most ${fieldSchema.maxItems} items` })
          }
        }
      }
    }

    return errors
  }

  private formatValidationErrors(errors: ValidationError[]): string {
    return `❌ Invalid input:\n\n${errors.map(e => `• ${e.field}: ${e.message}`).join('\n')}\n\nPlease correct the input and try again.`
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

    return `✅ **Idea Created Successfully**

**"${title}"** (ID: ${idea.id})

📋 **Details:**
• Category: ${category}
• Priority: ${priority}
• Tags: ${tags.length > 0 ? tags.join(', ') : 'none'}

📝 **Content:**
${content.substring(0, 150)}${content.length > 150 ? '...' : ''}

💡 The idea has been saved to your strategic intelligence repository and is now searchable.`
  }

  private async searchIdeas(input: any, userId: string): Promise<string> {
    const { query, category, limit = 10 } = input

    const results = await this.ideaService.searchRelevantIdeas(query, userId, limit, category)

    if (results.length === 0) {
      return `🔍 **No Ideas Found**

No ideas found matching "${query}"${category ? ` in category "${category}"` : ''}.

**Suggestions:**
• Try different search terms
• Use broader keywords
• Remove category filter
• Check spelling of search terms`
    }

    let response = `🔍 **Search Results** (${results.length} found)\n\n**Query:** "${query}"${category ? ` | **Category:** ${category}` : ''}\n\n`

    results.forEach((result: any, index: number) => {
      const idea = result.idea
      const relevanceScore = Math.round(result.score * 100)
      const date = new Date(idea.createdAt).toLocaleDateString()
      
      response += `**${index + 1}. ${idea.title}** (${relevanceScore}% match) [ID: ${idea.id}]\n`
      response += `📋 ${idea.category} | ${idea.priority} priority | 📅 ${date}\n`
      response += `💡 ${idea.content.substring(0, 120)}${idea.content.length > 120 ? '...' : ''}\n`
      if (idea.tags.length > 0) {
        response += `🏷️ ${idea.tags.join(', ')}\n`
      }
      response += '\n'
    })

    return response
  }

  private async listAllIdeas(input: any, userId: string): Promise<string> {
    const { limit = 20, include_stats = true } = input

    const [recentIdeas, stats] = await Promise.all([
      this.ideaService.getUserIdeas(userId, limit),
      include_stats ? this.ideaService.getStats(userId) : null
    ])

    let response = '📊 **Your Strategic Ideas Overview**\n\n'

    if (stats) {
      response += `📈 **Statistics:**\n`
      response += `• **Total Ideas:** ${stats.count}\n`
      
      if (Object.keys(stats.categories).length > 0) {
        response += `• **By Category:**\n`
        Object.entries(stats.categories)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .forEach(([category, count]) => {
            response += `  - ${category}: ${count}\n`
          })
      }
      response += '\n'
    }

    if (recentIdeas.length === 0) {
      response += '💡 **No Ideas Yet**\n\nYou haven\'t captured any ideas yet. Start by describing your strategic thoughts, business insights, or product ideas!'
      return response
    }

    response += `📋 **Recent Ideas** (${Math.min(limit, recentIdeas.length)} of ${stats?.count || recentIdeas.length})\n\n`

    recentIdeas.forEach((idea: any, index: number) => {
      const createdDate = new Date(idea.createdAt).toLocaleDateString()
      const priorityIcon = idea.priority === 'urgent' ? '🔴' : idea.priority === 'high' ? '🟠' : idea.priority === 'medium' ? '🟡' : '🟢'
      
      response += `**${index + 1}. ${idea.title}** ${priorityIcon} [ID: ${idea.id}]\n`
      response += `📋 ${idea.category} | 📅 ${createdDate} | Status: ${idea.status}\n`
      response += `💭 ${idea.content.substring(0, 100)}${idea.content.length > 100 ? '...' : ''}\n`
      if (idea.tags.length > 0) {
        response += `🏷️ ${idea.tags.join(', ')}\n`
      }
      response += '\n'
    })

    response += '\n💡 **Use /forget [ID] to delete an idea** (e.g., /forget abc123)'

    return response
  }
} 