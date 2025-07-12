import { createLogger } from '@raz2/shared'
import { ClaudeClient } from '@raz2/claude-api'
import type { 
  Conversation, 
  ConversationMessage, 
  ConversationAnalytics, 
  AIConversationInsights,
  ConversationParticipant 
} from '../types'

export class ConversationService {
  private logger = createLogger('conversation-service')
  private conversations = new Map<string, Conversation>()
  private messages = new Map<string, ConversationMessage[]>()
  private claude?: ClaudeClient

  constructor(claude?: ClaudeClient) {
    this.claude = claude
    this.generateMockData()
  }

  async createConversation(
    title: string,
    chatId?: number,
    initialMessage?: string,
    userId?: string,
    userName?: string
  ): Promise<Conversation> {
    const id = this.generateId()
    const now = new Date()
    
    const conversation: Conversation = {
      id,
      title,
      status: 'active',
      priority: 'medium',
      startTime: now,
      lastActivity: now,
      messageCount: 0,
      participants: [],
      analytics: {
        totalMessages: 0,
        participants: [],
        avgSentiment: 0,
        topTopics: [],
        timeDistribution: {}
      },
      tags: [],
      chatId
    }

    if (initialMessage && userId) {
      const message = await this.addMessage(
        id,
        initialMessage,
        'user',
        userId,
        userName
      )
      conversation.messageCount = 1
      conversation.lastActivity = message.timestamp
    }

    this.conversations.set(id, conversation)
    
    this.logger.info('Created conversation', {
      id,
      title,
      chatId,
      hasInitialMessage: !!initialMessage
    })

    return conversation
  }

  async addMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' | 'system',
    userId?: string,
    userName?: string
  ): Promise<ConversationMessage> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    const message: ConversationMessage = {
      id: this.generateId(),
      conversationId,
      content,
      role,
      userId,
      userName,
      timestamp: new Date(),
      sentiment: await this.analyzeSentiment(content),
      topics: await this.extractTopics(content),
      entities: await this.extractEntities(content)
    }

    const messages = this.messages.get(conversationId) || []
    messages.push(message)
    this.messages.set(conversationId, messages)

    conversation.messageCount = messages.length
    conversation.lastActivity = message.timestamp
    
    await this.updateAnalytics(conversationId)

    this.logger.info('Added message to conversation', {
      conversationId,
      messageId: message.id,
      role,
      contentLength: content.length
    })

    return message
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null
  }

  async getConversationMessages(id: string): Promise<ConversationMessage[]> {
    return this.messages.get(id) || []
  }

  async listConversations(
    filter?: {
      status?: string
      priority?: string
      userId?: string
      limit?: number
    }
  ): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values())

    if (filter?.status) {
      conversations = conversations.filter(c => c.status === filter.status)
    }
    if (filter?.priority) {
      conversations = conversations.filter(c => c.priority === filter.priority)
    }
    if (filter?.userId) {
      conversations = conversations.filter(c => 
        c.participants.some(p => p.userId === filter.userId)
      )
    }

    conversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())

    if (filter?.limit) {
      conversations = conversations.slice(0, filter.limit)
    }

    return conversations
  }

  async updateConversation(
    id: string,
    updates: Partial<Pick<Conversation, 'title' | 'status' | 'priority' | 'tags'>>
  ): Promise<Conversation | null> {
    const conversation = this.conversations.get(id)
    if (!conversation) return null

    Object.assign(conversation, updates)
    
    this.logger.info('Updated conversation', { id, updates })
    
    return conversation
  }

  async deleteConversation(id: string): Promise<boolean> {
    const deleted = this.conversations.delete(id)
    this.messages.delete(id)
    
    this.logger.info('Deleted conversation', { id, success: deleted })
    
    return deleted
  }

  async generateAIInsights(conversationId: string): Promise<AIConversationInsights | null> {
    const messages = this.messages.get(conversationId)
    if (!messages || !this.claude) return null

    try {
      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n')

      const prompt = `Analyze this conversation and provide insights:

${conversationText}

Please provide a JSON response with:
{
  "summary": "Brief summary of the conversation",
  "keyDecisions": ["decision1", "decision2"],
  "actionItems": ["action1", "action2"],
  "sentiment": "positive|negative|neutral",
  "topics": ["topic1", "topic2"],
  "qualityScore": 0-100,
  "recommendedFollowUp": "What should happen next"
}`

      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const insights = JSON.parse(jsonMatch[0])
          
          const conversation = this.conversations.get(conversationId)
          if (conversation) {
            conversation.aiInsights = insights
          }
          
          return insights
        }
      } catch (parseError) {
        this.logger.warn('Failed to parse AI insights', { parseError })
      }
    } catch (error) {
      this.logger.error('Failed to generate AI insights', { error })
    }

    return null
  }

  async searchConversations(query: string, limit = 20): Promise<Conversation[]> {
    const conversations = Array.from(this.conversations.values())
    const searchTerms = query.toLowerCase().split(' ')
    
    const scored = conversations.map(conversation => {
      let score = 0
      const text = `${conversation.title} ${conversation.tags.join(' ')}`.toLowerCase()
      
      searchTerms.forEach(term => {
        if (text.includes(term)) score += 1
      })
      
      const messages = this.messages.get(conversation.id) || []
      messages.forEach(msg => {
        if (msg.content.toLowerCase().includes(query.toLowerCase())) {
          score += 2
        }
      })
      
      return { conversation, score }
    })

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.conversation)
  }

  async getAnalytics(conversationId?: string): Promise<ConversationAnalytics | null> {
    if (conversationId) {
      const conversation = this.conversations.get(conversationId)
      return conversation?.analytics || null
    }

    const allConversations = Array.from(this.conversations.values())
    const totalMessages = allConversations.reduce((sum, c) => sum + c.messageCount, 0)
    
    const allParticipants = new Map<string, ConversationParticipant>()
    const topicsCount = new Map<string, number>()
    
    allConversations.forEach(conversation => {
      conversation.participants.forEach(participant => {
        const key = participant.userId || participant.userName || 'anonymous'
        const existing = allParticipants.get(key)
        if (existing) {
          existing.messageCount += participant.messageCount
          existing.lastActive = new Date(Math.max(
            existing.lastActive.getTime(), 
            participant.lastActive.getTime()
          ))
        } else {
          allParticipants.set(key, { ...participant })
        }
      })

      const messages = this.messages.get(conversation.id) || []
      messages.forEach(msg => {
        msg.topics?.forEach(topic => {
          topicsCount.set(topic, (topicsCount.get(topic) || 0) + 1)
        })
      })
    })

    const topTopics = Array.from(topicsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    return {
      totalMessages,
      participants: Array.from(allParticipants.values()),
      avgSentiment: 0.5,
      topTopics,
      timeDistribution: {}
    }
  }

  private async updateAnalytics(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId)
    const messages = this.messages.get(conversationId)
    
    if (!conversation || !messages) return

    const participantsMap = new Map<string, ConversationParticipant>()
    const topicsCount = new Map<string, number>()
    let totalSentiment = 0
    let sentimentCount = 0

    messages.forEach(msg => {
      const key = msg.userId || msg.userName || 'anonymous'
      const participant = participantsMap.get(key) || {
        userId: msg.userId,
        userName: msg.userName,
        role: 'member',
        messageCount: 0,
        lastActive: msg.timestamp
      }
      
      participant.messageCount++
      participant.lastActive = new Date(Math.max(
        participant.lastActive.getTime(),
        msg.timestamp.getTime()
      ))
      
      participantsMap.set(key, participant)

      msg.topics?.forEach(topic => {
        topicsCount.set(topic, (topicsCount.get(topic) || 0) + 1)
      })

      if (msg.sentiment) {
        const sentimentValue = msg.sentiment === 'positive' ? 1 : 
                             msg.sentiment === 'negative' ? -1 : 0
        totalSentiment += sentimentValue
        sentimentCount++
      }
    })

    const topTopics = Array.from(topicsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    conversation.participants = Array.from(participantsMap.values())
    conversation.analytics = {
      totalMessages: messages.length,
      participants: conversation.participants,
      avgSentiment: sentimentCount > 0 ? totalSentiment / sentimentCount : 0,
      topTopics,
      timeDistribution: {}
    }
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'like']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'problem', 'issue']
    
    const text = content.toLowerCase()
    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private async extractTopics(content: string): Promise<string[]> {
    const topics = []
    const text = content.toLowerCase()
    
    if (text.includes('strategy') || text.includes('plan')) topics.push('strategy')
    if (text.includes('product') || text.includes('feature')) topics.push('product')
    if (text.includes('sales') || text.includes('client')) topics.push('sales')
    if (text.includes('team') || text.includes('hiring')) topics.push('team')
    if (text.includes('technical') || text.includes('development')) topics.push('technical')
    
    return topics
  }

  private async extractEntities(content: string): Promise<string[]> {
    const entities = []
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = content.match(emailRegex)
    if (emails) entities.push(...emails)
    
    return entities
  }

  private generateMockData(): void {
    const conversations = [
      {
        id: 'conv-1',
        title: 'Guild.xyz Strategic Planning Q4 2024',
        status: 'active' as const,
        priority: 'high' as const,
        startTime: new Date('2024-10-01T10:00:00Z'),
        lastActivity: new Date('2024-12-15T16:30:00Z'),
        messageCount: 45,
        participants: [
          {
            userId: 'user-ceo',
            userName: 'CEO',
            role: 'admin' as const,
            messageCount: 20,
            lastActive: new Date('2024-12-15T16:30:00Z'),
            avgSentiment: 0.8
          },
          {
            userId: 'user-cto',
            userName: 'CTO',
            role: 'member' as const,
            messageCount: 15,
            lastActive: new Date('2024-12-15T14:20:00Z'),
            avgSentiment: 0.6
          },
          {
            userId: 'user-head-sales',
            userName: 'Head of Sales',
            role: 'member' as const,
            messageCount: 10,
            lastActive: new Date('2024-12-14T18:45:00Z'),
            avgSentiment: 0.7
          }
        ],
        analytics: {
          totalMessages: 45,
          participants: [],
          avgSentiment: 0.7,
          topTopics: [
            { topic: 'strategy', count: 12 },
            { topic: 'product', count: 8 },
            { topic: 'sales', count: 6 }
          ],
          timeDistribution: {
            '09:00': 5,
            '10:00': 8,
            '11:00': 6,
            '14:00': 10,
            '15:00': 12,
            '16:00': 4
          },
          responseTime: 1800
        },
        aiInsights: {
          summary: 'Strategic planning discussion focused on Q4 goals, product roadmap, and sales targets. Key decisions made around new enterprise features and partnership strategies.',
          keyDecisions: [
            'Launch Enterprise Analytics Dashboard by Q1 2025',
            'Expand partnership program with major DeFi protocols',
            'Increase sales team by 3 members for enterprise focus'
          ],
          actionItems: [
            'Draft technical requirements for analytics dashboard',
            'Schedule partnership meetings with Compound and Aave',
            'Create job descriptions for enterprise sales roles'
          ],
          sentiment: 'positive' as const,
          topics: ['strategy', 'product', 'partnerships', 'hiring'],
          qualityScore: 85,
          recommendedFollowUp: 'Schedule follow-up meeting to review progress on action items and finalize Q1 roadmap'
        },
        tags: ['strategy', 'quarterly-planning', 'leadership'],
        chatId: -1001234567890
      },
      {
        id: 'conv-2',
        title: 'Customer Feedback: Enterprise Dashboard',
        status: 'important' as const,
        priority: 'urgent' as const,
        startTime: new Date('2024-12-10T14:30:00Z'),
        lastActivity: new Date('2024-12-15T11:20:00Z'),
        messageCount: 23,
        participants: [
          {
            userId: 'user-ceo',
            userName: 'CEO',
            role: 'admin' as const,
            messageCount: 8,
            lastActive: new Date('2024-12-15T11:20:00Z'),
            avgSentiment: 0.3
          },
          {
            userId: 'user-product-manager',
            userName: 'Product Manager',
            role: 'member' as const,
            messageCount: 10,
            lastActive: new Date('2024-12-15T10:45:00Z'),
            avgSentiment: 0.5
          },
          {
            userId: 'user-support',
            userName: 'Customer Support',
            role: 'member' as const,
            messageCount: 5,
            lastActive: new Date('2024-12-14T16:20:00Z'),
            avgSentiment: 0.2
          }
        ],
        analytics: {
          totalMessages: 23,
          participants: [],
          avgSentiment: 0.3,
          topTopics: [
            { topic: 'customer-feedback', count: 8 },
            { topic: 'dashboard', count: 6 },
            { topic: 'bugs', count: 4 }
          ],
          timeDistribution: {
            '10:00': 3,
            '11:00': 5,
            '14:00': 7,
            '15:00': 4,
            '16:00': 4
          },
          responseTime: 3600
        },
        aiInsights: {
          summary: 'Discussion about critical customer feedback regarding the new Enterprise Dashboard. Multiple usability issues and bugs reported by key enterprise clients.',
          keyDecisions: [
            'Hotfix release for critical dashboard bugs by end of week',
            'Conduct user research sessions with affected enterprise clients',
            'Temporary rollback option for clients experiencing issues'
          ],
          actionItems: [
            'Create bug fix priority list with engineering team',
            'Schedule user research calls with top 5 enterprise clients',
            'Prepare communication for affected customers'
          ],
          sentiment: 'negative' as const,
          topics: ['customer-feedback', 'product-issues', 'enterprise'],
          qualityScore: 75,
          recommendedFollowUp: 'Daily standups until issues are resolved and follow-up customer satisfaction survey'
        },
        tags: ['customer-feedback', 'urgent', 'enterprise', 'product-issues'],
        chatId: -1001234567891
      }
    ]

    conversations.forEach(conv => {
      this.conversations.set(conv.id, {
        ...conv,
        analytics: {
          ...conv.analytics,
          participants: conv.participants
        }
      })
    })

    const messages1: ConversationMessage[] = [
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        content: 'Team, let\'s kick off our Q4 strategic planning. I want to focus on three key areas: product roadmap, enterprise growth, and strategic partnerships.',
        role: 'user',
        userId: 'user-ceo',
        userName: 'CEO',
        timestamp: new Date('2024-10-01T10:00:00Z'),
        sentiment: 'positive',
        topics: ['strategy', 'product', 'partnerships'],
        entities: []
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        content: 'Sounds great! For the product roadmap, I think we should prioritize the Enterprise Analytics Dashboard that several clients have been requesting.',
        role: 'user',
        userId: 'user-cto',
        userName: 'CTO',
        timestamp: new Date('2024-10-01T10:05:00Z'),
        sentiment: 'positive',
        topics: ['product', 'enterprise'],
        entities: []
      }
    ]

    const messages2: ConversationMessage[] = [
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        content: 'We\'ve received multiple complaints about the new Enterprise Dashboard. Clients are reporting UI freezes and data loading issues.',
        role: 'user',
        userId: 'user-support',
        userName: 'Customer Support',
        timestamp: new Date('2024-12-10T14:30:00Z'),
        sentiment: 'negative',
        topics: ['customer-feedback', 'product-issues'],
        entities: []
      }
    ]

    this.messages.set('conv-1', messages1)
    this.messages.set('conv-2', messages2)

    this.logger.info('Generated mock conversation data', {
      conversationCount: conversations.length,
      totalMessages: messages1.length + messages2.length
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
} 