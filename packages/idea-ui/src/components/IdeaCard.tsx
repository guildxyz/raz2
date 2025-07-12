import { useState } from 'react'
import { Edit2, Trash2, Clock, User, Tag, KanbanSquare, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import type { Idea, IdeaStatus, Subtask, SubtaskStatus } from '../types'
import { KanbanModal } from './KanbanModal'

interface IdeaCardProps {
  idea: Idea
  onEdit: (idea: Idea) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: IdeaStatus) => void
  onUpdateSubtask?: (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onCreateSubtask?: (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDeleteSubtask?: (ideaId: string, subtaskId: string) => void
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

export const IdeaCard = ({ 
  idea, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  onUpdateSubtask,
  onCreateSubtask,
  onDeleteSubtask
}: IdeaCardProps) => {
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false)

  const handleStatusChange = (newStatus: IdeaStatus) => {
    if (newStatus !== idea.status) {
      onUpdateStatus(idea.id, newStatus)
    }
  }

  const handleUpdateSubtask = (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => {
    if (onUpdateSubtask) {
      onUpdateSubtask(ideaId, subtaskId, updates)
    }
  }

  const handleCreateSubtask = (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onCreateSubtask) {
      onCreateSubtask(ideaId, subtask)
    }
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    if (onDeleteSubtask) {
      onDeleteSubtask(idea.id, subtaskId)
    }
  }

  const getTaskStats = () => {
    const total = idea.subtasks.length
    const completed = idea.subtasks.filter(s => s.status === 'done').length
    const inProgress = idea.subtasks.filter(s => s.status === 'in_progress').length
    const totalHours = idea.subtasks.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)
    
    return { total, completed, inProgress, totalHours }
  }

  const taskStats = getTaskStats()

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {idea.title}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsKanbanModalOpen(true)}
              className="p-2 rounded transition-colors text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              title="Open Kanban Board"
            >
              <KanbanSquare size={16} />
            </button>
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

        {/* Task Statistics */}
        {taskStats.total > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Task Progress</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks:</span>
                <span className="font-medium">{taskStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{taskStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress:</span>
                <span className="font-medium text-yellow-600">{taskStats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Hours:</span>
                <span className="font-medium">{taskStats.totalHours}h</span>
              </div>
            </div>
            {taskStats.total > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  {Math.round((taskStats.completed / taskStats.total) * 100)}% Complete
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* AI Breakdown Insight */}
        {idea.aiBreakdown && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">AI Breakdown</span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              {idea.aiBreakdown.reasoning}
            </p>
            <div className="text-xs text-blue-600">
              Estimated: {idea.aiBreakdown.estimatedTotalHours}h total
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

      <KanbanModal
        isOpen={isKanbanModalOpen}
        onClose={() => setIsKanbanModalOpen(false)}
        idea={idea}
        onUpdateSubtask={handleUpdateSubtask}
        onCreateSubtask={handleCreateSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />
    </div>
  )
} 