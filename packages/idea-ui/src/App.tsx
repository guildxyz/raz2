import { useState, useEffect } from 'react'
import { 
  Server, 
  Database, 
  Bot, 
  BarChart3, 
  Settings, 
  FileText, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
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
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaStatus } from './types'

type TabType = 'overview' | 'ideas' | 'bot' | 'database' | 'analytics' | 'config' | 'logs'

export default function App() {
  const { ideas, loading, error, createIdea, updateIdea, deleteIdea, refreshIdeas } = useIdeaStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()
  const [systemStatus, setSystemStatus] = useState({
    bot: { status: 'running', uptime: '2h 15m', lastActivity: '2 minutes ago' },
    database: { status: 'connected', latency: '15ms', connections: 3 },
    claude: { status: 'active', tokensUsed: 45230, requestsToday: 127 },
    webServer: { status: 'running', port: 3000, requests: 1439 }
  })

  useEffect(() => {
    refreshIdeas()
  }, [refreshIdeas])

  const handleCreateIdea = async (data: CreateIdeaInput) => {
    await createIdea(data)
    setShowForm(false)
  }

  const handleUpdateIdea = async (data: CreateIdeaInput) => {
    if (!editingIdea) return
    
    const updateData: UpdateIdeaInput = {
      id: editingIdea.id,
      ...data,
    }
    
    await updateIdea(updateData)
    setEditingIdea(undefined)
  }

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea)
  }

  const handleDeleteIdea = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      await deleteIdea(id)
    }
  }

  const handleUpdateStatus = async (id: string, status: IdeaStatus) => {
    await updateIdea({ id, status })
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

  const renderSystemOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Telegram Bot</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(systemStatus.bot.status)}
                <span className={`text-sm font-semibold ${getStatusColor(systemStatus.bot.status)}`}>
                  {systemStatus.bot.status}
                </span>
              </div>
            </div>
            <Bot className="text-blue-600" size={24} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500">Uptime: {systemStatus.bot.uptime}</p>
            <p className="text-xs text-gray-500">Last Activity: {systemStatus.bot.lastActivity}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(systemStatus.database.status)}
                <span className={`text-sm font-semibold ${getStatusColor(systemStatus.database.status)}`}>
                  {systemStatus.database.status}
                </span>
              </div>
            </div>
            <Database className="text-green-600" size={24} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500">Latency: {systemStatus.database.latency}</p>
            <p className="text-xs text-gray-500">Connections: {systemStatus.database.connections}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Claude AI</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(systemStatus.claude.status)}
                <span className={`text-sm font-semibold ${getStatusColor(systemStatus.claude.status)}`}>
                  {systemStatus.claude.status}
                </span>
              </div>
            </div>
            <MessageSquare className="text-purple-600" size={24} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500">Tokens Used: {systemStatus.claude.tokensUsed.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Requests Today: {systemStatus.claude.requestsToday}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Web Server</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(systemStatus.webServer.status)}
                <span className={`text-sm font-semibold ${getStatusColor(systemStatus.webServer.status)}`}>
                  {systemStatus.webServer.status}
                </span>
              </div>
            </div>
            <Server className="text-orange-600" size={24} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500">Port: {systemStatus.webServer.port}</p>
            <p className="text-xs text-gray-500">Requests: {systemStatus.webServer.requests.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="text-blue-600" size={16} />
              <div>
                <p className="text-sm font-medium">New conversation started</p>
                <p className="text-xs text-gray-500">User @razvan - 5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Lightbulb className="text-yellow-600" size={16} />
              <div>
                <p className="text-sm font-medium">Strategic idea captured</p>
                <p className="text-xs text-gray-500">Enterprise Multi-Guild Strategy - 12 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database className="text-green-600" size={16} />
              <div>
                <p className="text-sm font-medium">Database backup completed</p>
                <p className="text-xs text-gray-500">Auto backup successful - 1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Ideas</span>
              <span className="text-sm font-semibold">{ideas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Conversations</span>
              <span className="text-sm font-semibold">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Messages Today</span>
              <span className="text-sm font-semibold">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Vector Embeddings</span>
              <span className="text-sm font-semibold">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-semibold">99.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderSystemOverview()
      case 'ideas':
        return (
          <IdeaList
            ideas={ideas}
            loading={loading}
            onEdit={handleEditIdea}
            onDelete={handleDeleteIdea}
            onUpdateStatus={handleUpdateStatus}
            onCreate={handleCreateNew}
          />
        )
      case 'bot':
        return (
          <BotManagement />
        )
      case 'database':
        return <DatabaseManagement />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'config':
        return <ConfigurationManagement />
      case 'logs':
        return <LogsMonitoring />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <Server className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Raz2 Management</h1>
                <p className="text-sm text-gray-500">Strategic Intelligence System Control Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {activeTab === 'ideas' && `${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}`}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon('running')}
                <span className="text-sm text-green-600 font-medium">System Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {renderTabContent()}
      </main>

      {(showForm || editingIdea) && (
        <IdeaForm
          idea={editingIdea}
          onSubmit={editingIdea ? handleUpdateIdea : handleCreateIdea}
          onCancel={handleFormCancel}
          loading={loading}
        />
      )}
    </div>
  )
}
