import type { 
  Conversation, 
  ConversationMessage, 
  ConversationAnalytics,
  AIConversationInsights,
  ConversationFilter,
  ConversationSearchResult,
  ConversationParticipant 
} from '../types'

class ConversationService {
  private readonly API_BASE_URL = import.meta.env.PROD ? 'http://localhost:3000/api' : null

  generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  async analyzeConversationWithAI(conversation: Conversation): Promise<any> {
    try {
      if (!this.API_BASE_URL) {
        throw new Error('API disabled in development mode')
      }
      
      const response = await fetch(`${this.API_BASE_URL}/conversations/${conversation.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation)
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze conversation: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return this.generateMockAIInsights(conversation)
    }
  }

  private generateMockAIInsights(conversation: Conversation): AIConversationInsights {
    const messages = conversation.messages
    const userMessages = messages.filter(m => m.role === 'user')
    const botMessages = messages.filter(m => m.role === 'assistant')
    
    const topics = this.extractTopics(messages)
    const sentiment = this.calculateAverageSentiment(messages)
    
    let quality: 'excellent' | 'good' | 'average' | 'poor' = 'average'
    if (sentiment > 0.3 && messages.length > 20) quality = 'excellent'
    else if (sentiment > 0.1 && messages.length > 10) quality = 'good'
    else if (sentiment < -0.2 || messages.length < 5) quality = 'poor'

    return {
      summary: `Conversation with ${conversation.participants.length} participants over ${this.formatDuration(conversation.createdAt, conversation.lastActivity)}. ${messages.length} messages exchanged, covering topics like ${topics.slice(0, 3).join(', ')}.`,
      keyTopics: topics,
      participantPersonalities: this.analyzePersonalities(conversation.participants, messages),
      conversationQuality: quality,
      suggestedActions: this.generateSuggestedActions(conversation, sentiment),
      potentialIssues: this.identifyPotentialIssues(conversation, sentiment),
      learningOpportunities: this.findLearningOpportunities(conversation),
      conversationOutcome: this.determineOutcome(conversation, sentiment),
      nextSteps: this.suggestNextSteps(conversation)
    }
  }

  private extractTopics(messages: ConversationMessage[]): string[] {
    const commonWords = new Map<string, number>()
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'will', 'for', 'of', 'with', 'by'])
    
    messages.forEach(message => {
      const words = message.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
      
      words.forEach(word => {
        commonWords.set(word, (commonWords.get(word) || 0) + 1)
      })
    })

    return Array.from(commonWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private calculateAverageSentiment(messages: ConversationMessage[]): number {
    const sentiments = messages
      .map(m => m.metadata?.sentimentScore || 0)
      .filter(s => s !== 0)
    
    return sentiments.length > 0 
      ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length 
      : 0
  }

  private analyzePersonalities(participants: ConversationParticipant[], messages: ConversationMessage[]): { [userId: string]: string } {
    const personalities: { [userId: string]: string } = {}
    
    participants.forEach(participant => {
      const userMessages = messages.filter(m => m.userId === participant.id)
      const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length || 0
      const commandCount = userMessages.filter(m => m.messageType === 'command').length
      
      let personality = 'Balanced communicator'
      if (avgLength > 200) personality = 'Detailed and thorough'
      else if (avgLength < 50) personality = 'Concise and direct'
      if (commandCount > userMessages.length * 0.3) personality += ', tech-savvy'
      
      personalities[participant.id] = personality
    })
    
    return personalities
  }

  private generateSuggestedActions(conversation: Conversation, sentiment: number): string[] {
    const actions = []
    
    if (sentiment < -0.1) {
      actions.push('Review conversation for potential issues')
      actions.push('Consider follow-up to address concerns')
    }
    
    if (conversation.messages.length > 50) {
      actions.push('Archive older messages for better performance')
    }
    
    if (conversation.analytics.commandUsage.length > 10) {
      actions.push('Create custom shortcuts for frequently used commands')
    }
    
    actions.push('Export insights for strategic review')
    actions.push('Schedule follow-up conversation')
    
    return actions
  }

  private identifyPotentialIssues(conversation: Conversation, sentiment: number): string[] {
    const issues = []
    
    if (sentiment < -0.2) {
      issues.push('Negative sentiment detected in conversation')
    }
    
    if (conversation.analytics.averageResponseTime > 3600) {
      issues.push('Long response times may indicate engagement issues')
    }
    
    if (conversation.messages.filter(m => m.role === 'user').length < 3) {
      issues.push('Low user engagement in conversation')
    }
    
    return issues
  }

  private findLearningOpportunities(conversation: Conversation): string[] {
    const opportunities = []
    
    const commandMessages = conversation.messages.filter(m => m.messageType === 'command')
    if (commandMessages.length > 0) {
      opportunities.push('Analyze command usage patterns for UX improvements')
    }
    
    if (conversation.participants.length > 2) {
      opportunities.push('Study group dynamics for better collaboration features')
    }
    
    opportunities.push('Extract common questions for FAQ development')
    opportunities.push('Identify successful interaction patterns')
    
    return opportunities
  }

  private determineOutcome(conversation: Conversation, sentiment: number): string {
    if (sentiment > 0.2) return 'Positive and productive conversation'
    if (sentiment > -0.1) return 'Neutral conversation with mixed outcomes'
    return 'Conversation may need follow-up attention'
  }

  private suggestNextSteps(conversation: Conversation): string[] {
    const steps = []
    
    const recentActivity = new Date().getTime() - conversation.lastActivity.getTime()
    const daysSinceActivity = recentActivity / (1000 * 60 * 60 * 24)
    
    if (daysSinceActivity > 7) {
      steps.push('Send follow-up message to re-engage')
    }
    
    if (conversation.analytics.commandUsage.length > 0) {
      steps.push('Review command effectiveness')
    }
    
    steps.push('Update conversation tags based on insights')
    steps.push('Share relevant insights with team')
    
    return steps
  }

  calculateAnalytics(conversation: Conversation): ConversationAnalytics {
    const messages = conversation.messages
    const participants = conversation.participants
    
    const messageTypes = messages.reduce((acc, msg) => {
      acc[msg.messageType] = (acc[msg.messageType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const commandUsage = messages
      .filter(m => m.command)
      .reduce((acc, msg) => {
        const cmd = msg.command!.command
        const existing = acc.find(c => c.command === cmd)
        if (existing) {
          existing.count++
        } else {
          acc.push({ command: cmd, count: 1 })
        }
        return acc
      }, [] as { command: string; count: number }[])

    const hourCounts = new Array(24).fill(0)
    messages.forEach(msg => {
      const hour = msg.timestamp.getHours()
      hourCounts[hour]++
    })
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))
    const mostActiveTimeOfDay = `${mostActiveHour}:00`

    const responseTimes = messages
      .filter((msg, index) => index > 0 && msg.role === 'assistant')
      .map((msg, index) => {
        const prevMsg = messages[messages.indexOf(msg) - 1]
        return msg.timestamp.getTime() - prevMsg.timestamp.getTime()
      })
      .filter(time => time > 0 && time < 24 * 60 * 60 * 1000) // Within 24 hours

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000
      : 0

    const topics = this.extractTopics(messages)
    const wordCloudData = topics.map((topic, index) => ({
      text: topic,
      value: topics.length - index
    }))

    const sentimentTrend = this.calculateSentimentTrend(messages)

    return {
      messageCount: messages.length,
      participantCount: participants.length,
      averageResponseTime,
      mostActiveTimeOfDay,
      commonTopics: topics,
      sentimentTrend,
      wordCloudData,
      commandUsage,
      messageTypes: Object.entries(messageTypes).map(([type, count]) => ({ type, count })),
      conversationFlow: {
        userMessages: messages.filter(m => m.role === 'user').length,
        botResponses: messages.filter(m => m.role === 'assistant').length,
        commands: messages.filter(m => m.messageType === 'command').length,
        systemMessages: messages.filter(m => m.role === 'system').length
      }
    }
  }

  private calculateSentimentTrend(messages: ConversationMessage[]): { date: Date; score: number }[] {
    const dailyMessages = new Map<string, ConversationMessage[]>()
    
    messages.forEach(msg => {
      const date = msg.timestamp.toDateString()
      if (!dailyMessages.has(date)) {
        dailyMessages.set(date, [])
      }
      dailyMessages.get(date)!.push(msg)
    })

    return Array.from(dailyMessages.entries()).map(([dateStr, msgs]) => {
      const sentiments = msgs
        .map(m => m.metadata?.sentimentScore || 0)
        .filter(s => s !== 0)
      
      const avgSentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : 0

      return {
        date: new Date(dateStr),
        score: avgSentiment
      }
    }).sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  searchConversations(conversations: Conversation[], query: string, filters?: Partial<ConversationFilter>): ConversationSearchResult[] {
    const results: ConversationSearchResult[] = []
    
    conversations.forEach(conversation => {
      let relevanceScore = 0
      const matchedMessages: ConversationMessage[] = []
      const highlightedContent: string[] = []

      // Search in conversation title and messages
      if (conversation.title.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 10
        highlightedContent.push(`Title: ${conversation.title}`)
      }

      conversation.messages.forEach(message => {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 5
          matchedMessages.push(message)
          
          const snippet = this.createSnippet(message.content, query)
          highlightedContent.push(`${message.role}: ${snippet}`)
        }
      })

      // Apply filters
      if (filters) {
        if (filters.participants && filters.participants.length > 0) {
          const hasParticipant = conversation.participants.some(p => 
            filters.participants!.includes(p.id) || filters.participants!.includes(p.name)
          )
          if (!hasParticipant) relevanceScore = 0
        }

        if (filters.dateRange) {
          if (conversation.lastActivity < filters.dateRange.start || 
              conversation.createdAt > filters.dateRange.end) {
            relevanceScore = 0
          }
        }

        if (filters.priority && filters.priority.length > 0) {
          if (!filters.priority.includes(conversation.priority)) {
            relevanceScore = 0
          }
        }

        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(conversation.status)) {
            relevanceScore = 0
          }
        }

        if (filters.minMessages && conversation.messages.length < filters.minMessages) {
          relevanceScore = 0
        }

        if (filters.maxMessages && conversation.messages.length > filters.maxMessages) {
          relevanceScore = 0
        }
      }

      if (relevanceScore > 0) {
        results.push({
          conversation,
          relevanceScore,
          matchedMessages,
          highlightedContent: highlightedContent.join(' | ')
        })
      }
    })

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private createSnippet(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return content.substring(0, 100) + '...'
    
    const start = Math.max(0, index - 30)
    const end = Math.min(content.length, index + query.length + 30)
    
    return (start > 0 ? '...' : '') + 
           content.substring(start, end) + 
           (end < content.length ? '...' : '')
  }

  private formatDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    return 'less than an hour'
  }

  async exportConversation(conversation: Conversation, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' })
      
      case 'csv':
        const csvData = this.convertToCSV(conversation)
        return new Blob([csvData], { type: 'text/csv' })
      
      case 'pdf':
        // For now, return JSON until PDF library is added
        return new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' })
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private convertToCSV(conversation: Conversation): string {
    const headers = ['Timestamp', 'Role', 'User', 'Content', 'Type', 'Command']
    const rows = conversation.messages.map(msg => [
      msg.timestamp.toISOString(),
      msg.role,
      msg.userName || msg.userId || '',
      `"${msg.content.replace(/"/g, '""')}"`,
      msg.messageType,
      msg.command?.command || ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

export const conversationService = new ConversationService() 