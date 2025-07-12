import { useState, useMemo } from 'react'
import { format, startOfDay, endOfDay, eachDayOfInterval, subDays } from 'date-fns'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Users,
  Clock,
  Brain,
  Command,
  Smile,
  Frown,
  Meh,
  Activity,
  Hash,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download
} from 'lucide-react'

import type { Conversation } from '../types'

interface ConversationAnalyticsProps {
  conversations: Conversation[]
  onBack: () => void
  onViewConversation: (conversation: Conversation) => void
}

export const ConversationAnalytics = ({ 
  conversations, 
  onBack, 
  onViewConversation 
}: ConversationAnalyticsProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'messages' | 'participants' | 'sentiment' | 'commands'>('messages')

  const filteredConversations = useMemo(() => {
    if (selectedTimeRange === 'all') return conversations

    const daysToSubtract = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90
    const cutoffDate = subDays(new Date(), daysToSubtract)
    
    return conversations.filter(conv => conv.lastActivity >= cutoffDate)
  }, [conversations, selectedTimeRange])

  const overallMetrics = useMemo(() => {
    const totalMessages = filteredConversations.reduce((sum, conv) => sum + conv.messages.length, 0)
    const totalParticipants = new Set(
      filteredConversations.flatMap(conv => 
        conv.participants.map(p => p.id)
      )
    ).size

    const avgMessagesPerConversation = filteredConversations.length > 0 
      ? Math.round(totalMessages / filteredConversations.length) 
      : 0

    const avgParticipantsPerConversation = filteredConversations.length > 0 
      ? Math.round(filteredConversations.reduce((sum, conv) => sum + conv.participants.length, 0) / filteredConversations.length)
      : 0

    const sentimentScores = filteredConversations.flatMap(conv => 
      conv.messages.map(m => m.metadata?.sentimentScore).filter(s => s !== undefined)
    ).filter(Boolean) as number[]

    const avgSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
      : 0

    const commandUsage = filteredConversations.flatMap(conv => 
      conv.analytics.commandUsage
    ).reduce((acc, cmd) => {
      const existing = acc.find(c => c.command === cmd.command)
      if (existing) {
        existing.count += cmd.count
      } else {
        acc.push({ ...cmd })
      }
      return acc
    }, [] as { command: string; count: number }[])

    const mostActiveConversations = [...filteredConversations]
      .sort((a, b) => b.messages.length - a.messages.length)
      .slice(0, 5)

    const conversationsByQuality = filteredConversations.filter(c => c.aiInsights)
      .reduce((acc, conv) => {
        const quality = conv.aiInsights!.conversationQuality
        acc[quality] = (acc[quality] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return {
      totalConversations: filteredConversations.length,
      totalMessages,
      totalParticipants,
      avgMessagesPerConversation,
      avgParticipantsPerConversation,
      avgSentiment,
      commandUsage: commandUsage.sort((a, b) => b.count - a.count).slice(0, 10),
      mostActiveConversations,
      conversationsByQuality
    }
  }, [filteredConversations])

  const timeSeriesData = useMemo(() => {
    const days = selectedTimeRange === 'all' ? 30 : 
                 selectedTimeRange === '7d' ? 7 : 
                 selectedTimeRange === '30d' ? 30 : 90

    const startDate = subDays(new Date(), days - 1)
    const endDate = new Date()
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    return dateRange.map(date => {
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      
      const dayConversations = filteredConversations.filter(conv => 
        conv.lastActivity >= dayStart && conv.lastActivity <= dayEnd
      )

      const dayMessages = dayConversations.reduce((sum, conv) => {
        return sum + conv.messages.filter(msg => 
          msg.timestamp >= dayStart && msg.timestamp <= dayEnd
        ).length
      }, 0)

      const dayParticipants = new Set(
        dayConversations.flatMap(conv => conv.participants.map(p => p.id))
      ).size

      const daySentiments = dayConversations.flatMap(conv => 
        conv.messages
          .filter(msg => msg.timestamp >= dayStart && msg.timestamp <= dayEnd)
          .map(m => m.metadata?.sentimentScore)
          .filter(s => s !== undefined)
      ).filter(Boolean) as number[]

      const avgDaySentiment = daySentiments.length > 0 
        ? daySentiments.reduce((sum, score) => sum + score, 0) / daySentiments.length 
        : 0

      const dayCommands = dayConversations.reduce((sum, conv) => {
        return sum + conv.messages.filter(msg => 
          msg.messageType === 'command' && 
          msg.timestamp >= dayStart && 
          msg.timestamp <= dayEnd
        ).length
      }, 0)

      return {
        date: format(date, 'MMM d'),
        fullDate: date,
        messages: dayMessages,
        participants: dayParticipants,
        sentiment: avgDaySentiment,
        commands: dayCommands
      }
    })
  }, [filteredConversations, selectedTimeRange])

  const topTopics = useMemo(() => {
    const topicCounts = new Map<string, number>()
    
    filteredConversations.forEach(conv => {
      if (conv.aiInsights) {
        conv.aiInsights.keyTopics.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
        })
      }
    })

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))
  }, [filteredConversations])

  const aiInsightsSummary = useMemo(() => {
    const conversationsWithInsights = filteredConversations.filter(c => c.aiInsights)
    
    if (conversationsWithInsights.length === 0) {
      return {
        totalAnalyzed: 0,
        avgQualityScore: 0,
        commonSuggestedActions: [],
        commonIssues: [],
        learningOpportunities: []
      }
    }

    const allSuggestedActions = conversationsWithInsights.flatMap(c => c.aiInsights!.suggestedActions)
    const allIssues = conversationsWithInsights.flatMap(c => c.aiInsights!.potentialIssues)
    const allOpportunities = conversationsWithInsights.flatMap(c => c.aiInsights!.learningOpportunities)

    const actionCounts = allSuggestedActions.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const issueCounts = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const opportunityCounts = allOpportunities.reduce((acc, opp) => {
      acc[opp] = (acc[opp] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const qualityScores = conversationsWithInsights.map(c => {
      switch (c.aiInsights!.conversationQuality) {
        case 'excellent': return 4
        case 'good': return 3
        case 'average': return 2
        case 'poor': return 1
        default: return 2
      }
    })

    const avgQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length

    return {
      totalAnalyzed: conversationsWithInsights.length,
      avgQualityScore,
      commonSuggestedActions: Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
      commonIssues: Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count })),
      learningOpportunities: Object.entries(opportunityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([opportunity, count]) => ({ opportunity, count }))
    }
  }, [filteredConversations])

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return <Smile className="h-5 w-5 text-green-500" />
    if (score < -0.2) return <Frown className="h-5 w-5 text-red-500" />
    return <Meh className="h-5 w-5 text-yellow-500" />
  }

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'messages': return timeSeriesData.map(d => ({ ...d, value: d.messages }))
      case 'participants': return timeSeriesData.map(d => ({ ...d, value: d.participants }))
      case 'sentiment': return timeSeriesData.map(d => ({ ...d, value: d.sentiment }))
      case 'commands': return timeSeriesData.map(d => ({ ...d, value: d.commands }))
      default: return timeSeriesData.map(d => ({ ...d, value: d.messages }))
    }
  }

  const maxValue = Math.max(...getMetricData().map(d => d.value))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversation Analytics</h1>
            <p className="text-gray-600 mt-1">
              AI-powered insights and strategic intelligence from your conversations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalConversations}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-green-600">{overallMetrics.totalMessages}</p>
            </div>
            <Hash className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-purple-600">{overallMetrics.totalParticipants}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Messages</p>
              <p className="text-2xl font-bold text-orange-600">{overallMetrics.avgMessagesPerConversation}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
              <p className="text-xl font-bold text-teal-600">{overallMetrics.avgSentiment.toFixed(2)}</p>
            </div>
            {getSentimentIcon(overallMetrics.avgSentiment)}
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Conversation Trends</h2>
          <div className="flex gap-2">
            {(['messages', 'participants', 'sentiment', 'commands'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          {getMetricData().map((dataPoint, index) => (
            <div key={dataPoint.date} className="flex items-center gap-3">
              <div className="w-16 text-sm text-gray-600">{dataPoint.date}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className={`h-6 rounded-full ${
                    selectedMetric === 'messages' ? 'bg-blue-500' :
                    selectedMetric === 'participants' ? 'bg-purple-500' :
                    selectedMetric === 'sentiment' ? 'bg-teal-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${maxValue > 0 ? (dataPoint.value / maxValue) * 100 : 0}%` }}
                />
                <span className="absolute left-2 top-0 h-6 flex items-center text-xs text-white font-medium">
                  {selectedMetric === 'sentiment' ? dataPoint.value.toFixed(2) : dataPoint.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Insights Summary</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Conversations Analyzed</span>
                <span className="text-lg font-bold text-purple-600">{aiInsightsSummary.totalAnalyzed}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Average Quality Score</span>
                <span className="text-lg font-bold text-green-600">{aiInsightsSummary.avgQualityScore.toFixed(1)}/4</span>
              </div>
            </div>

            {aiInsightsSummary.commonSuggestedActions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Common Suggestions
                </h4>
                <div className="space-y-1">
                  {aiInsightsSummary.commonSuggestedActions.slice(0, 3).map(({ action, count }) => (
                    <div key={action} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{action.substring(0, 40)}...</span>
                      <span className="text-green-600 font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiInsightsSummary.commonIssues.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Common Issues
                </h4>
                <div className="space-y-1">
                  {aiInsightsSummary.commonIssues.slice(0, 3).map(({ issue, count }) => (
                    <div key={issue} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{issue.substring(0, 40)}...</span>
                      <span className="text-red-600 font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Topics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Discussion Topics</h2>
          </div>
          
          <div className="space-y-3">
            {topTopics.map(({ topic, count }, index) => (
              <div key={topic} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium truncate">{topic}</span>
                    <span className="text-blue-600 font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / topTopics[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Command Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Command className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Command Usage</h2>
          </div>
          
          <div className="space-y-3">
            {overallMetrics.commandUsage.map(({ command, count }, index) => (
              <div key={command} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-mono">/{command}</span>
                    <span className="text-green-600 font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(count / overallMetrics.commandUsage[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Conversations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Active Conversations</h2>
          </div>
          
          <div className="space-y-3">
            {overallMetrics.mostActiveConversations.map((conversation, index) => (
              <div key={conversation.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium truncate">{conversation.title}</span>
                    <span className="text-orange-600 font-bold">{conversation.messages.length}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{conversation.participants.length} participants</span>
                    <span>•</span>
                    <span>{format(conversation.lastActivity, 'MMM d')}</span>
                  </div>
                </div>
                <button
                  onClick={() => onViewConversation(conversation)}
                  className="p-1 text-gray-400 hover:text-orange-600 rounded"
                >
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 