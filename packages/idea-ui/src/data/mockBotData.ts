export interface Conversation {
  id: string
  userId: string
  username: string
  firstName: string
  lastMessage: string
  lastActivity: Date
  messageCount: number
  status: 'active' | 'inactive'
}

export interface Contact {
  id: string
  username: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  joinedAt: Date
  lastSeen: Date
  isActive: boolean
  totalMessages: number
  avgResponseTime: string
  primaryTopics: string[]
  interactionScore: number
  influenceWeight: number
  role: 'advisor' | 'colleague' | 'stakeholder' | 'expert' | 'investor' | 'team'
  decisionAreas: string[]
  trustLevel: 'high' | 'medium' | 'low'
  conversationHistory: {
    date: Date
    messageCount: number
    topic: string
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  preferences: {
    preferredTime: string
    communicationStyle: 'formal' | 'casual'
    interests: string[]
  }
}

export interface BotInstance {
  id: string
  name: string
  description: string
  avatar?: string
  personality: 'professional' | 'friendly' | 'technical' | 'creative'
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  createdAt: Date
  lastActivity: Date
  version: string
  stats: {
    totalUsers: number
    activeConversations: number
    messagesProcessed: number
    uptime: string
    avgResponseTime: string
    errorRate: number
  }
  configuration: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    enabledFeatures: string[]
    rateLimits: {
      messagesPerMinute: number
      messagesPerDay: number
    }
  }
  deployment: {
    environment: 'production' | 'staging' | 'development'
    region: string
    resources: {
      cpu: string
      memory: string
      storage: string
    }
  }
}

export const mockConversations: Conversation[] = [
  {
    id: '1',
    userId: '123456789',
    username: 'razvan',
    firstName: 'Razvan',
    lastMessage: 'Can you help me analyze the enterprise sales strategy?',
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    messageCount: 47,
    status: 'active'
  },
  {
    id: '2',
    userId: '987654321',
    username: 'john_doe',
    firstName: 'John',
    lastMessage: 'Thanks for the product roadmap insights!',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messageCount: 23,
    status: 'inactive'
  },
  {
    id: '3',
    userId: '456789123',
    username: 'sarah_m',
    firstName: 'Sarah',
    lastMessage: 'What are the latest competitive analysis findings?',
    lastActivity: new Date(Date.now() - 15 * 60 * 1000),
    messageCount: 31,
    status: 'active'
  }
]

export const mockContacts: Contact[] = [
  {
    id: '123456789',
    username: 'razvan',
    firstName: 'Razvan',
    lastName: 'Cosma',
    email: 'razvan@guild.xyz',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    joinedAt: new Date('2024-01-15'),
    lastSeen: new Date(Date.now() - 5 * 60 * 1000),
    isActive: true,
    totalMessages: 847,
    avgResponseTime: '2.3 minutes',
    primaryTopics: ['Strategy', 'Product', 'Enterprise Sales'],
    interactionScore: 95,
    influenceWeight: 100,
    role: 'advisor',
    decisionAreas: ['Strategic Direction', 'Product Vision', 'Market Entry'],
    trustLevel: 'high',
    conversationHistory: [
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        messageCount: 12,
        topic: 'Enterprise Sales Strategy',
        sentiment: 'positive'
      }
    ],
    preferences: {
      preferredTime: 'Morning (9-11 AM)',
      communicationStyle: 'formal',
      interests: ['Strategic Planning', 'Market Analysis', 'Team Management']
    }
  }
]

export const mockBots: BotInstance[] = [
  {
    id: 'strategic-ai',
    name: 'Strategic AI Assistant',
    description: 'Primary strategic intelligence bot for CEO strategic insights and decision support',
    personality: 'professional',
    status: 'running',
    createdAt: new Date('2024-01-01'),
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    version: '2.1.0',
    stats: {
      totalUsers: 12,
      activeConversations: 3,
      messagesProcessed: 3847,
      uptime: '99.2%',
      avgResponseTime: '1.2s',
      errorRate: 0.8
    },
    configuration: {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 4096,
      systemPrompt: 'You are a strategic intelligence assistant for Guild.xyz CEO...',
      enabledFeatures: ['idea_management', 'vector_search', 'strategic_analysis'],
      rateLimits: {
        messagesPerMinute: 30,
        messagesPerDay: 1000
      }
    },
    deployment: {
      environment: 'production',
      region: 'us-west-2',
      resources: {
        cpu: '2 vCPU',
        memory: '4 GB',
        storage: '20 GB'
      }
    }
  },
  {
    id: 'product-helper',
    name: 'Product Development Helper',
    description: 'Specialized bot for product development insights and feature planning',
    personality: 'technical',
    status: 'running',
    createdAt: new Date('2024-01-15'),
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    version: '1.8.3',
    stats: {
      totalUsers: 8,
      activeConversations: 1,
      messagesProcessed: 1245,
      uptime: '98.7%',
      avgResponseTime: '0.9s',
      errorRate: 1.2
    },
    configuration: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.5,
      maxTokens: 2048,
      systemPrompt: 'You are a product development assistant...',
      enabledFeatures: ['feature_analysis', 'user_feedback', 'roadmap_planning'],
      rateLimits: {
        messagesPerMinute: 25,
        messagesPerDay: 800
      }
    },
    deployment: {
      environment: 'production',
      region: 'us-west-2',
      resources: {
        cpu: '1 vCPU',
        memory: '2 GB',
        storage: '10 GB'
      }
    }
  },
  {
    id: 'market-analyst',
    name: 'Market Intelligence Bot',
    description: 'Market research and competitive analysis specialized assistant',
    personality: 'friendly',
    status: 'maintenance',
    createdAt: new Date('2024-02-01'),
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
    version: '1.5.2',
    stats: {
      totalUsers: 5,
      activeConversations: 0,
      messagesProcessed: 892,
      uptime: '95.3%',
      avgResponseTime: '1.8s',
      errorRate: 2.1
    },
    configuration: {
      model: 'claude-3-opus-20240229',
      temperature: 0.4,
      maxTokens: 3072,
      systemPrompt: 'You are a market intelligence specialist...',
      enabledFeatures: ['market_research', 'competitor_analysis', 'trend_detection'],
      rateLimits: {
        messagesPerMinute: 20,
        messagesPerDay: 600
      }
    },
    deployment: {
      environment: 'staging',
      region: 'us-east-1',
      resources: {
        cpu: '1 vCPU',
        memory: '3 GB',
        storage: '15 GB'
      }
    }
  }
] 