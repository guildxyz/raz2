export type IdeaCategory = 'strategy' | 'product' | 'sales' | 'partnerships' | 'competitive' | 'market' | 'team' | 'operations'

export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'

export type IdeaStatus = 'active' | 'in_progress' | 'completed' | 'archived' | 'cancelled'

export type SubtaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Subtask {
  id: string
  title: string
  description?: string
  status: SubtaskStatus
  priority: IdeaPriority
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

export interface Idea {
  id: string
  title: string
  content: string
  category: IdeaCategory
  priority: IdeaPriority
  status: IdeaStatus
  tags: string[]
  userId: string
  chatId?: number
  subtasks: Subtask[]
  kanbanColumns: KanbanColumn[]
  aiBreakdown?: AITaskBreakdown
  createdAt: Date
  updatedAt: Date
}

export interface CreateIdeaInput {
  title: string
  content: string
  category?: IdeaCategory
  priority?: IdeaPriority
  tags?: string[]
  userId: string
  chatId?: number
  generateSubtasks?: boolean
}

export interface UpdateIdeaInput {
  id: string
  title?: string
  content?: string
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
  subtasks?: Subtask[]
  regenerateSubtasks?: boolean
}

export interface IdeaFilter {
  userId?: string
  chatId?: number
  category?: IdeaCategory
  priority?: IdeaPriority
  status?: IdeaStatus
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface IdeaFormData {
  title: string
  content: string
  category: IdeaCategory
  priority: IdeaPriority
  tags: string[]
}

export interface IdeaStoreContextType {
  ideas: Idea[]
  loading: boolean
  error: string | null
  createIdea: (idea: CreateIdeaInput) => Promise<void>
  updateIdea: (idea: UpdateIdeaInput) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
  refreshIdeas: () => Promise<void>
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  userId?: string
  userName?: string
  messageType: 'text' | 'command' | 'photo' | 'document' | 'voice' | 'video' | 'audio' | 'sticker' | 'location' | 'contact'
  command?: {
    command: string
    args: string[]
  }
  metadata?: {
    wordCount: number
    sentimentScore?: number
    topics?: string[]
    entities?: string[]
    responseTime?: number
    edited?: boolean
    reactions?: string[]
  }
}

export interface ConversationParticipant {
  id: string
  name: string
  username?: string
  role: 'user' | 'bot' | 'admin'
  messageCount: number
  firstSeen: Date
  lastSeen: Date
  isActive: boolean
  avatar?: string
}

export interface ConversationAnalytics {
  messageCount: number
  participantCount: number
  averageResponseTime: number
  mostActiveTimeOfDay: string
  commonTopics: string[]
  sentimentTrend: { date: Date; score: number }[]
  wordCloudData: { text: string; value: number }[]
  commandUsage: { command: string; count: number }[]
  messageTypes: { type: string; count: number }[]
  conversationFlow: {
    userMessages: number
    botResponses: number
    commands: number
    systemMessages: number
  }
}

export interface AIConversationInsights {
  summary: string
  keyTopics: string[]
  participantPersonalities: { [userId: string]: string }
  conversationQuality: 'excellent' | 'good' | 'average' | 'poor'
  suggestedActions: string[]
  potentialIssues: string[]
  learningOpportunities: string[]
  conversationOutcome: string
  nextSteps?: string[]
}

export interface Conversation {
  id: string
  chatId: number
  title: string
  type: 'private' | 'group' | 'supergroup' | 'channel'
  participants: ConversationParticipant[]
  messages: ConversationMessage[]
  createdAt: Date
  lastActivity: Date
  status: 'active' | 'archived' | 'muted'
  tags: string[]
  analytics: ConversationAnalytics
  aiInsights?: AIConversationInsights
  strategicContext?: string[]
  priority: 'high' | 'medium' | 'low'
  archived: boolean
}

export interface ConversationFilter {
  dateRange: {
    start: Date
    end: Date
  }
  participants: string[]
  messageTypes: string[]
  commands: string[]
  sentimentRange: {
    min: number
    max: number
  }
  tags: string[]
  priority: ('high' | 'medium' | 'low')[]
  status: ('active' | 'archived' | 'muted')[]
  searchQuery: string
  minMessages: number
  maxMessages: number
}

export interface ConversationSearchResult {
  conversation: Conversation
  relevanceScore: number
  matchedMessages: ConversationMessage[]
  highlightedContent: string
}

export interface CreateConversationInput {
  chatId: number
  title: string
  type: 'private' | 'group' | 'supergroup' | 'channel'
  participants: Omit<ConversationParticipant, 'messageCount' | 'firstSeen' | 'lastSeen' | 'isActive'>[]
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
}

export interface UpdateConversationInput {
  id: string
  title?: string
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
  status?: 'active' | 'archived' | 'muted'
  strategicContext?: string[]
}

export interface ContactInteraction {
  id: string
  date: Date
  type: 'message' | 'call' | 'meeting' | 'email'
  duration?: number
  topic: string
  sentiment: 'positive' | 'neutral' | 'negative'
  outcome?: string
  followUpRequired: boolean
  notes?: string
}

export interface ContactRelationship {
  contactId: string
  type: 'direct' | 'referral' | 'mutual_connection'
  strength: number
  context: string
  establishedDate: Date
}

export interface ContactAIInsights {
  communicationPattern: {
    preferredTime: string[]
    responseTimePattern: string
    topicPreferences: string[]
    sentimentTrend: 'improving' | 'stable' | 'declining'
  }
  influenceMetrics: {
    networkReach: number
    decisionMakingPower: number
    industryExpertise: string[]
    recommendationLikelihood: number
  }
  engagementPrediction: {
    likelihood: number
    bestApproach: string
    optimalTiming: string
    suggestedTopics: string[]
  }
  riskAssessment: {
    churnProbability: number
    competitorRisk: number
    satisfactionScore: number
  }
}

export interface Contact {
  id: string
  username: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  company?: string
  position?: string
  linkedinUrl?: string
  twitterUrl?: string
  website?: string
  avatarUrl?: string
  joinedAt: Date
  lastSeen: Date
  isActive: boolean
  totalMessages: number
  totalInteractions: number
  avgResponseTime: string
  primaryTopics: string[]
  secondaryTopics: string[]
  interactionScore: number
  influenceWeight: number
  role: 'advisor' | 'colleague' | 'stakeholder' | 'expert' | 'investor' | 'team' | 'client' | 'partner' | 'competitor'
  decisionAreas: string[]
  trustLevel: 'high' | 'medium' | 'low'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'active' | 'inactive' | 'archived' | 'blocked'
  tags: string[]
  source: 'telegram' | 'email' | 'meeting' | 'referral' | 'social' | 'event'
  interactions: ContactInteraction[]
  relationships: ContactRelationship[]
  aiInsights?: ContactAIInsights
  preferences: {
    preferredTime: string
    timezone?: string
    communicationStyle: 'formal' | 'casual'
    interests: string[]
    languages: string[]
  }
  businessContext: {
    industry: string
    companySize: string
    budget?: string
    decisionTimeline?: string
    painPoints: string[]
    goals: string[]
  }
  conversationHistory: {
    date: Date
    messageCount: number
    topic: string
    sentiment: 'positive' | 'neutral' | 'negative'
    keyPoints: string[]
    actionItems: string[]
  }[]
  notes: string[]
  reminders: {
    id: string
    date: Date
    type: 'follow_up' | 'meeting' | 'deadline' | 'birthday' | 'custom'
    title: string
    description?: string
    completed: boolean
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface ContactFilter {
  search?: string
  roles?: Contact['role'][]
  trustLevels?: Contact['trustLevel'][]
  priorities?: Contact['priority'][]
  statuses?: Contact['status'][]
  sources?: Contact['source'][]
  tags?: string[]
  industries?: string[]
  locations?: string[]
  interactionScoreMin?: number
  interactionScoreMax?: number
  influenceWeightMin?: number
  influenceWeightMax?: number
  lastSeenDays?: number
  hasReminders?: boolean
  recentInteraction?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ContactAnalytics {
  totalContacts: number
  activeContacts: number
  newContactsThisMonth: number
  totalInteractions: number
  avgInteractionScore: number
  avgInfluenceWeight: number
  contactsByRole: Record<Contact['role'], number>
  contactsByTrustLevel: Record<Contact['trustLevel'], number>
  contactsBySource: Record<Contact['source'], number>
  contactsByIndustry: Record<string, number>
  topInfluencers: Contact[]
  recentlyActive: Contact[]
  needsFollowUp: Contact[]
  sentimentTrends: {
    date: Date
    positive: number
    neutral: number
    negative: number
  }[]
  interactionVolume: {
    date: Date
    count: number
  }[]
  networkGrowth: {
    date: Date
    total: number
    new: number
  }[]
}

export interface ContactSearchResult {
  contact: Contact
  relevanceScore: number
  matchedFields: string[]
  snippet: string
}

export interface CreateContactInput {
  username: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  company?: string
  position?: string
  role: Contact['role']
  source: Contact['source']
  tags?: string[]
  notes?: string[]
  businessContext?: Partial<Contact['businessContext']>
  preferences?: Partial<Contact['preferences']>
}

export interface UpdateContactInput {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  company?: string
  position?: string
  role?: Contact['role']
  priority?: Contact['priority']
  status?: Contact['status']
  tags?: string[]
  notes?: string[]
  businessContext?: Partial<Contact['businessContext']>
  preferences?: Partial<Contact['preferences']>
} 