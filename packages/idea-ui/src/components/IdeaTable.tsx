import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown, Trash2, Search, Filter, RefreshCw, Lightbulb, TrendingUp, AlertCircle, CheckCircle, Clock, Archive } from 'lucide-react'
import { clsx } from 'clsx'
import type { IdeaDisplayRow, SortOptions, FilterOptions } from '../types'

interface IdeaTableProps {
  ideas: IdeaDisplayRow[]
  loading: boolean
  onDelete: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
}

export const IdeaTable: React.FC<IdeaTableProps> = ({
  ideas,
  loading,
  onDelete,
  onRefresh
}) => {
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'createdAt',
    direction: 'desc'
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = ideas

    if (searchTerm) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterOptions.category) {
      filtered = filtered.filter(idea => idea.category === filterOptions.category)
    }

    if (filterOptions.priority) {
      filtered = filtered.filter(idea => idea.priority === filterOptions.priority)
    }

    if (filterOptions.status) {
      filtered = filtered.filter(idea => idea.status === filterOptions.status)
    }

    if (filterOptions.tags && filterOptions.tags.length > 0) {
      filtered = filtered.filter(idea =>
        filterOptions.tags!.some(tag => idea.tags.includes(tag))
      )
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortOptions.field]
      const bValue = b[sortOptions.field]

      if (aValue === bValue) return 0

      const comparison = (aValue || 0) < (bValue || 0) ? -1 : 1
      return sortOptions.direction === 'asc' ? comparison : -comparison
    })
  }, [ideas, searchTerm, filterOptions, sortOptions])

  const handleSort = (field: keyof IdeaDisplayRow) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this strategic idea?')) {
      await onDelete(id)
    }
  }

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(ideas.map(i => i.category))).sort()
  , [ideas])

  const uniquePriorities = useMemo(() => 
    Array.from(new Set(ideas.map(i => i.priority))).sort()
  , [ideas])

  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(ideas.map(i => i.status))).sort()
  , [ideas])

  const renderSortIcon = (field: keyof IdeaDisplayRow) => {
    if (sortOptions.field !== field) return null
    return sortOptions.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strategy': return <TrendingUp className="w-4 h-4" />
      case 'product': return <Lightbulb className="w-4 h-4" />
      case 'sales': return <TrendingUp className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'archived': return <Archive className="w-4 h-4 text-gray-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Strategic Intelligence Repository</h2>
              <p className="text-sm text-gray-600">Manage and track strategic initiatives</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                showFilters 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Filters
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md"
            >
              <RefreshCw className={clsx('w-4 h-4 mr-2 inline', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search strategic ideas, content, categories, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
            {filteredAndSortedIdeas.length} of {ideas.length} ideas
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={filterOptions.category || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, category: e.target.value as any || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={filterOptions.priority || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, priority: e.target.value as any || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All priorities</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filterOptions.status || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilterOptions({})}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Loading strategic intelligence...</span>
          </div>
        ) : filteredAndSortedIdeas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategic Ideas Found</h3>
            <p className="text-gray-600">Start capturing strategic insights to build your intelligence repository</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Strategic Idea
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Category
                    {renderSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-2">
                    Priority
                    {renderSortIcon('priority')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Created
                    {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAndSortedIdeas.map((idea) => (
                <tr key={idea.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(idea.category)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {idea.title}
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {truncateContent(idea.content)}
                        </div>
                        {idea.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {idea.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                                {tag}
                              </span>
                            ))}
                            {idea.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                +{idea.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {idea.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', getPriorityColor(idea.priority))}>
                      {idea.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(idea.status)}
                      <span className="text-sm text-gray-700 capitalize">
                        {idea.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(idea.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete strategic idea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
} 