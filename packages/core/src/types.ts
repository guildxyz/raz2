import type { Idea as BaseIdea, CreateIdeaInput as BaseCreateInput, UpdateIdeaInput as BaseUpdateInput } from '@raz2/shared'

export type SubtaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Subtask {
  id: string
  title: string
  description?: string
  status: SubtaskStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  estimatedHours?: number
  tags: string[]
  dependencies: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface KanbanColumn {
  id: SubtaskStatus
  title: string
  subtasks: Subtask[]
  limit?: number
}

export interface AITaskBreakdown {
  subtasks: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>[]
  reasoning: string
  estimatedTotalHours: number
}

export interface ExtendedIdea extends BaseIdea {
  subtasks: Subtask[]
  kanbanColumns: KanbanColumn[]
  aiBreakdown?: AITaskBreakdown
}

export interface CreateIdeaRequest extends BaseCreateInput {
  generateSubtasks?: boolean
}

export interface UpdateIdeaRequest extends BaseUpdateInput {
  subtasks?: Subtask[]
  regenerateSubtasks?: boolean
}

export interface SubtaskUpdateRequest {
  ideaId: string
  subtaskId: string
  updates: Partial<Subtask>
}

export interface CreateSubtaskRequest {
  ideaId: string
  subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>
}

export interface DeleteSubtaskRequest {
  ideaId: string
  subtaskId: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ServerConfig {
  port: number
  host: string
  corsOrigins: string[]
  apiPrefix: string
} 