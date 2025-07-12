import { useState, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { format } from 'date-fns'
import { 
  Database, 
  Bot, 
  BarChart3, 
  FileText, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  MessageSquare,
  Users
} from 'lucide-react'

import { IdeaList } from './components/IdeaList'
import { IdeaForm } from './components/IdeaForm'
import { BotManagement } from './components/BotManagement'
import { DatabaseManagement } from './components/DatabaseManagement'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { LogsMonitoring } from './components/LogsMonitoring'
import { ConversationExplorer } from './components/ConversationExplorer'
import { ContactsExplorer } from './components/ContactsExplorer'
import { ContactProfile } from './components/ContactProfile'
import { 
  ideasAtom,
  loadingAtom,
  errorAtom,
  createIdeaAtom,
  updateIdeaAtom,
  deleteIdeaAtom,
  refreshIdeasAtom,
  updateSubtaskAtom,
  createSubtaskAtom,
  deleteSubtaskAtom,
  conversationsAtom,
  createConversationAtom,
  contactsAtom,
  contactAnalyticsAtom,
  selectedContactIdAtom,
  loadContactsAtom,
  filteredContactsAtom
} from './store'
import { mockSystemStatus } from './data'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaStatus, Subtask, CreateConversationInput } from './types'

type TabType = 'overview' | 'ideas' | 'conversations' | 'contacts' | 'bot' | 'database' | 'analytics' | 'logs'

export default function App() {
  const ideas = useAtomValue(ideasAtom)
  const loading = useAtomValue(loadingAtom)
  const error = useAtomValue(errorAtom)
  const conversations = useAtomValue(conversationsAtom)
  const contacts = useAtomValue(contactsAtom)
  const filteredContacts = useAtomValue(filteredContactsAtom)
  const createIdea = useSetAtom(createIdeaAtom)
  const updateIdea = useSetAtom(updateIdeaAtom)
  const deleteIdea = useSetAtom(deleteIdeaAtom)
  const refreshIdeas = useSetAtom(refreshIdeasAtom)
  const updateSubtask = useSetAtom(updateSubtaskAtom)
  const createSubtask = useSetAtom(createSubtaskAtom)
  const deleteSubtask = useSetAtom(deleteSubtaskAtom)
  const createConversation = useSetAtom(createConversationAtom)
  const loadContacts = useSetAtom(loadContactsAtom)
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()
  const [showConversationForm, setShowConversationForm] = useState(false)
  const [systemStatus] = useState(mockSystemStatus)

  useEffect(() => {
    refreshIdeas()
    loadContacts()
  }, [refreshIdeas, loadContacts])

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
    updateSubtask({ ideaId, subtaskId, updates })
  }

  const handleCreateSubtask = async (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    createSubtask({ ideaId, subtask })
  }

  const handleDeleteSubtask = async (ideaId: string, subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      deleteSubtask({ ideaId, subtaskId })
    }
  }

  const handleCreateConversation = () => {
    setShowConversationForm(true)
  }

  const handleConversationFormSubmit = async (data: any) => {
    const conversationData: CreateConversationInput = {
      chatId: Math.floor(Math.random() * 1000000),
      title: data.title,
      type: data.type || 'private',
      participants: [
        {
          id: 'user1',
          name: data.participantName || 'User',
          username: data.participantUsername,
          role: 'user'
        }
      ],
      tags: data.tags || [],
      priority: data.priority || 'medium'
    }
    
    await createConversation(conversationData)
    setShowConversationForm(false)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingIdea(undefined)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={16} className="text-green-600" />
      case 'warning': return <AlertCircle size={16} className="text-yellow-600" />
      case 'error': return <AlertCircle size={16} className="text-red-600" />
      default: return <Clock size={16} className="text-gray-600" />
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'ideas', label: 'Strategic Ideas', icon: Lightbulb },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'bot', label: 'Bot Management', icon: Bot },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: FileText },
  ] as const

  if (activeTab === 'conversations') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="p-6">
          <ConversationExplorer onCreateConversation={handleCreateConversation} />
        </div>

        {showConversationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Conversation</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                handleConversationFormSubmit({
                  title: formData.get('title'),
                  type: formData.get('type'),
                  participantName: formData.get('participantName'),
                  participantUsername: formData.get('participantUsername'),
                  priority: formData.get('priority')
                })
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      name="title"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Conversation title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="private">Private</option>
                      <option value="group">Group</option>
                      <option value="supergroup">Supergroup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Participant Name</label>
                    <input
                      name="participantName"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Participant name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConversationForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="border-b bg-white px-6 py-4">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Strategic Intelligence Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage strategic ideas, conversations, and AI-powered insights for Guild.xyz
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Strategic Ideas</p>
                    <p className="text-2xl font-bold text-blue-600">{ideas.length}</p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversations</p>
                    <p className="text-2xl font-bold text-green-600">{conversations.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contacts</p>
                    <p className="text-2xl font-bold text-indigo-600">{contacts.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Ideas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {ideas.filter(idea => idea.status === 'active').length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(systemStatus).map(([key, status]) => (
                    <div key={key} className="flex items-center space-x-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                          {status.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow border">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Ideas</h2>
                </div>
                <div className="p-6">
                  {ideas.slice(0, 5).map((idea) => (
                    <div key={idea.id} className="flex items-center space-x-3 py-2">
                      <Lightbulb size={16} className="text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{idea.title}</p>
                        <p className="text-xs text-gray-500">{format(idea.createdAt, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                  {ideas.length === 0 && (
                    <p className="text-sm text-gray-500">No ideas yet. Create your first strategic idea!</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                </div>
                <div className="p-6">
                  {conversations.slice(0, 5).map((conversation) => (
                    <div key={conversation.id} className="flex items-center space-x-3 py-2">
                      <MessageSquare size={16} className="text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{conversation.title}</p>
                        <p className="text-xs text-gray-500">
                          {conversation.messages.length} messages • {format(conversation.lastActivity, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-sm text-gray-500">No conversations yet. Start your first strategic conversation!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <>
            <IdeaList
              ideas={ideas}
              loading={loading}
              onEdit={handleEditIdea}
              onDelete={handleDeleteIdea}
              onUpdateStatus={handleUpdateStatus}
              onCreate={() => setShowForm(true)}
              onUpdateSubtask={handleUpdateSubtask}
              onCreateSubtask={handleCreateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />

            {(showForm || editingIdea) && (
              <IdeaForm
                idea={editingIdea}
                onSubmit={editingIdea ? handleUpdateIdea : handleCreateIdea}
                onCancel={handleFormCancel}
                loading={loading}
              />
            )}

            {error && (
              <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ContactsExplorer />
            </div>
            <div>
              <ContactProfile />
            </div>
          </div>
        )}

        {activeTab === 'bot' && <BotManagement />}
        {activeTab === 'database' && <DatabaseManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'logs' && <LogsMonitoring />}
      </div>
    </div>
  )
}
