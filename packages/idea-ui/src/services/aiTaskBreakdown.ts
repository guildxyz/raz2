import type { AITaskBreakdown, IdeaCategory, IdeaPriority, SubtaskStatus } from '../types'

const API_BASE_URL = 'http://localhost:3000/api'

interface BreakdownRequest {
  title: string
  content: string
  category: IdeaCategory
  priority: IdeaPriority
}

export const aiTaskBreakdownService = {
  async breakdownIdea(idea: BreakdownRequest): Promise<AITaskBreakdown> {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(idea),
      })

      if (!response.ok) {
        throw new Error(`Failed to breakdown idea: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.warn('AI service not available, using mock breakdown:', error)
      return generateMockBreakdown(idea)
    }
  }
}

function generateMockBreakdown(idea: BreakdownRequest): AITaskBreakdown {
  const subtasks = []
  
  switch (idea.category) {
    case 'strategy':
      subtasks.push(
        {
          title: 'Research and Analysis',
          description: `Conduct market research and competitive analysis for: ${idea.title}`,
          status: 'todo' as SubtaskStatus,
          priority: 'high' as IdeaPriority,
          estimatedHours: 8,
          tags: ['research', 'analysis'],
          dependencies: [],
        },
        {
          title: 'Stakeholder Alignment',
          description: 'Present findings and get stakeholder buy-in for the strategic initiative',
          status: 'todo' as SubtaskStatus,
          priority: 'high' as IdeaPriority,
          estimatedHours: 4,
          tags: ['stakeholders', 'presentation'],
          dependencies: [],
        },
        {
          title: 'Implementation Planning',
          description: 'Develop detailed implementation roadmap and timeline',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 6,
          tags: ['planning', 'roadmap'],
          dependencies: [],
        },
        {
          title: 'Risk Assessment',
          description: 'Identify potential risks and mitigation strategies',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 3,
          tags: ['risk', 'mitigation'],
          dependencies: [],
        }
      )
      break

    case 'product':
      subtasks.push(
        {
          title: 'User Research',
          description: 'Conduct user interviews and gather requirements',
          status: 'todo' as SubtaskStatus,
          priority: 'high' as IdeaPriority,
          estimatedHours: 12,
          tags: ['research', 'users'],
          dependencies: [],
        },
        {
          title: 'Technical Feasibility',
          description: 'Assess technical requirements and constraints',
          status: 'todo' as SubtaskStatus,
          priority: 'high' as IdeaPriority,
          estimatedHours: 8,
          tags: ['technical', 'feasibility'],
          dependencies: [],
        },
        {
          title: 'Prototype Development',
          description: 'Create wireframes and interactive prototype',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 16,
          tags: ['prototype', 'design'],
          dependencies: [],
        },
        {
          title: 'Testing & Validation',
          description: 'Test prototype with users and validate assumptions',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 8,
          tags: ['testing', 'validation'],
          dependencies: [],
        }
      )
      break

    case 'sales':
      subtasks.push(
        {
          title: 'Target Market Analysis',
          description: 'Identify and analyze target customer segments',
          status: 'todo' as SubtaskStatus,
          priority: 'high' as IdeaPriority,
          estimatedHours: 6,
          tags: ['market', 'customers'],
          dependencies: [],
        },
        {
          title: 'Sales Materials',
          description: 'Create sales presentations, demos, and collateral',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 10,
          tags: ['materials', 'presentations'],
          dependencies: [],
        },
        {
          title: 'Team Training',
          description: 'Train sales team on new approach and materials',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 4,
          tags: ['training', 'team'],
          dependencies: [],
        },
        {
          title: 'Pilot Campaign',
          description: 'Execute pilot sales campaign and measure results',
          status: 'todo' as SubtaskStatus,
          priority: 'low' as IdeaPriority,
          estimatedHours: 12,
          tags: ['pilot', 'campaign'],
          dependencies: [],
        }
      )
      break

    default:
      subtasks.push(
        {
          title: 'Initial Planning',
          description: `Plan the implementation of: ${idea.title}`,
          status: 'todo' as SubtaskStatus,
          priority: idea.priority,
          estimatedHours: 4,
          tags: ['planning'],
          dependencies: [],
        },
        {
          title: 'Resource Allocation',
          description: 'Identify and allocate necessary resources',
          status: 'todo' as SubtaskStatus,
          priority: 'medium' as IdeaPriority,
          estimatedHours: 2,
          tags: ['resources'],
          dependencies: [],
        },
        {
          title: 'Execution',
          description: 'Execute the planned initiative',
          status: 'todo' as SubtaskStatus,
          priority: idea.priority,
          estimatedHours: 8,
          tags: ['execution'],
          dependencies: [],
        },
        {
          title: 'Review & Optimization',
          description: 'Review results and optimize approach',
          status: 'todo' as SubtaskStatus,
          priority: 'low' as IdeaPriority,
          estimatedHours: 3,
          tags: ['review', 'optimization'],
          dependencies: [],
        }
      )
  }

  const estimatedTotalHours = subtasks.reduce((total, task) => total + (task.estimatedHours || 0), 0)

  return {
    subtasks,
    reasoning: `Based on the ${idea.category} category and ${idea.priority} priority, I've broken down "${idea.title}" into ${subtasks.length} actionable subtasks. The breakdown focuses on systematic execution with clear dependencies and realistic time estimates.`,
    estimatedTotalHours
  }
} 