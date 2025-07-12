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

export interface ConversationMessage {
  id: string
  conversationId: string
  content: string
  role: 'user' | 'assistant' | 'system'
  userId?: string
  userName?: string
  timestamp: Date
  sentiment?: 'positive' | 'negative' | 'neutral'
  topics?: string[]
  entities?: string[]
  metadata?: Record<string, any>
}

export interface ConversationParticipant {
  userId?: string
  userName?: string
  role?: 'admin' | 'member' | 'guest'
  messageCount: number
  lastActive: Date
  avgSentiment?: number
}

export interface ConversationAnalytics {
  totalMessages: number
  participants: ConversationParticipant[]
  avgSentiment: number
  topTopics: Array<{ topic: string; count: number }>
  timeDistribution: Record<string, number>
  responseTime?: number
}

export interface AIConversationInsights {
  summary: string
  keyDecisions: string[]
  actionItems: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  topics: string[]
  qualityScore: number
  recommendedFollowUp?: string
}

export interface Conversation {
  id: string
  title: string
  status: 'active' | 'archived' | 'important'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startTime: Date
  lastActivity: Date
  messageCount: number
  participants: ConversationParticipant[]
  analytics: ConversationAnalytics
  aiInsights?: AIConversationInsights
  tags: string[]
  chatId?: number
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  avatar?: string
  trustLevel: 'low' | 'medium' | 'high'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  industry?: string
  location?: string
  notes?: string
  tags: string[]
  interactions: ContactInteraction[]
  aiInsights?: ContactAIInsights
  createdAt: Date
  updatedAt: Date
  lastContact?: Date
}

export interface ContactInteraction {
  id: string
  type: 'message' | 'call' | 'meeting' | 'email'
  subject?: string
  content?: string
  timestamp: Date
  sentiment?: 'positive' | 'negative' | 'neutral'
  outcome?: string
  followUpRequired?: boolean
  metadata?: Record<string, any>
}

export interface ContactRelationship {
  fromContactId: string
  toContactId: string
  relationshipType: 'colleague' | 'reports_to' | 'client' | 'vendor' | 'partner'
  strength: 'weak' | 'medium' | 'strong'
  notes?: string
}

export interface ContactAIInsights {
  communicationStyle: string
  engagementLevel: 'low' | 'medium' | 'high'
  responsePattern?: string
  influenceScore: number
  riskAssessment: 'low' | 'medium' | 'high'
  nextBestAction?: string
  engagementPrediction?: number
}

export interface NotificationConfig {
  type: 'reminder' | 'follow_up' | 'alert' | 'insight'
  channels: Array<'telegram' | 'email' | 'webhook'>
  conditions?: Record<string, any>
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly'
    time?: string
    days?: number[]
  }
}

export interface AIServiceRequest {
  type: 'analyze_conversation' | 'generate_insights' | 'categorize_content' | 'extract_entities' | 'sentiment_analysis'
  content: string
  context?: Record<string, any>
  options?: Record<string, any>
}

export interface AIServiceResponse {
  success: boolean
  data?: any
  insights?: string[]
  confidence?: number
  metadata?: Record<string, any>
  error?: string
} 