import { Edit2, Trash2, Clock, User, Tag } from 'lucide-react'
import { format } from 'date-fns'
import type { Idea, IdeaStatus } from '../types'

interface IdeaCardProps {
  idea: Idea
  onEdit: (idea: Idea) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: IdeaStatus) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const IdeaCard = ({ idea, onEdit, onDelete, onUpdateStatus }: IdeaCardProps) => {
  const handleStatusChange = (newStatus: IdeaStatus) => {
    if (newStatus !== idea.status) {
      onUpdateStatus(idea.id, newStatus)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {idea.title}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(idea)}
            className="text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {idea.content}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[idea.priority]}`}>
          {idea.priority}
        </span>
        <select
          value={idea.status}
          onChange={(e) => handleStatusChange(e.target.value as IdeaStatus)}
          className={`px-2 py-1 rounded-full text-xs font-medium border-none ${statusColors[idea.status]}`}
        >
          <option value="active">Active</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
          {idea.category}
        </span>
      </div>

      {idea.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Tag size={14} className="text-gray-500" />
          <div className="flex flex-wrap gap-1">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>{idea.userId === 'raz' ? 'Zawiasa' : `ID: ${idea.userId}`}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{format(new Date(idea.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  )
} 