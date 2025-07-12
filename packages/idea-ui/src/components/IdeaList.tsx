import { useState, useMemo } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import { IdeaCard } from './IdeaCard'
import type { Idea, IdeaCategory, IdeaPriority, IdeaStatus } from '../types'

interface IdeaListProps {
  ideas: Idea[]
  loading: boolean
  onEdit: (idea: Idea) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: IdeaStatus) => void
  onCreate: () => void
}

export const IdeaList = ({ 
  ideas, 
  loading, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onCreate 
}: IdeaListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<IdeaPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = categoryFilter === 'all' || idea.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || idea.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || idea.status === statusFilter

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus
    })
  }, [ideas, searchTerm, categoryFilter, priorityFilter, statusFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setPriorityFilter('all')
    setStatusFilter('all')
  }

  const hasActiveFilters = 
    searchTerm !== '' || 
    categoryFilter !== 'all' || 
    priorityFilter !== 'all' || 
    statusFilter !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-blue-800 font-medium">Zawiasa's Strategic Ideas</h3>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Showing ideas from Telegram user "raz" (Zawiasa)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              hasActiveFilters || showFilters
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Idea
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as IdeaCategory | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="strategy">Strategy</option>
                <option value="product">Product</option>
                <option value="sales">Sales</option>
                <option value="partnerships">Partnerships</option>
                <option value="competitive">Competitive</option>
                <option value="market">Market</option>
                <option value="team">Team</option>
                <option value="operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as IdeaPriority | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">
                {filteredIdeas.length} of {ideas.length} ideas shown
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {filteredIdeas.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {ideas.length === 0 ? (
              <>
                <div className="text-6xl mb-4">💡</div>
                <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
                <p>Create your first idea to get started!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No ideas found</h3>
                <p>Try adjusting your search or filters</p>
              </>
            )}
          </div>
          {ideas.length === 0 && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create your first idea
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
} 