import { ClaudeClient } from '@raz2/claude-api'
import { createLogger } from '@raz2/shared'
import type { AITaskBreakdown, Subtask } from '../types'

export interface BreakdownInput {
  title: string
  content: string
  category: string
  priority: string
}

export class AITaskBreakdownService {
  private claude: ClaudeClient
  private logger = createLogger('ai-breakdown')

  constructor(apiKey: string) {
    this.claude = new ClaudeClient(apiKey)
  }

  async breakdownIdea(input: BreakdownInput): Promise<AITaskBreakdown> {
    try {
      const prompt = this.buildBreakdownPrompt(input)
      
      const response = await this.claude.sendMessage([
        {
          role: 'user',
          content: prompt
        }
      ])

      const breakdown = this.parseBreakdownResponse(response.content)
      
      this.logger.info('Generated task breakdown', {
        ideaTitle: input.title,
        subtaskCount: breakdown.subtasks.length,
        estimatedHours: breakdown.estimatedTotalHours
      })

      return breakdown
    } catch (error) {
      this.logger.error('Failed to generate task breakdown', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaTitle: input.title
      })

      return this.getFallbackBreakdown(input)
    }
  }

  private buildBreakdownPrompt(input: BreakdownInput): string {
    return `Break down this strategic idea into actionable subtasks for a kanban board.

**Idea Details:**
- Title: ${input.title}
- Content: ${input.content}
- Category: ${input.category}
- Priority: ${input.priority}

**Requirements:**
- Create 3-8 specific, actionable subtasks
- Each subtask should be completable in 1-8 hours
- Include dependencies between subtasks
- Assign appropriate status (todo/in_progress/review/done)
- Add relevant tags for organization
- Provide time estimates
- Include brief reasoning for the breakdown

**Response Format (JSON):**
{
  "subtasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description of what needs to be done",
      "status": "todo",
      "priority": "medium",
      "estimatedHours": 2,
      "tags": ["research", "planning"],
      "dependencies": []
    }
  ],
  "reasoning": "Explanation of breakdown approach and rationale",
  "estimatedTotalHours": 12
}

Only respond with valid JSON.`
  }

  private parseBreakdownResponse(content: string): AITaskBreakdown {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
        throw new Error('Invalid subtasks format')
      }

      return {
        subtasks: parsed.subtasks.map((subtask: any) => ({
          title: subtask.title || 'Untitled Task',
          description: subtask.description || '',
          status: this.validateStatus(subtask.status),
          priority: this.validatePriority(subtask.priority),
          estimatedHours: Math.max(1, Math.min(8, subtask.estimatedHours || 2)),
          tags: Array.isArray(subtask.tags) ? subtask.tags : [],
          dependencies: Array.isArray(subtask.dependencies) ? subtask.dependencies : [],
          assignee: subtask.assignee || undefined
        })),
        reasoning: parsed.reasoning || 'AI-generated task breakdown',
        estimatedTotalHours: Math.max(1, parsed.estimatedTotalHours || 8)
      }
    } catch (error) {
      this.logger.error('Failed to parse AI response', {
        error: error instanceof Error ? error : new Error(String(error)),
        content: content.slice(0, 200)
      })
      
      throw new Error('Failed to parse AI breakdown response')
    }
  }

  private validateStatus(status: string): 'todo' | 'in_progress' | 'review' | 'done' {
    const validStatuses = ['todo', 'in_progress', 'review', 'done']
    return validStatuses.includes(status) ? status as any : 'todo'
  }

  private validatePriority(priority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    return validPriorities.includes(priority) ? priority as any : 'medium'
  }

  private getFallbackBreakdown(input: BreakdownInput): AITaskBreakdown {
    return {
      subtasks: [
        {
          title: 'Research and Planning',
          description: `Research requirements and create plan for: ${input.title}`,
          status: 'todo',
          priority: 'high',
          estimatedHours: 2,
          tags: ['research', 'planning'],
          dependencies: []
        },
        {
          title: 'Implementation',
          description: `Implement the main components for: ${input.title}`,
          status: 'todo',
          priority: 'high',
          estimatedHours: 4,
          tags: ['development'],
          dependencies: []
        },
        {
          title: 'Testing and Review',
          description: `Test and review the implementation of: ${input.title}`,
          status: 'todo',
          priority: 'medium',
          estimatedHours: 2,
          tags: ['testing', 'review'],
          dependencies: []
        }
      ],
      reasoning: 'Fallback breakdown due to AI service unavailability',
      estimatedTotalHours: 8
    }
  }
} 