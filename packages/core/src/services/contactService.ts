import { createLogger } from '@raz2/shared'
import { ClaudeClient } from '@raz2/claude-api'
import type { 
  Contact, 
  ContactInteraction, 
  ContactRelationship, 
  ContactAIInsights 
} from '../types'

export class ContactService {
  private logger = createLogger('contact-service')
  private contacts = new Map<string, Contact>()
  private relationships = new Map<string, ContactRelationship[]>()
  private claude?: ClaudeClient

  constructor(claude?: ClaudeClient) {
    this.claude = claude
    this.generateMockData()
  }

  async createContact(
    name: string,
    email?: string,
    phone?: string,
    company?: string,
    role?: string,
    industry?: string,
    location?: string,
    notes?: string,
    tags: string[] = []
  ): Promise<Contact> {
    const id = this.generateId()
    const now = new Date()
    
    const contact: Contact = {
      id,
      name,
      email,
      phone,
      company,
      role,
      industry,
      location,
      notes,
      trustLevel: 'medium',
      priority: 'medium',
      tags,
      interactions: [],
      createdAt: now,
      updatedAt: now
    }

    this.contacts.set(id, contact)
    
    this.logger.info('Created contact', {
      id,
      name,
      company,
      role
    })

    return contact
  }

  async updateContact(
    id: string,
    updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>>
  ): Promise<Contact | null> {
    const contact = this.contacts.get(id)
    if (!contact) return null

    Object.assign(contact, {
      ...updates,
      updatedAt: new Date()
    })
    
    this.logger.info('Updated contact', { id, updates })
    
    return contact
  }

  async addInteraction(
    contactId: string,
    type: 'message' | 'call' | 'meeting' | 'email',
    content: string,
    subject?: string,
    outcome?: string,
    followUpRequired = false
  ): Promise<ContactInteraction | null> {
    const contact = this.contacts.get(contactId)
    if (!contact) return null

    const interaction: ContactInteraction = {
      id: this.generateId(),
      type,
      subject,
      content,
      timestamp: new Date(),
      sentiment: await this.analyzeSentiment(content),
      outcome,
      followUpRequired
    }

    contact.interactions.push(interaction)
    contact.lastContact = interaction.timestamp
    contact.updatedAt = new Date()

    await this.updateAIInsights(contactId)

    this.logger.info('Added interaction', {
      contactId,
      interactionId: interaction.id,
      type,
      sentiment: interaction.sentiment
    })

    return interaction
  }

  async getContact(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null
  }

  async listContacts(
    filter?: {
      company?: string
      role?: string
      trustLevel?: string
      priority?: string
      industry?: string
      tags?: string[]
      limit?: number
    }
  ): Promise<Contact[]> {
    let contacts = Array.from(this.contacts.values())

    if (filter?.company) {
      contacts = contacts.filter(c => 
        c.company?.toLowerCase().includes(filter.company!.toLowerCase())
      )
    }
    if (filter?.role) {
      contacts = contacts.filter(c => 
        c.role?.toLowerCase().includes(filter.role!.toLowerCase())
      )
    }
    if (filter?.trustLevel) {
      contacts = contacts.filter(c => c.trustLevel === filter.trustLevel)
    }
    if (filter?.priority) {
      contacts = contacts.filter(c => c.priority === filter.priority)
    }
    if (filter?.industry) {
      contacts = contacts.filter(c => c.industry === filter.industry)
    }
    if (filter?.tags && filter.tags.length > 0) {
      contacts = contacts.filter(c => 
        filter.tags!.some(tag => c.tags.includes(tag))
      )
    }

    contacts.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })

    if (filter?.limit) {
      contacts = contacts.slice(0, filter.limit)
    }

    return contacts
  }

  async searchContacts(query: string, limit = 20): Promise<Contact[]> {
    const contacts = Array.from(this.contacts.values())
    const searchTerms = query.toLowerCase().split(' ')
    
    const scored = contacts.map(contact => {
      let score = 0
      const searchableText = [
        contact.name,
        contact.email,
        contact.company,
        contact.role,
        contact.industry,
        contact.notes,
        ...contact.tags
      ].join(' ').toLowerCase()
      
      searchTerms.forEach(term => {
        const termCount = (searchableText.match(new RegExp(term, 'g')) || []).length
        score += termCount * (term.length > 3 ? 2 : 1)
      })
      
      if (score === 0) {
        contact.interactions.forEach(interaction => {
          if (interaction.content.toLowerCase().includes(query.toLowerCase())) {
            score += 1
          }
        })
      }
      
      return { contact, score }
    })

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.contact)
  }

  async deleteContact(id: string): Promise<boolean> {
    const deleted = this.contacts.delete(id)
    this.relationships.delete(id)
    
    this.logger.info('Deleted contact', { id, success: deleted })
    
    return deleted
  }

  async addRelationship(
    fromContactId: string,
    toContactId: string,
    relationshipType: 'colleague' | 'reports_to' | 'client' | 'vendor' | 'partner',
    strength: 'weak' | 'medium' | 'strong',
    notes?: string
  ): Promise<ContactRelationship | null> {
    const fromContact = this.contacts.get(fromContactId)
    const toContact = this.contacts.get(toContactId)
    
    if (!fromContact || !toContact) return null

    const relationship: ContactRelationship = {
      fromContactId,
      toContactId,
      relationshipType,
      strength,
      notes
    }

    const relationships = this.relationships.get(fromContactId) || []
    relationships.push(relationship)
    this.relationships.set(fromContactId, relationships)

    this.logger.info('Added relationship', {
      fromContactId,
      toContactId,
      relationshipType,
      strength
    })

    return relationship
  }

  async getContactRelationships(contactId: string): Promise<ContactRelationship[]> {
    return this.relationships.get(contactId) || []
  }

  async generateAIInsights(contactId: string): Promise<ContactAIInsights | null> {
    const contact = this.contacts.get(contactId)
    if (!contact || !this.claude) return null

    try {
      const interactionSummary = contact.interactions
        .slice(-10)
        .map(i => `${i.type}: ${i.content} (${i.sentiment})`)
        .join('\n')

      const prompt = `Analyze this contact and their interactions to provide insights:

Contact: ${contact.name}
Company: ${contact.company || 'Unknown'}
Role: ${contact.role || 'Unknown'}
Industry: ${contact.industry || 'Unknown'}

Recent Interactions:
${interactionSummary}

Please provide a JSON response with:
{
  "communicationStyle": "Brief description of their communication style",
  "engagementLevel": "low|medium|high",
  "responsePattern": "When and how they typically respond",
  "influenceScore": 0-100,
  "riskAssessment": "low|medium|high",
  "nextBestAction": "Recommended next action",
  "engagementPrediction": 0-100
}`

      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const insights = JSON.parse(jsonMatch[0])
          
          contact.aiInsights = insights
          
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

  async getContactAnalytics(): Promise<{
    totalContacts: number
    byIndustry: Record<string, number>
    byTrustLevel: Record<string, number>
    byPriority: Record<string, number>
    recentInteractions: number
    followUpRequired: number
  }> {
    const contacts = Array.from(this.contacts.values())
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const byIndustry: Record<string, number> = {}
    const byTrustLevel: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    let recentInteractions = 0
    let followUpRequired = 0

    contacts.forEach(contact => {
      if (contact.industry) {
        byIndustry[contact.industry] = (byIndustry[contact.industry] || 0) + 1
      }
      byTrustLevel[contact.trustLevel] = (byTrustLevel[contact.trustLevel] || 0) + 1
      byPriority[contact.priority] = (byPriority[contact.priority] || 0) + 1
      
      contact.interactions.forEach(interaction => {
        if (interaction.timestamp >= weekAgo) {
          recentInteractions++
        }
        if (interaction.followUpRequired) {
          followUpRequired++
        }
      })
    })

    return {
      totalContacts: contacts.length,
      byIndustry,
      byTrustLevel,
      byPriority,
      recentInteractions,
      followUpRequired
    }
  }

  private async updateAIInsights(contactId: string): Promise<void> {
    const contact = this.contacts.get(contactId)
    if (!contact) return

    if (contact.interactions.length >= 3 && contact.interactions.length % 5 === 0) {
      await this.generateAIInsights(contactId)
    }
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'like', 'fantastic', 'outstanding']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'problem', 'issue', 'disappointed', 'frustrated']
    
    const text = content.toLowerCase()
    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private generateMockData(): void {
    const contacts = [
      {
        id: 'contact-1',
        name: 'Balázs Némethi',
        email: 'balazs@guild.xyz',
        company: 'Guild.xyz',
        role: 'CEO & Co-founder',
        industry: 'Blockchain',
        location: 'Budapest, Hungary',
        trustLevel: 'high' as const,
        priority: 'urgent' as const,
        notes: 'Visionary leader driving Guild.xyz growth. Focus on strategic partnerships and enterprise sales.',
        tags: ['founder', 'blockchain', 'web3', 'strategic'],
        interactions: [
          {
            id: 'int-1-1',
            type: 'meeting' as const,
            subject: 'Q4 Strategic Planning',
            content: 'Discussed expansion into enterprise market, new partnership opportunities with major DeFi protocols, and team growth plans.',
            timestamp: new Date('2024-12-10T14:00:00Z'),
            sentiment: 'positive' as const,
            outcome: 'Approved enterprise focus and budget allocation',
            followUpRequired: true
          },
          {
            id: 'int-1-2',
            type: 'message' as const,
            content: 'Great progress on the enterprise dashboard! The demo went really well with the Compound team.',
            timestamp: new Date('2024-12-12T09:30:00Z'),
            sentiment: 'positive' as const,
            followUpRequired: false
          }
        ],
        aiInsights: {
          communicationStyle: 'Direct and strategic, focuses on high-level vision and business impact',
          engagementLevel: 'high' as const,
          responsePattern: 'Responds quickly during business hours, prefers concise updates with clear action items',
          influenceScore: 95,
          riskAssessment: 'low' as const,
          nextBestAction: 'Schedule quarterly business review and discuss 2025 roadmap priorities',
          engagementPrediction: 90
        },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-12-12T09:30:00Z'),
        lastContact: new Date('2024-12-12T09:30:00Z')
      },
      {
        id: 'contact-2',
        name: 'Robert Leshner',
        email: 'robert@compound.finance',
        company: 'Compound Labs',
        role: 'Founder & CEO',
        industry: 'DeFi',
        location: 'San Francisco, CA',
        trustLevel: 'high' as const,
        priority: 'high' as const,
        notes: 'Potential strategic partner for Guild.xyz. Interested in governance solutions and community management.',
        tags: ['defi', 'partnership', 'governance', 'ceo'],
        interactions: [
          {
            id: 'int-2-1',
            type: 'call' as const,
            subject: 'Partnership Discussion',
            content: 'Discussed potential integration between Compound governance and Guild.xyz. Very interested in our role-based access control.',
            timestamp: new Date('2024-12-08T16:00:00Z'),
            sentiment: 'positive' as const,
            outcome: 'Agreed to pilot program with Compound community',
            followUpRequired: true
          },
          {
            id: 'int-2-2',
            type: 'email' as const,
            subject: 'Technical Requirements',
            content: 'Sent over technical requirements for the Compound integration. Looking forward to the pilot launch.',
            timestamp: new Date('2024-12-11T11:45:00Z'),
            sentiment: 'positive' as const,
            followUpRequired: true
          }
        ],
        aiInsights: {
          communicationStyle: 'Technical and detail-oriented, values innovation and practical solutions',
          engagementLevel: 'high' as const,
          responsePattern: 'Usually responds within 24 hours, prefers technical depth in proposals',
          influenceScore: 85,
          riskAssessment: 'low' as const,
          nextBestAction: 'Send pilot program proposal with timeline and technical specifications',
          engagementPrediction: 85
        },
        createdAt: new Date('2024-11-20T14:30:00Z'),
        updatedAt: new Date('2024-12-11T11:45:00Z'),
        lastContact: new Date('2024-12-11T11:45:00Z')
      },
      {
        id: 'contact-3',
        name: 'Stani Kulechov',
        email: 'stani@aave.com',
        company: 'Aave',
        role: 'Founder & CEO',
        industry: 'DeFi',
        location: 'London, UK',
        trustLevel: 'medium' as const,
        priority: 'high' as const,
        notes: 'Leading figure in DeFi space. Potential for governance and community tooling partnership.',
        tags: ['defi', 'governance', 'community', 'thought-leader'],
        interactions: [
          {
            id: 'int-3-1',
            type: 'meeting' as const,
            subject: 'Guild.xyz Overview',
            content: 'Presented Guild.xyz capabilities for Aave community management. Showed interest in role-based governance features.',
            timestamp: new Date('2024-12-05T10:00:00Z'),
            sentiment: 'neutral' as const,
            outcome: 'Requested follow-up with technical team',
            followUpRequired: true
          }
        ],
        aiInsights: {
          communicationStyle: 'Thoughtful and strategic, focuses on community impact and long-term vision',
          engagementLevel: 'medium' as const,
          responsePattern: 'Takes time to evaluate proposals, values community feedback in decisions',
          influenceScore: 80,
          riskAssessment: 'medium' as const,
          nextBestAction: 'Connect with Aave technical team and provide detailed governance use cases',
          engagementPrediction: 70
        },
        createdAt: new Date('2024-11-25T09:15:00Z'),
        updatedAt: new Date('2024-12-05T10:00:00Z'),
        lastContact: new Date('2024-12-05T10:00:00Z')
      },
      {
        id: 'contact-4',
        name: 'Hayden Adams',
        email: 'hayden@uniswap.org',
        company: 'Uniswap Labs',
        role: 'Founder',
        industry: 'DeFi',
        location: 'New York, NY',
        trustLevel: 'medium' as const,
        priority: 'medium' as const,
        notes: 'Creator of Uniswap protocol. Potential integration opportunities for DAO tooling.',
        tags: ['defi', 'uniswap', 'dao', 'protocol'],
        interactions: [
          {
            id: 'int-4-1',
            type: 'message' as const,
            content: 'Saw the Guild.xyz demo at DevCon. Interesting approach to community access control. Would like to learn more.',
            timestamp: new Date('2024-11-15T20:30:00Z'),
            sentiment: 'positive' as const,
            followUpRequired: true
          }
        ],
        createdAt: new Date('2024-11-15T20:30:00Z'),
        updatedAt: new Date('2024-11-15T20:30:00Z'),
        lastContact: new Date('2024-11-15T20:30:00Z')
      },
      {
        id: 'contact-5',
        name: 'Linda Xie',
        email: 'linda@scalar.capital',
        company: 'Scalar Capital',
        role: 'Co-founder & Managing Director',
        industry: 'Venture Capital',
        location: 'San Francisco, CA',
        trustLevel: 'high' as const,
        priority: 'high' as const,
        notes: 'Prominent crypto investor and thought leader. Potential advisor or investor.',
        tags: ['investor', 'advisor', 'web3', 'thought-leader'],
        interactions: [
          {
            id: 'int-5-1',
            type: 'call' as const,
            subject: 'Investment Discussion',
            content: 'Discussed Guild.xyz growth trajectory and potential Series A. Very impressed with traction and enterprise focus.',
            timestamp: new Date('2024-12-01T15:00:00Z'),
            sentiment: 'positive' as const,
            outcome: 'Interested in leading Series A round',
            followUpRequired: true
          },
          {
            id: 'int-5-2',
            type: 'email' as const,
            subject: 'Due Diligence Materials',
            content: 'Sending over due diligence materials for review. Timeline looks good for Q1 2025 fundraising.',
            timestamp: new Date('2024-12-14T14:20:00Z'),
            sentiment: 'positive' as const,
            followUpRequired: true
          }
        ],
        aiInsights: {
          communicationStyle: 'Professional and analytical, focuses on metrics and growth potential',
          engagementLevel: 'high' as const,
          responsePattern: 'Quick to respond during Pacific time, prefers data-driven presentations',
          influenceScore: 90,
          riskAssessment: 'low' as const,
          nextBestAction: 'Prepare Series A pitch deck with updated metrics and growth projections',
          engagementPrediction: 95
        },
        createdAt: new Date('2024-10-20T12:00:00Z'),
        updatedAt: new Date('2024-12-14T14:20:00Z'),
        lastContact: new Date('2024-12-14T14:20:00Z')
      }
    ]

    contacts.forEach(contact => {
      this.contacts.set(contact.id, contact)
    })

    const relationships = [
      {
        fromContactId: 'contact-1',
        toContactId: 'contact-2',
        relationshipType: 'partner' as const,
        strength: 'strong' as const,
        notes: 'Strategic partnership for governance solutions'
      },
      {
        fromContactId: 'contact-1',
        toContactId: 'contact-5',
        relationshipType: 'client' as const,
        strength: 'strong' as const,
        notes: 'Potential lead investor for Series A'
      },
      {
        fromContactId: 'contact-2',
        toContactId: 'contact-3',
        relationshipType: 'colleague' as const,
        strength: 'medium' as const,
        notes: 'Both DeFi protocol founders'
      }
    ]

    relationships.forEach(rel => {
      const existing = this.relationships.get(rel.fromContactId) || []
      existing.push(rel)
      this.relationships.set(rel.fromContactId, existing)
    })

    this.logger.info('Generated mock contact data', {
      contactCount: contacts.length,
      relationshipCount: relationships.length
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
} 