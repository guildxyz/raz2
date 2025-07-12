import { useState, useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  Command,
  Download,
  Brain,
  Clock,
  Hash,
  Smile,
  Frown,
  Meh,
  Camera,
  FileText,
  Phone,
  Video,
  Music,
  MapPin,
  Users,
  Search,
  Filter,
  Zap,
  Activity
} from 'lucide-react'

import type { Conversation, ConversationMessage } from '../types'

interface ConversationTimelineProps {
  conversation: Conversation
  onBack: () => void
  onAnalyze: () => void
  onExport: (format: 'json' | 'csv' | 'pdf') => void
}

export const ConversationTimeline = ({ 
  conversation, 
  onBack, 
  onAnalyze, 
  onExport 
}: ConversationTimelineProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessageTypes, setSelectedMessageTypes] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [timelineView, setTimelineView] = useState<'chronological' | 'grouped'>('chronological')

  const filteredMessages = useMemo(() => {
    return conversation.messages.filter(message => {
      // Search filter
      if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Message type filter
      if (selectedMessageTypes.length > 0 && !selectedMessageTypes.includes(message.messageType)) {
        return false
      }
      
      // Role filter
      if (selectedRoles.length > 0 && !selectedRoles.includes(message.role)) {
        return false
      }
      
      return true
    })
  }, [conversation.messages, searchQuery, selectedMessageTypes, selectedRoles])

  const groupedMessages = useMemo(() => {
    if (timelineView === 'chronological') return filteredMessages

    const groups: { [date: string]: ConversationMessage[] } = {}
    filteredMessages.forEach(message => {
      const date = message.timestamp.toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(message)
    })
    
    return Object.entries(groups).map(([date, messages]) => ({
      date: new Date(date),
      messages
    }))
  }, [filteredMessages, timelineView])

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'command': return <Command size={16} className="text-purple-600" />
      case 'photo': return <Camera size={16} className="text-blue-600" />
      case 'document': return <FileText size={16} className="text-green-600" />
      case 'voice': return <Phone size={16} className="text-orange-600" />
      case 'video': return <Video size={16} className="text-red-600" />
      case 'audio': return <Music size={16} className="text-pink-600" />
      case 'location': return <MapPin size={16} className="text-teal-600" />
      case 'contact': return <Users size={16} className="text-indigo-600" />
      default: return <MessageSquare size={16} className="text-gray-600" />
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return <User size={20} className="text-blue-600" />
      case 'assistant': return <Bot size={20} className="text-green-600" />
      case 'system': return <Zap size={20} className="text-purple-600" />
      default: return <MessageSquare size={20} className="text-gray-600" />
    }
  }

  const getSentimentIcon = (score?: number) => {
    if (!score) return <Meh size={16} className="text-gray-400" />
    if (score > 0.2) return <Smile size={16} className="text-green-500" />
    if (score < -0.2) return <Frown size={16} className="text-red-500" />
    return <Meh size={16} className="text-yellow-500" />
  }

  const getSentimentColor = (score?: number) => {
    if (!score) return 'border-gray-200'
    if (score > 0.2) return 'border-green-200 bg-green-50'
    if (score < -0.2) return 'border-red-200 bg-red-50'
    return 'border-yellow-200 bg-yellow-50'
  }

  const messageTypeOptions = [
    'text', 'command', 'photo', 'document', 'voice', 'video', 'audio', 'location', 'contact'
  ]

  const roleOptions = ['user', 'assistant', 'system']

  const conversationMetrics = useMemo(() => {
    const userMessages = conversation.messages.filter(m => m.role === 'user')
    const botMessages = conversation.messages.filter(m => m.role === 'assistant')
    const avgUserMessageLength = userMessages.length > 0 
      ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length 
      : 0
    const avgBotMessageLength = botMessages.length > 0 
      ? botMessages.reduce((sum, m) => sum + m.content.length, 0) / botMessages.length 
      : 0

    return {
      totalMessages: conversation.messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      avgUserMessageLength: Math.round(avgUserMessageLength),
      avgBotMessageLength: Math.round(avgBotMessageLength),
      conversationDuration: formatDistanceToNow(conversation.createdAt, { addSuffix: false })
    }
  }, [conversation])

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
            <h1 className="text-2xl font-bold text-gray-900">{conversation.title}</h1>
            <p className="text-gray-600 mt-1">
              {conversation.participants.length} participants • {conversation.messages.length} messages
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Brain size={20} />
            Analyze
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download size={20} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => onExport('json')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export JSON
              </button>
              <button
                onClick={() => onExport('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-xl font-bold text-gray-900">{conversationMetrics.totalMessages}</p>
            </div>
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Messages</p>
              <p className="text-xl font-bold text-blue-600">{conversationMetrics.userMessages}</p>
            </div>
            <User className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bot Messages</p>
              <p className="text-xl font-bold text-green-600">{conversationMetrics.botMessages}</p>
            </div>
            <Bot className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <p className="text-lg font-bold text-purple-600">{conversationMetrics.conversationDuration}</p>
            </div>
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg User Length</p>
              <p className="text-xl font-bold text-orange-600">{conversationMetrics.avgUserMessageLength}</p>
            </div>
            <Hash className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Bot Length</p>
              <p className="text-xl font-bold text-teal-600">{conversationMetrics.avgBotMessageLength}</p>
            </div>
            <Activity className="h-6 w-6 text-teal-600" />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {conversation.aiInsights && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Brain size={24} className="text-purple-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">AI Conversation Analysis</h3>
              <p className="text-purple-800 mb-4">{conversation.aiInsights.summary}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-1">
                    {conversation.aiInsights.keyTopics.map((topic) => (
                      <span key={topic} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">Quality Score</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    conversation.aiInsights.conversationQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                    conversation.aiInsights.conversationQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                    conversation.aiInsights.conversationQuality === 'average' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {conversation.aiInsights.conversationQuality}
                  </span>
                </div>
              </div>

              {conversation.aiInsights.suggestedActions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-purple-900 mb-2">Suggested Actions</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    {conversation.aiInsights.suggestedActions.slice(0, 3).map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              multiple
              value={selectedMessageTypes}
              onChange={(e) => setSelectedMessageTypes(Array.from(e.target.selectedOptions, o => o.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {messageTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              multiple
              value={selectedRoles}
              onChange={(e) => setSelectedRoles(Array.from(e.target.selectedOptions, o => o.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {roleOptions.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={timelineView}
              onChange={(e) => setTimelineView(e.target.value as 'chronological' | 'grouped')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="chronological">Chronological</option>
              <option value="grouped">Grouped by Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Message Timeline ({filteredMessages.length} messages)
          </h2>
        </div>

        <div className="p-4">
          {timelineView === 'chronological' ? (
            <div className="space-y-4">
              {filteredMessages.map((message, index) => (
                <div key={message.id} className={`border rounded-lg p-4 ${getSentimentColor(message.metadata?.sentimentScore)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getRoleIcon(message.role)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {message.userName || message.userId || message.role}
                        </span>
                        {getMessageIcon(message.messageType)}
                        <span className="text-sm text-gray-500">
                          {format(message.timestamp, 'MMM d, yyyy h:mm a')}
                        </span>
                        {message.metadata?.sentimentScore && getSentimentIcon(message.metadata.sentimentScore)}
                        {message.metadata?.responseTime && (
                          <span className="text-xs text-gray-400">
                            ({Math.round(message.metadata.responseTime / 1000)}s response)
                          </span>
                        )}
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.command && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                          <div className="flex items-center gap-2">
                            <Command size={14} className="text-purple-600" />
                            <span className="text-sm font-mono text-purple-800">
                              /{message.command.command} {message.command.args.join(' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {message.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          {message.metadata.wordCount && (
                            <span>{message.metadata.wordCount} words</span>
                          )}
                          {message.metadata.topics && message.metadata.topics.length > 0 && (
                            <span>Topics: {message.metadata.topics.join(', ')}</span>
                          )}
                          {message.metadata.entities && message.metadata.entities.length > 0 && (
                            <span>Entities: {message.metadata.entities.join(', ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.isArray(groupedMessages) && groupedMessages.map((group: any, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(group.date, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {group.messages.length} messages
                    </span>
                  </div>
                  
                  <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                    {group.messages.map((message: ConversationMessage) => (
                      <div key={message.id} className={`border rounded-lg p-3 ${getSentimentColor(message.metadata?.sentimentScore)}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getRoleIcon(message.role)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {message.userName || message.userId || message.role}
                              </span>
                              {getMessageIcon(message.messageType)}
                              <span className="text-sm text-gray-500">
                                {format(message.timestamp, 'h:mm a')}
                              </span>
                              {message.metadata?.sentimentScore && getSentimentIcon(message.metadata.sentimentScore)}
                            </div>
                            
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {message.command && (
                              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                                <div className="flex items-center gap-2">
                                  <Command size={14} className="text-purple-600" />
                                  <span className="text-sm font-mono text-purple-800">
                                    /{message.command.command} {message.command.args.join(' ')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 