import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown, Trash2, Search, Filter, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import type { MemoryDisplayRow, SortOptions, FilterOptions } from '../types'

interface MemoryTableProps {
  memories: MemoryDisplayRow[]
  loading: boolean
  onDelete: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
}

export const MemoryTable: React.FC<MemoryTableProps> = ({
  memories,
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

  const filteredAndSortedMemories = useMemo(() => {
    let filtered = memories

    if (searchTerm) {
      filtered = filtered.filter(memory =>
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        memory.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterOptions.userId) {
      filtered = filtered.filter(memory => memory.userId === filterOptions.userId)
    }

    if (filterOptions.chatId) {
      filtered = filtered.filter(memory => memory.chatId === filterOptions.chatId)
    }

    if (filterOptions.category) {
      filtered = filtered.filter(memory => memory.category === filterOptions.category)
    }

    if (filterOptions.tags && filterOptions.tags.length > 0) {
      filtered = filtered.filter(memory =>
        filterOptions.tags!.some(tag => memory.tags.includes(tag))
      )
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortOptions.field]
      const bValue = b[sortOptions.field]

      if (aValue === bValue) return 0

      const comparison = (aValue || 0) < (bValue || 0) ? -1 : 1
      return sortOptions.direction === 'asc' ? comparison : -comparison
    })
  }, [memories, searchTerm, filterOptions, sortOptions])

  const handleSort = (field: keyof MemoryDisplayRow) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      await onDelete(id)
    }
  }

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(memories.map(m => m.category).filter(Boolean))).sort()
  , [memories])

  const uniqueUserIds = useMemo(() => 
    Array.from(new Set(memories.map(m => m.userId).filter(Boolean))).sort()
  , [memories])



  const renderSortIcon = (field: keyof MemoryDisplayRow) => {
    if (sortOptions.field !== field) return null
    return sortOptions.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Memory Store Data</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                showFilters 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Filter className="w-4 h-4 mr-1 inline" />
              Filters
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4 mr-1 inline', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredAndSortedMemories.length} of {memories.length} memories
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <select
                value={filterOptions.userId || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, userId: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All users</option>
                {uniqueUserIds.map(userId => (
                  <option key={userId} value={userId}>{userId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterOptions.category || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chat ID</label>
              <input
                type="number"
                placeholder="Filter by chat ID"
                value={filterOptions.chatId || ''}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, chatId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilterOptions({})}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  ID {renderSortIcon('id')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('content')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Content {renderSortIcon('content')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Category {renderSortIcon('category')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('importance')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Importance {renderSortIcon('importance')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('userId')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  User ID {renderSortIcon('userId')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('chatId')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Chat ID {renderSortIcon('chatId')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Created {renderSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Updated {renderSortIcon('updatedAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading memories...
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedMemories.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No memories found
                </td>
              </tr>
            ) : (
              filteredAndSortedMemories.map((memory) => (
                <tr key={memory.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {memory.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                    <div title={memory.content}>
                      {truncateContent(memory.content)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {memory.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {memory.importance}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {memory.userId || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {memory.chatId || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(memory.createdAt, 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(memory.updatedAt, 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 