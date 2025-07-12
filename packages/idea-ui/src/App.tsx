import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Database, 
  Bot, 
  BarChart3, 
  Settings, 
  FileText, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'

import { IdeaList } from './components/IdeaList'
import { IdeaForm } from './components/IdeaForm'
import { BotManagement } from './components/BotManagement'
import { DatabaseManagement } from './components/DatabaseManagement'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { ConfigurationManagement } from './components/ConfigurationManagement'
import { LogsMonitoring } from './components/LogsMonitoring'
import { useIdeaStore } from './hooks/useIdeaStore'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaStatus, Subtask, SubtaskStatus } from './types'

type TabType = 'overview' | 'ideas' | 'bot' | 'database' | 'analytics' | 'config' | 'logs'

export default function App() {
  const { 
    ideas, 
    loading, 
    error, 
    createIdea, 
    updateIdea, 
    deleteIdea, 
    refreshIdeas,
    updateSubtask,
    createSubtask,
    deleteSubtask
  } = useIdeaStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()
  const [systemStatus] = useState({
    bot: { status: 'running', uptime: '2h 15m', lastActivity: '2 minutes ago' },
    database: { status: 'connected', latency: '15ms', connections: 3 },
    claude: { status: 'active', tokensUsed: 45230, requestsToday: 127 },
    webServer: { status: 'running', port: 3000, requests: 1439 }
  })

  useEffect(() => {
    refreshIdeas()
  }, [refreshIdeas])

  const handleCreateIdea = async (data: CreateIdeaInput) => {
    await createIdea({ ...data, generateSubtasks: true })
    setShowForm(false)
  }

  const handleUpdateIdea = async (data: CreateIdeaInput) => {
    if (!editingIdea) return
    
    const updateData: UpdateIdeaInput = {
      id: editingIdea.id,
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      tags: data.tags,
      regenerateSubtasks: true
    }
    
    await updateIdea(updateData)
    setEditingIdea(undefined)
  }

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea)
  }

  const handleDeleteIdea = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this idea and all its subtasks?')) {
      await deleteIdea(id)
    }
  }

  const handleUpdateStatus = async (id: string, status: IdeaStatus) => {
    await updateIdea({ id, status })
  }

  const handleUpdateSubtask = async (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => {
    await updateSubtask(ideaId, subtaskId, updates)
  }

  const handleCreateSubtask = async (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createSubtask(ideaId, subtask)
  }

  const handleDeleteSubtask = async (ideaId: string, subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      await deleteSubtask(ideaId, subtaskId)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingIdea(undefined)
  }

  const handleCreateNew = () => {
    setEditingIdea(undefined)
    setShowForm(true)
  }

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: Activity },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'bot', label: 'Bot Management', icon: Bot },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText },
  ] as const

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'active':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
      case 'disconnected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'active':
        return <CheckCircle className="text-green-600" size={16} />
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={16} />
      case 'error':
      case 'disconnected':
        return <AlertCircle className="text-red-600" size={16} />
      default:
        return <Clock className="text-gray-600" size={16} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Lightbulb className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Strategic Intelligence System</h1>
                <p className="text-sm text-gray-600">Guild.xyz CEO Dashboard with AI-Powered Kanban</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                {getStatusIcon(systemStatus.bot.status)}
                <span className={getStatusColor(systemStatus.bot.status)}>
                  Bot {systemStatus.bot.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {id === 'ideas' && ideas.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                      {ideas.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Lightbulb className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Strategic Ideas</dt>
                          <dd className="text-lg font-medium text-gray-900">{ideas.length}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">
                        {ideas.filter(i => i.status === 'completed').length} completed
                      </span>
                      <span className="text-gray-500"> • </span>
                      <span className="text-yellow-600 font-medium">
                        {ideas.filter(i => i.status === 'in_progress').length} in progress
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Tasks</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {ideas.reduce((total, idea) => total + idea.subtasks.length, 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">
                        {ideas.reduce((total, idea) => total + idea.subtasks.filter(s => s.status === 'done').length, 0)} done
                      </span>
                      <span className="text-gray-500"> • </span>
                      <span className="text-blue-600 font-medium">
                        {ideas.reduce((total, idea) => total + idea.subtasks.filter(s => s.status === 'in_progress').length, 0)} active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Bot className={`h-6 w-6 ${getStatusColor(systemStatus.bot.status)}`} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Bot Status</dt>
                          <dd className={`text-lg font-medium ${getStatusColor(systemStatus.bot.status)} capitalize`}>
                            {systemStatus.bot.status}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Uptime: {systemStatus.bot.uptime}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Est. Hours</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {ideas.reduce((total, idea) => 
                              total + idea.subtasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0), 0
                            )}h
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Across all active ideas</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {ideas.slice(0, 5).map((idea) => (
                    <div key={idea.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Lightbulb className="text-blue-600 mr-3" size={16} />
                        <span className="text-sm text-gray-900">{idea.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {idea.subtasks.filter(s => s.status === 'done').length}/{idea.subtasks.length} tasks
                        </span>
                                                 <span className="text-xs text-gray-400">
                           {format(new Date(idea.updatedAt), 'MMM d')}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ideas' && (
            <IdeaList
              ideas={ideas}
              loading={loading}
              onEdit={handleEditIdea}
              onDelete={handleDeleteIdea}
              onUpdateStatus={handleUpdateStatus}
              onCreate={handleCreateNew}
              onUpdateSubtask={handleUpdateSubtask}
              onCreateSubtask={handleCreateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {activeTab === 'bot' && <BotManagement />}
          {activeTab === 'database' && <DatabaseManagement />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'config' && <ConfigurationManagement />}
          {activeTab === 'logs' && <LogsMonitoring />}

          {(showForm || editingIdea) && (
            <IdeaForm
              idea={editingIdea}
              onSubmit={editingIdea ? handleUpdateIdea : handleCreateIdea}
              onCancel={handleFormCancel}
              loading={loading}
            />
          )}

          {error && (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
