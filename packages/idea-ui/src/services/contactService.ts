import type {
  Contact,
  ContactFilter,
  ContactAnalytics,
  ContactSearchResult,
  CreateContactInput,
  UpdateContactInput,
  ContactInteraction,
  ContactAIInsights
} from '../types'

export class ContactService {
  private static instance: ContactService
  
  static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService()
    }
    return ContactService.instance
  }

  async searchContacts(query: string, contacts: Contact[]): Promise<ContactSearchResult[]> {
    if (!query.trim()) return []
    
    const searchTerms = query.toLowerCase().split(' ')
    const results: ContactSearchResult[] = []
    
    for (const contact of contacts) {
      let relevanceScore = 0
      const matchedFields: string[] = []
      const snippets: string[] = []
      
      const searchableFields = [
        { field: 'firstName', value: contact.firstName, weight: 30 },
        { field: 'lastName', value: contact.lastName || '', weight: 30 },
        { field: 'username', value: contact.username, weight: 25 },
        { field: 'email', value: contact.email || '', weight: 20 },
        { field: 'company', value: contact.company || '', weight: 15 },
        { field: 'position', value: contact.position || '', weight: 15 },
        { field: 'role', value: contact.role, weight: 10 },
        { field: 'location', value: contact.location || '', weight: 10 },
        { field: 'primaryTopics', value: contact.primaryTopics.join(' '), weight: 15 },
        { field: 'secondaryTopics', value: contact.secondaryTopics.join(' '), weight: 10 },
        { field: 'tags', value: contact.tags.join(' '), weight: 10 },
        { field: 'notes', value: contact.notes.join(' '), weight: 5 },
        { field: 'industry', value: contact.businessContext.industry, weight: 10 }
      ]
      
      for (const { field, value, weight } of searchableFields) {
        if (value) {
          const lowerValue = value.toLowerCase()
          const matchCount = searchTerms.filter(term => lowerValue.includes(term)).length
          
          if (matchCount > 0) {
            const fieldScore = (matchCount / searchTerms.length) * weight
            relevanceScore += fieldScore
            matchedFields.push(field)
            
            if (fieldScore > 5) {
              snippets.push(`${field}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`)
            }
          }
        }
      }
      
      const exactNameMatch = searchTerms.some(term => 
        contact.firstName.toLowerCase().includes(term) || 
        (contact.lastName && contact.lastName.toLowerCase().includes(term))
      )
      if (exactNameMatch) relevanceScore += 50
      
      const exactUsernameMatch = searchTerms.some(term => 
        contact.username.toLowerCase().includes(term)
      )
      if (exactUsernameMatch) relevanceScore += 40
      
      if (relevanceScore > 0) {
        results.push({
          contact,
          relevanceScore: Math.min(100, relevanceScore),
          matchedFields,
          snippet: snippets.slice(0, 2).join(' | ') || `${contact.firstName} ${contact.lastName || ''}`
        })
      }
    }
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)
  }

  filterContacts(contacts: Contact[], filter: ContactFilter): Contact[] {
    return contacts.filter(contact => {
      if (filter.roles && filter.roles.length > 0 && !filter.roles.includes(contact.role)) {
        return false
      }
      
      if (filter.trustLevels && filter.trustLevels.length > 0 && !filter.trustLevels.includes(contact.trustLevel)) {
        return false
      }
      
      if (filter.priorities && filter.priorities.length > 0 && !filter.priorities.includes(contact.priority)) {
        return false
      }
      
      if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(contact.status)) {
        return false
      }
      
      if (filter.sources && filter.sources.length > 0 && !filter.sources.includes(contact.source)) {
        return false
      }
      
      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some(tag => contact.tags.includes(tag))
        if (!hasTag) return false
      }
      
      if (filter.industries && filter.industries.length > 0 && !filter.industries.includes(contact.businessContext.industry)) {
        return false
      }
      
      if (filter.locations && filter.locations.length > 0) {
        const hasLocation = filter.locations.some(location => 
          contact.location?.toLowerCase().includes(location.toLowerCase())
        )
        if (!hasLocation) return false
      }
      
      if (filter.interactionScoreMin !== undefined && contact.interactionScore < filter.interactionScoreMin) {
        return false
      }
      
      if (filter.interactionScoreMax !== undefined && contact.interactionScore > filter.interactionScoreMax) {
        return false
      }
      
      if (filter.influenceWeightMin !== undefined && contact.influenceWeight < filter.influenceWeightMin) {
        return false
      }
      
      if (filter.influenceWeightMax !== undefined && contact.influenceWeight > filter.influenceWeightMax) {
        return false
      }
      
      if (filter.lastSeenDays !== undefined) {
        const daysSinceLastSeen = Math.floor((Date.now() - contact.lastSeen.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastSeen > filter.lastSeenDays) return false
      }
      
      if (filter.hasReminders !== undefined) {
        const hasActiveReminders = contact.reminders.some(r => !r.completed)
        if (filter.hasReminders !== hasActiveReminders) return false
      }
      
      if (filter.recentInteraction !== undefined) {
        const hasRecentInteraction = contact.interactions.some(interaction => {
          const daysSince = Math.floor((Date.now() - interaction.date.getTime()) / (1000 * 60 * 60 * 24))
          return daysSince <= 7
        })
        if (filter.recentInteraction !== hasRecentInteraction) return false
      }
      
      if (filter.dateRange) {
        if (contact.createdAt < filter.dateRange.start || contact.createdAt > filter.dateRange.end) {
          return false
        }
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const searchableText = [
          contact.firstName,
          contact.lastName,
          contact.username,
          contact.email,
          contact.company,
          contact.position,
          contact.location,
          ...contact.primaryTopics,
          ...contact.tags,
          ...contact.notes
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) return false
      }
      
      return true
    })
  }

  calculateAnalytics(contacts: Contact[]): ContactAnalytics {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const activeContacts = contacts.filter(c => c.status === 'active')
    const newContactsThisMonth = contacts.filter(c => c.createdAt >= monthAgo)
    
    const totalInteractions = contacts.reduce((sum, c) => sum + c.totalInteractions, 0)
    const avgInteractionScore = contacts.length > 0 
      ? contacts.reduce((sum, c) => sum + c.interactionScore, 0) / contacts.length
      : 0
    const avgInfluenceWeight = contacts.length > 0
      ? contacts.reduce((sum, c) => sum + c.influenceWeight, 0) / contacts.length
      : 0
    
    const contactsByRole = contacts.reduce((acc, contact) => {
      acc[contact.role] = (acc[contact.role] || 0) + 1
      return acc
    }, {} as Record<Contact['role'], number>)
    
    const contactsByTrustLevel = contacts.reduce((acc, contact) => {
      acc[contact.trustLevel] = (acc[contact.trustLevel] || 0) + 1
      return acc
    }, {} as Record<Contact['trustLevel'], number>)
    
    const contactsBySource = contacts.reduce((acc, contact) => {
      acc[contact.source] = (acc[contact.source] || 0) + 1
      return acc
    }, {} as Record<Contact['source'], number>)
    
    const contactsByIndustry = contacts.reduce((acc, contact) => {
      const industry = contact.businessContext.industry
      if (industry) {
        acc[industry] = (acc[industry] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topInfluencers = [...contacts]
      .sort((a, b) => b.influenceWeight - a.influenceWeight)
      .slice(0, 10)
    
    const recentlyActive = [...contacts]
      .filter(c => {
        const daysSince = Math.floor((now.getTime() - c.lastSeen.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 7
      })
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 10)
    
    const needsFollowUp = contacts.filter(c => {
      return c.reminders.some(r => !r.completed && r.date <= now) ||
             c.interactions.some(i => i.followUpRequired)
    })
    
    const sentimentTrends = this.generateSentimentTrends(contacts)
    const interactionVolume = this.generateInteractionVolume(contacts)
    const networkGrowth = this.generateNetworkGrowth(contacts)
    
    return {
      totalContacts: contacts.length,
      activeContacts: activeContacts.length,
      newContactsThisMonth: newContactsThisMonth.length,
      totalInteractions,
      avgInteractionScore,
      avgInfluenceWeight,
      contactsByRole,
      contactsByTrustLevel,
      contactsBySource,
      contactsByIndustry,
      topInfluencers,
      recentlyActive,
      needsFollowUp,
      sentimentTrends,
      interactionVolume,
      networkGrowth
    }
  }

  generateAIInsights(contact: Contact): ContactAIInsights {
    const recentInteractions = contact.interactions
      .filter(i => {
        const daysSince = Math.floor((Date.now() - i.date.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 30
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
    
    const avgResponseTime = this.calculateAverageResponseTime(contact)
    const topicFrequency = this.analyzeTopicFrequency(contact)
    const sentimentTrend = this.analyzeSentimentTrend(contact)
    
    const communicationPattern = {
      preferredTime: this.identifyPreferredTimes(contact),
      responseTimePattern: avgResponseTime,
      topicPreferences: Object.keys(topicFrequency).slice(0, 5),
      sentimentTrend
    }
    
    const influenceMetrics = {
      networkReach: Math.min(100, contact.influenceWeight + (contact.relationships.length * 5)),
      decisionMakingPower: contact.role === 'advisor' ? 90 : contact.role === 'expert' ? 80 : 60,
      industryExpertise: contact.primaryTopics,
      recommendationLikelihood: this.calculateRecommendationLikelihood(contact)
    }
    
    const engagementPrediction = {
      likelihood: this.calculateEngagementLikelihood(contact),
      bestApproach: this.suggestBestApproach(contact),
      optimalTiming: this.suggestOptimalTiming(contact),
      suggestedTopics: this.suggestTopics(contact)
    }
    
    const riskAssessment = {
      churnProbability: this.calculateChurnProbability(contact),
      competitorRisk: contact.role === 'competitor' ? 90 : 20,
      satisfactionScore: this.calculateSatisfactionScore(contact)
    }
    
    return {
      communicationPattern,
      influenceMetrics,
      engagementPrediction,
      riskAssessment
    }
  }

  private generateSentimentTrends(contacts: Contact[]) {
    const trends = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      let positive = 0, neutral = 0, negative = 0
      
      contacts.forEach(contact => {
        contact.interactions.forEach(interaction => {
          if (interaction.date >= dayStart && interaction.date < dayEnd) {
            if (interaction.sentiment === 'positive') positive++
            else if (interaction.sentiment === 'neutral') neutral++
            else negative++
          }
        })
      })
      
      trends.push({ date: dayStart, positive, neutral, negative })
    }
    
    return trends
  }

  private generateInteractionVolume(contacts: Contact[]) {
    const volume = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      let count = 0
      contacts.forEach(contact => {
        count += contact.interactions.filter(i => 
          i.date >= dayStart && i.date < dayEnd
        ).length
      })
      
      volume.push({ date: dayStart, count })
    }
    
    return volume
  }

  private generateNetworkGrowth(contacts: Contact[]) {
    const growth = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const total = contacts.filter(c => c.createdAt < dayEnd).length
      const newContacts = contacts.filter(c => 
        c.createdAt >= dayStart && c.createdAt < dayEnd
      ).length
      
      growth.push({ date: dayStart, total, new: newContacts })
    }
    
    return growth
  }

  private calculateAverageResponseTime(contact: Contact): string {
    if (contact.interactions.length < 2) return contact.avgResponseTime
    
    const responseTimes = []
    for (let i = 1; i < contact.interactions.length; i++) {
      const diff = contact.interactions[i].date.getTime() - contact.interactions[i-1].date.getTime()
      responseTimes.push(diff / (1000 * 60))
    }
    
    const avgMinutes = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    
    if (avgMinutes < 60) return `${Math.round(avgMinutes)} minutes`
    if (avgMinutes < 1440) return `${Math.round(avgMinutes / 60)} hours`
    return `${Math.round(avgMinutes / 1440)} days`
  }

  private analyzeTopicFrequency(contact: Contact): Record<string, number> {
    const topics: Record<string, number> = {}
    
    contact.interactions.forEach(interaction => {
      const topic = interaction.topic
      topics[topic] = (topics[topic] || 0) + 1
    })
    
    contact.primaryTopics.forEach(topic => {
      topics[topic] = (topics[topic] || 0) + 5
    })
    
    return Object.fromEntries(
      Object.entries(topics).sort(([,a], [,b]) => b - a)
    )
  }

  private analyzeSentimentTrend(contact: Contact): 'improving' | 'stable' | 'declining' {
    const recentInteractions = contact.interactions
      .slice(-10)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    
    if (recentInteractions.length < 3) return 'stable'
    
    const first = recentInteractions.slice(0, Math.floor(recentInteractions.length / 2))
    const second = recentInteractions.slice(Math.floor(recentInteractions.length / 2))
    
    const firstPositive = first.filter(i => i.sentiment === 'positive').length / first.length
    const secondPositive = second.filter(i => i.sentiment === 'positive').length / second.length
    
    if (secondPositive > firstPositive + 0.2) return 'improving'
    if (secondPositive < firstPositive - 0.2) return 'declining'
    return 'stable'
  }

  private identifyPreferredTimes(contact: Contact): string[] {
    const hourCounts: Record<number, number> = {}
    
    contact.interactions.forEach(interaction => {
      const hour = interaction.date.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour)
        if (h < 12) return `${h}:00 AM`
        if (h === 12) return '12:00 PM'
        return `${h - 12}:00 PM`
      })
    
    return sortedHours
  }

  private calculateRecommendationLikelihood(contact: Contact): number {
    let score = 50
    
    if (contact.trustLevel === 'high') score += 30
    if (contact.trustLevel === 'low') score -= 20
    
    if (contact.interactionScore > 80) score += 20
    if (contact.interactionScore < 40) score -= 15
    
    const positiveInteractions = contact.interactions.filter(i => i.sentiment === 'positive').length
    const totalInteractions = contact.interactions.length
    
    if (totalInteractions > 0) {
      const positiveRatio = positiveInteractions / totalInteractions
      score += (positiveRatio - 0.5) * 40
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateEngagementLikelihood(contact: Contact): number {
    let score = 50
    
    const daysSinceLastSeen = Math.floor((Date.now() - contact.lastSeen.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastSeen <= 7) score += 30
    else if (daysSinceLastSeen <= 30) score += 10
    else score -= 20
    
    if (contact.status === 'active') score += 20
    if (contact.status === 'inactive') score -= 15
    
    score += Math.min(20, contact.interactionScore / 5)
    
    return Math.max(0, Math.min(100, score))
  }

  private suggestBestApproach(contact: Contact): string {
    if (contact.preferences.communicationStyle === 'formal') {
      return 'Professional email or scheduled meeting'
    }
    
    if (contact.source === 'telegram') {
      return 'Direct message or informal conversation'
    }
    
    if (contact.role === 'advisor' || contact.role === 'investor') {
      return 'Structured presentation or data-driven discussion'
    }
    
    return 'Casual conversation about shared interests'
  }

  private suggestOptimalTiming(contact: Contact): string {
    if (contact.preferences.preferredTime) {
      return contact.preferences.preferredTime
    }
    
    const recentInteractions = contact.interactions
      .filter(i => {
        const daysSince = Math.floor((Date.now() - i.date.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 14
      })
    
    if (recentInteractions.length === 0) {
      return 'Weekdays 9-11 AM or 2-4 PM'
    }
    
    const hourCounts: Record<number, number> = {}
    recentInteractions.forEach(i => {
      const hour = i.date.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (bestHour) {
      const hour = parseInt(bestHour)
      const time = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`
      return `Around ${time} on weekdays`
    }
    
    return 'Weekdays during business hours'
  }

  private suggestTopics(contact: Contact): string[] {
    const topicFreq = this.analyzeTopicFrequency(contact)
    const suggestions = Object.keys(topicFreq).slice(0, 3)
    
    const interestBasedTopics = contact.preferences.interests.slice(0, 2)
    
    return [...new Set([...suggestions, ...interestBasedTopics])].slice(0, 5)
  }

  private calculateChurnProbability(contact: Contact): number {
    let score = 0
    
    const daysSinceLastSeen = Math.floor((Date.now() - contact.lastSeen.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastSeen > 90) score += 60
    else if (daysSinceLastSeen > 30) score += 30
    else if (daysSinceLastSeen > 7) score += 10
    
    const recentNegative = contact.interactions
      .slice(-5)
      .filter(i => i.sentiment === 'negative').length
    
    score += recentNegative * 15
    
    if (contact.interactionScore < 40) score += 20
    if (contact.trustLevel === 'low') score += 15
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateSatisfactionScore(contact: Contact): number {
    let score = 50
    
    const recentInteractions = contact.interactions.slice(-10)
    if (recentInteractions.length > 0) {
      const positiveRatio = recentInteractions.filter(i => i.sentiment === 'positive').length / recentInteractions.length
      score = positiveRatio * 100
    }
    
    if (contact.trustLevel === 'high') score = Math.min(100, score + 20)
    if (contact.trustLevel === 'low') score = Math.max(0, score - 30)
    
    return Math.round(score)
  }

  async exportContacts(contacts: Contact[], format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(contacts, null, 2)
    }
    
    const headers = [
      'Name', 'Username', 'Email', 'Company', 'Position', 'Role', 'Trust Level',
      'Interaction Score', 'Influence Weight', 'Location', 'Primary Topics',
      'Last Seen', 'Total Messages', 'Status'
    ]
    
    const rows = contacts.map(contact => [
      `${contact.firstName} ${contact.lastName || ''}`.trim(),
      contact.username,
      contact.email || '',
      contact.company || '',
      contact.position || '',
      contact.role,
      contact.trustLevel,
      contact.interactionScore.toString(),
      contact.influenceWeight.toString(),
      contact.location || '',
      contact.primaryTopics.join('; '),
      contact.lastSeen.toISOString(),
      contact.totalMessages.toString(),
      contact.status
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    return csvContent
  }
}

export const contactService = ContactService.getInstance() 