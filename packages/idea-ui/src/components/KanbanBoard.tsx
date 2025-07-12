import { useState } from 'react'
import { Clock, User, ChevronDown, ChevronUp, Plus, MoreVertical, Calendar } from 'lucide-react'
import type { Idea, Subtask, SubtaskStatus, IdeaPriority } from '../types'

interface KanbanBoardProps {
  idea: Idea
  onUpdateSubtask: (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => void
  onCreateSubtask: (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDeleteSubtask: (ideaId: string, subtaskId: string) => void
  loading?: boolean
}

const statusLabels: Record<SubtaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done'
}

const priorityColors: Record<IdeaPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export const KanbanBoard = ({ 
  idea, 
  onUpdateSubtask, 
  onCreateSubtask, 
  onDeleteSubtask,
  loading 
}: KanbanBoardProps) => {
  const [expandedSubtask, setExpandedSubtask] = useState<string | null>(null)
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null)

  const columns: SubtaskStatus[] = ['todo', 'in_progress', 'review', 'done']

  const getSubtasksByStatus = (status: SubtaskStatus) => {
    return idea.subtasks.filter(subtask => subtask.status === status)
  }

  const handleDragStart = (e: React.DragEvent, subtaskId: string) => {
    setDraggedSubtask(subtaskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetStatus: SubtaskStatus) => {
    e.preventDefault()
    
    if (!draggedSubtask) return
    
    const subtask = idea.subtasks.find(s => s.id === draggedSubtask)
    if (!subtask || subtask.status === targetStatus) return

    onUpdateSubtask(idea.id, subtask.id, {
      status: targetStatus,
      updatedAt: new Date(),
      completedAt: targetStatus === 'done' ? new Date() : undefined
    })
    setDraggedSubtask(null)
  }

  const handleStatusChange = (subtask: Subtask, newStatus: SubtaskStatus) => {
    onUpdateSubtask(idea.id, subtask.id, {
      status: newStatus,
      updatedAt: new Date(),
      completedAt: newStatus === 'done' ? new Date() : undefined
    })
  }

  const toggleExpanded = (subtaskId: string) => {
    setExpandedSubtask(expandedSubtask === subtaskId ? null : subtaskId)
  }

  const formatTimeEstimate = (hours?: number) => {
    if (!hours) return null
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours === 1) return '1h'
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {idea.title} - Kanban Board
        </h3>
        <div className="flex items-center gap-4 text-sm text-blue-700">
          <span>{idea.subtasks.length} total tasks</span>
          <span>{getSubtasksByStatus('done').length} completed</span>
          <span>{getSubtasksByStatus('in_progress').length} in progress</span>
          <span>
            {idea.subtasks.reduce((total: number, task: Subtask) => total + (task.estimatedHours || 0), 0)}h estimated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(status => {
          const columnSubtasks = getSubtasksByStatus(status)
          
          return (
            <div
              key={status}
              className="bg-gray-50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">
                    {statusLabels[status]}
                  </h4>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {columnSubtasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onCreateSubtask(idea.id, {
                    title: 'New task',
                    status,
                    priority: 'medium',
                    tags: [],
                    dependencies: []
                  })}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Add subtask"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {columnSubtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, subtask.id)}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {subtask.title}
                      </h5>
                      <button
                        onClick={() => toggleExpanded(subtask.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {expandedSubtask === subtask.id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[subtask.priority]}`}>
                        {subtask.priority}
                      </span>
                      {subtask.estimatedHours && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatTimeEstimate(subtask.estimatedHours)}
                        </div>
                      )}
                    </div>

                    {subtask.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {subtask.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {subtask.tags.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{subtask.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <select
                        value={subtask.status}
                        onChange={(e) => handleStatusChange(subtask, e.target.value as SubtaskStatus)}
                        className="text-xs border-none bg-transparent text-gray-600 cursor-pointer"
                      >
                        {columns.map(statusOption => (
                          <option key={statusOption} value={statusOption}>
                            {statusLabels[statusOption]}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => onDeleteSubtask(idea.id, subtask.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete subtask"
                      >
                        <MoreVertical size={12} />
                      </button>
                    </div>

                    {expandedSubtask === subtask.id && subtask.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mb-2">
                          {subtask.description}
                        </p>
                        
                        {subtask.assignee && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <User size={12} />
                            {subtask.assignee}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          Created {new Date(subtask.createdAt).toLocaleDateString()}
                        </div>
                        
                        {subtask.completedAt && (
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Calendar size={12} />
                            Completed {new Date(subtask.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {columnSubtasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-sm">No tasks yet</div>
                    <button
                      onClick={() => onCreateSubtask(idea.id, {
                        title: 'New task',
                        status,
                        priority: 'medium',
                        tags: [],
                        dependencies: []
                      })}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                    >
                      Add the first task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 