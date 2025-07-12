import type { Conversation } from '../types'

export const mockConversations: Conversation[] = [
  {
    id: '1',
    chatId: 12345,
    title: 'Strategic Planning Discussion',
    type: 'private',
    participants: [
      {
        id: 'user1',
        name: 'CEO',
        username: 'guild_ceo',
        role: 'user',
        messageCount: 15,
        firstSeen: new Date('2024-01-15T10:00:00'),
        lastSeen: new Date('2024-01-15T14:30:00'),
        isActive: true
      },
      {
        id: 'bot1',
        name: 'Strategic AI Assistant',
        role: 'bot',
        messageCount: 14,
        firstSeen: new Date('2024-01-15T10:01:00'),
        lastSeen: new Date('2024-01-15T14:31:00'),
        isActive: true
      }
    ],
    messages: [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hi there! I need help with strategic planning for our Guild.xyz expansion.',
        timestamp: new Date('2024-01-15T10:00:00'),
        userId: 'user1',
        userName: 'CEO',
        messageType: 'text' as const,
        metadata: {
          wordCount: 12,
          sentimentScore: 0.3,
          topics: ['strategy', 'expansion', 'planning'],
          entities: ['Guild.xyz']
        }
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'I\'d be happy to help with your strategic planning! What specific aspects of the expansion are you considering?',
        timestamp: new Date('2024-01-15T10:01:00'),
        messageType: 'text' as const,
        metadata: {
          wordCount: 18,
          sentimentScore: 0.5,
          responseTime: 60
        }
      }
    ],
    createdAt: new Date('2024-01-15T10:00:00'),
    lastActivity: new Date('2024-01-15T14:31:00'),
    status: 'active',
    tags: ['strategy', 'expansion', 'high-priority'],
    analytics: {
      messageCount: 29,
      participantCount: 2,
      averageResponseTime: 120,
      mostActiveTimeOfDay: '10:00',
      commonTopics: ['strategy', 'expansion', 'guild', 'planning'],
      sentimentTrend: [
        { date: new Date('2024-01-15'), score: 0.4 }
      ],
      wordCloudData: [
        { text: 'strategy', value: 8 },
        { text: 'expansion', value: 6 },
        { text: 'guild', value: 5 }
      ],
      commandUsage: [
        { command: 'capture', count: 3 },
        { command: 'search', count: 2 }
      ],
      messageTypes: [
        { type: 'text', count: 27 },
        { type: 'command', count: 2 }
      ],
      conversationFlow: {
        userMessages: 15,
        botResponses: 14,
        commands: 2,
        systemMessages: 0
      }
    },
    priority: 'high',
    archived: false
  },
  {
    id: '2',
    chatId: 54321,
    title: 'Product Development Review',
    type: 'group',
    participants: [
      {
        id: 'user1',
        name: 'CEO',
        username: 'guild_ceo',
        role: 'user',
        messageCount: 12,
        firstSeen: new Date('2024-01-20T09:00:00'),
        lastSeen: new Date('2024-01-20T16:00:00'),
        isActive: true
      },
      {
        id: 'user2',
        name: 'CTO',
        username: 'guild_cto',
        role: 'user',
        messageCount: 18,
        firstSeen: new Date('2024-01-20T09:15:00'),
        lastSeen: new Date('2024-01-20T16:45:00'),
        isActive: true
      },
      {
        id: 'bot1',
        name: 'Strategic AI Assistant',
        role: 'bot',
        messageCount: 8,
        firstSeen: new Date('2024-01-20T09:30:00'),
        lastSeen: new Date('2024-01-20T16:30:00'),
        isActive: true
      }
    ],
    messages: [
      {
        id: '3',
        role: 'user' as const,
        content: 'Let\'s review our Q1 product roadmap and discuss upcoming features.',
        timestamp: new Date('2024-01-20T09:00:00'),
        userId: 'user1',
        userName: 'CEO',
        messageType: 'text' as const,
        metadata: {
          wordCount: 11,
          sentimentScore: 0.2,
          topics: ['product', 'roadmap', 'features'],
          entities: ['Q1']
        }
      },
      {
        id: '4',
        role: 'user' as const,
        content: 'Great idea! I\'ve prepared a list of features we\'re planning to ship.',
        timestamp: new Date('2024-01-20T09:02:00'),
        userId: 'user2',
        userName: 'CTO',
        messageType: 'text' as const,
        metadata: {
          wordCount: 13,
          sentimentScore: 0.6,
          topics: ['features', 'shipping', 'planning']
        }
      }
    ],
    createdAt: new Date('2024-01-20T09:00:00'),
    lastActivity: new Date('2024-01-20T16:45:00'),
    status: 'active',
    tags: ['product', 'development', 'roadmap'],
    analytics: {
      messageCount: 38,
      participantCount: 3,
      averageResponseTime: 180,
      mostActiveTimeOfDay: '14:00',
      commonTopics: ['product', 'development', 'features', 'roadmap'],
      sentimentTrend: [
        { date: new Date('2024-01-20'), score: 0.4 }
      ],
      wordCloudData: [
        { text: 'product', value: 12 },
        { text: 'features', value: 8 },
        { text: 'development', value: 6 }
      ],
      commandUsage: [
        { command: 'capture', count: 2 },
        { command: 'search', count: 1 }
      ],
      messageTypes: [
        { type: 'text', count: 35 },
        { type: 'command', count: 3 }
      ],
      conversationFlow: {
        userMessages: 30,
        botResponses: 8,
        commands: 3,
        systemMessages: 0
      }
    },
    priority: 'medium',
    archived: false
  }
] 