import { useState, useEffect } from 'react'
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Play, 
  Pause, 
  RotateCcw, 
  Send,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Hash
} from 'lucide-react'

interface Conversation {
  id: string
  userId: string
  username: string
  firstName: string
  lastMessage: string
  lastActivity: Date
  messageCount: number
  status: 'active' | 'inactive'
}

interface BotUser {
  id: string
  username: string
  firstName: string
  lastName?: string
  joinedAt: Date
  messageCount: number
  lastSeen: Date
  isActive: boolean
}

interface BotStats {
  totalUsers: number
  activeConversations: number
  messagesProcessed: number
  uptime: string
  status: 'running' | 'stopped' | 'error'
}

export const BotManagement = () => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'users' | 'controls'>('conversations')
  const [searchTerm, setSearchTerm] = useState('')
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      userId: '123456789',
      username: 'razvan',
      firstName: 'Razvan',
      lastMessage: 'Can you help me analyze the enterprise sales strategy?',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      messageCount: 47,
      status: 'active'
    },
    {
      id: '2',
      userId: '987654321',
      username: 'john_doe',
      firstName: 'John',
      lastMessage: 'Thanks for the product roadmap insights!',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      messageCount: 23,
      status: 'inactive'
    },
    {
      id: '3',
      userId: '456789123',
      username: 'sarah_m',
      firstName: 'Sarah',
      lastMessage: 'What are the latest competitive analysis findings?',
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      messageCount: 31,
      status: 'active'
    }
  ])

  const [users] = useState<BotUser[]>([
    {
      id: '123456789',
      username: 'razvan',
      firstName: 'Razvan',
      lastName: 'Cosma',
      joinedAt: new Date('2024-01-15'),
      messageCount: 847,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      isActive: true
    },
    {
      id: '987654321',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      joinedAt: new Date('2024-02-20'),
      messageCount: 156,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isActive: false
    },
    {
      id: '456789123',
      username: 'sarah_m',
      firstName: 'Sarah',
      lastName: 'Miller',
      joinedAt: new Date('2024-03-10'),
      messageCount: 93,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000),
      isActive: true
    }
  ])

  const [botStats] = useState<BotStats>({
    totalUsers: 3,
    activeConversations: 2,
    messagesProcessed: 1096,
    uptime: '2h 45m',
    status: 'running'
  })

  const [messageToSend, setMessageToSend] = useState('')
  const [selectedUser, setSelectedUser] = useState('')

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'text-green-600'
      case 'stopped':
      case 'inactive':
        return 'text-gray-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <CheckCircle className="text-green-600" size={16} />
      case 'stopped':
      case 'inactive':
        return <Clock className="text-gray-600" size={16} />
      case 'error':
        return <AlertCircle className="text-red-600" size={16} />
      default:
        return <Clock className="text-gray-600" size={16} />
    }
  }

  const handleSendMessage = () => {
    if (!messageToSend.trim() || !selectedUser) return
    
    console.log('Sending message:', messageToSend, 'to user:', selectedUser)
    setMessageToSend('')
    setSelectedUser('')
  }

  const handleBotAction = (action: 'start' | 'stop' | 'restart') => {
    console.log('Bot action:', action)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bot Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(botStats.status)}
                <span className={`text-sm font-semibold ${getStatusColor(botStats.status)}`}>
                  {botStats.status}
                </span>
              </div>
            </div>
            <Bot className="text-blue-600" size={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4">Uptime: {botStats.uptime}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{botStats.totalUsers}</p>
            </div>
            <Users className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Conversations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{botStats.activeConversations}</p>
            </div>
            <MessageSquare className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages Processed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{botStats.messagesProcessed.toLocaleString()}</p>
            </div>
            <Hash className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'conversations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Conversations
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'users'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'controls'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Bot Controls
              </button>
            </div>
            
            {(activeTab === 'conversations' || activeTab === 'users') && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'conversations' && (
            <div className="space-y-4">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <User className="text-blue-600" size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{conversation.firstName}</h4>
                            <span className="text-sm text-gray-500">@{conversation.username}</span>
                            {getStatusIcon(conversation.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{conversation.lastMessage}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatTimeAgo(conversation.lastActivity)}</span>
                            <span>{conversation.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <User className="text-green-600" size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <span className="text-sm text-gray-500">@{user.username}</span>
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>Joined {user.joinedAt.toLocaleDateString()}</span>
                            <span>{user.messageCount} messages</span>
                            <span>Last seen {formatTimeAgo(user.lastSeen)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Message
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleBotAction('start')}
                  disabled={botStats.status === 'running'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={16} />
                  Start Bot
                </button>
                <button
                  onClick={() => handleBotAction('stop')}
                  disabled={botStats.status === 'stopped'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Pause size={16} />
                  Stop Bot
                </button>
                <button
                  onClick={() => handleBotAction('restart')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw size={16} />
                  Restart Bot
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Message to User</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select User
                    </label>
                    <select
                      id="user-select"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} (@{user.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message-input"
                      rows={3}
                      value={messageToSend}
                      onChange={(e) => setMessageToSend(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageToSend.trim() || !selectedUser}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 