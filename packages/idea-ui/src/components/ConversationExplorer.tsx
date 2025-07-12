import { useState, useEffect, useMemo } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  Download,
  Trash2,
  Plus,
  BarChart3,
  Brain,
  Star,
  Archive,
  Tag,
  Zap
} from 'lucide-react'

import {
  conversationsAtom,
  conversationLoadingAtom,
  conversationErrorAtom,
  conversationSearchResultsAtom,
  refreshConversationsAtom,
  searchConversationsAtom,
  analyzeConversationAtom,
  deleteConversationAtom,
  exportConversationAtom,
  selectedConversationAtom
} from '../store'

import { ConversationTimeline } from './ConversationTimeline'
import { ConversationAnalytics } from './ConversationAnalytics'
import type { Conversation, ConversationFilter } from '../types'

interface ConversationExplorerProps {
  onCreateConversation: () => void
}

export const ConversationExplorer = ({ onCreateConversation }: ConversationExplorerProps) => {
  const conversations = useAtomValue(conversationsAtom)
  const loading = useAtomValue(conversationLoadingAtom)
  const error = useAtomValue(conversationErrorAtom)
  const searchResults = useAtomValue(conversationSearchResultsAtom)
  const selectedConversation = useAtomValue(selectedConversationAtom)
  
  const refreshConversations = useSetAtom(refreshConversationsAtom)
  const searchConversations = useSetAtom(searchConversationsAtom)
  const analyzeConversation = useSetAtom(analyzeConversationAtom)
  const deleteConversation = useSetAtom(deleteConversationAtom)
  const exportConversation = useSetAtom(exportConversationAtom)
  const setSelectedConversation = useSetAtom(selectedConversationAtom)

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState<'list' | 'timeline' | 'analytics'>('list')
  const [filters, setFilters] = useState<Partial<ConversationFilter>>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    participants: [],
    messageTypes: [],
    commands: [],
    sentimentRange: { min: -1, max: 1 },
    tags: [],
    priority: [],
    status: ['active'],
    searchQuery: '',
    minMessages: 0,
    maxMessages: 1000
  })

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchConversations({ query: searchQuery, filters })
    }
  }, [searchQuery, filters, searchConversations])

  const displayedConversations = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults.map(result => result.conversation)
    }
    return conversations.filter(conv => {
      if (filters.status && filters.status.length > 0 && !filters.status.includes(conv.status)) {
        return false
      }
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(conv.priority)) {
        return false
      }
      if (filters.minMessages && conv.messages.length < filters.minMessages) {
        return false
      }
      if (filters.maxMessages && conv.messages.length > filters.maxMessages) {
        return false
      }
      if (filters.dateRange) {
        if (conv.lastActivity < filters.dateRange.start || conv.createdAt > filters.dateRange.end) {
          return false
        }
      }
      return true
    })
  }, [conversations, searchResults, searchQuery, filters])

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setActiveView('timeline')
  }

  const handleAnalyzeConversation = async (conversationId: string) => {
    await analyzeConversation(conversationId)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      await deleteConversation(conversationId)
    }
  }

  const handleExportConversation = async (conversationId: string, format: 'json' | 'csv' | 'pdf') => {
    await exportConversation({ conversationId, format })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'archived': return 'text-gray-600 bg-gray-50'
      case 'muted': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const conversationStats = useMemo(() => {
    return {
      total: conversations.length,
      active: conversations.filter(c => c.status === 'active').length,
      archived: conversations.filter(c => c.status === 'archived').length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
      avgMessagesPerConversation: conversations.length > 0 
        ? Math.round(conversations.reduce((sum, c) => sum + c.messages.length, 0) / conversations.length)
        : 0
    }
  }, [conversations])

  if (activeView === 'timeline' && selectedConversation) {
    return (
      <ConversationTimeline
        conversation={selectedConversation}
        onBack={() => setActiveView('list')}
        onAnalyze={() => handleAnalyzeConversation(selectedConversation.id)}
        onExport={(format) => handleExportConversation(selectedConversation.id, format)}
      />
    )
  }

  if (activeView === 'analytics') {
    return (
      <ConversationAnalytics
        conversations={conversations}
        onBack={() => setActiveView('list')}
        onViewConversation={handleViewConversation}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversation Explorer</h1>
          <p className="text-gray-600 mt-1">
            Analyze and explore strategic conversations with AI intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 size={20} />
            Analytics
          </button>
          <button
            onClick={onCreateConversation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            New Conversation
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{conversationStats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{conversationStats.active}</p>
            </div>
            <Zap className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-600">{conversationStats.archived}</p>
            </div>
            <Archive className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-blue-600">{conversationStats.totalMessages}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Messages</p>
              <p className="text-2xl font-bold text-purple-600">{conversationStats.avgMessagesPerConversation}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations, messages, participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={filters.status || []}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: Array.from(e.target.selectedOptions, option => option.value) as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="muted">Muted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                multiple
                value={filters.priority || []}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priority: Array.from(e.target.selectedOptions, option => option.value) as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Messages</label>
              <input
                type="number"
                value={filters.minMessages || 0}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minMessages: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading conversations...</span>
        </div>
      )}

      {/* Conversations List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Conversations ({displayedConversations.length})
            </h2>
          </div>
          
          {displayedConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating a new conversation.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayedConversations.map((conversation) => (
                <div key={conversation.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {conversation.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          {conversation.participants.length} participants
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} />
                          {conversation.messages.length} messages
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          {format(conversation.lastActivity, 'MMM d, yyyy')}
                        </div>
                      </div>

                      {conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {conversation.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              <Tag size={12} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {conversation.aiInsights && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <Brain size={16} className="text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-purple-800">AI Insights</p>
                              <p className="text-sm text-purple-700 mt-1">
                                {conversation.aiInsights.summary.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  conversation.aiInsights.conversationQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                                  conversation.aiInsights.conversationQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                                  conversation.aiInsights.conversationQuality === 'average' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {conversation.aiInsights.conversationQuality}
                                </span>
                                <span className="text-xs text-purple-600">
                                  {conversation.aiInsights.keyTopics.slice(0, 3).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewConversation(conversation)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View conversation"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleAnalyzeConversation(conversation.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Analyze with AI"
                      >
                        <Brain size={18} />
                      </button>
                      <div className="relative group">
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Download size={18} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => handleExportConversation(conversation.id, 'json')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export JSON
                          </button>
                          <button
                            onClick={() => handleExportConversation(conversation.id, 'csv')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export CSV
                          </button>
                          <button
                            onClick={() => handleExportConversation(conversation.id, 'pdf')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Export PDF
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 