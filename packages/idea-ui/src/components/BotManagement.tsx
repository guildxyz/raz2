import { useState, useEffect } from 'react'
import {
  Bot,
  Users,
  MessageSquare,
  Settings,
  Send,
  BarChart3,
  Search,
  User,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Crown,
  Star,
  Brain,
  Zap,
  Activity,
  Hash,
  Eye,
  EyeOff,
  Shield,
  X,
  Plus,
  Edit,
  Save,
  Cancel
} from 'lucide-react'
import type { BotInstance, Conversation, Contact } from '../types'
import { 
  mockBots, 
  mockConversations as mockConversationData,
  mockContacts as mockContactData
} from '../data'
import { botService, type BotInfo } from '../services/botService'

export const BotManagement = () => {
  const [selectedBot, setSelectedBot] = useState<string>('strategic-ai')
  const [activeManagementTab, setActiveManagementTab] = useState<'conversations' | 'contacts' | 'controls' | 'telegram' | 'analytics'>('conversations')
  const [searchTerm, setSearchTerm] = useState('')
  const [messageToSend, setMessageToSend] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [showBotToken, setShowBotToken] = useState(false)
  const [isEditingTelegram, setIsEditingTelegram] = useState(false)
  const [telegramConfig, setTelegramConfig] = useState<BotInstance['telegram'] | null>(null)
  const [realBotInfo, setRealBotInfo] = useState<BotInfo | null>(null)
  const [loadingBotInfo, setLoadingBotInfo] = useState(true)

  const [conversations] = useState<Conversation[]>(mockConversationData)
  const [contacts] = useState<Contact[]>(mockContactData)
  const [bots] = useState<BotInstance[]>(mockBots)

  useEffect(() => {
    const fetchBotInfo = async () => {
      setLoadingBotInfo(true)
      try {
        const info = await botService.getBotInfo()
        setRealBotInfo(info)
      } catch (error) {
        console.error('Failed to fetch bot info:', error)
      } finally {
        setLoadingBotInfo(false)
      }
    }

    fetchBotInfo()
  }, [])

  const currentBot = bots.find(bot => bot.id === selectedBot)
  const currentBotConversations = conversations.filter(() => selectedBot === 'strategic-ai' ? true : false)
  const currentBotContacts = contacts.filter(() => selectedBot === 'strategic-ai' ? true : false)

  const filteredConversations = currentBotConversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredContacts = currentBotContacts.filter(contact =>
    contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.lastName && contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'professional':
        return <Crown className="text-blue-600" size={16} />
      case 'friendly':
        return <Star className="text-yellow-600" size={16} />
      case 'technical':
        return <Brain className="text-purple-600" size={16} />
      case 'creative':
        return <Zap className="text-green-600" size={16} />
      default:
        return <Bot className="text-gray-600" size={16} />
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-green-100 text-green-800'
      case 'staging':
        return 'bg-yellow-100 text-yellow-800'
      case 'development':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleBotAction = (action: 'start' | 'stop' | 'restart') => {
    console.log(`Bot action: ${action} for bot:`, selectedBot)
  }

  const handleSendMessage = () => {
    if (!messageToSend.trim() || !selectedUser) return
    console.log('Sending message:', messageToSend, 'to user:', selectedUser)
    setMessageToSend('')
    setSelectedUser('')
  }

  const startEditingTelegram = () => {
    if (currentBot?.telegram) {
      setTelegramConfig({ ...currentBot.telegram })
      setIsEditingTelegram(true)
    }
  }

  const cancelEditingTelegram = () => {
    setTelegramConfig(null)
    setIsEditingTelegram(false)
  }

  const saveTelegramConfig = () => {
    console.log('Saving telegram config:', telegramConfig)
    setIsEditingTelegram(false)
    setTelegramConfig(null)
  }

  const renderBotCard = (bot: BotInstance) => {
    const isSelected = selectedBot === bot.id
    
    return (
      <div
        key={bot.id}
        onClick={() => setSelectedBot(bot.id)}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'bg-blue-50 border-2 border-blue-500 shadow-lg transform scale-105'
            : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
        } rounded-xl p-6`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSelected ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Bot className={`${isSelected ? 'text-blue-600' : 'text-gray-600'}`} size={32} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{bot.name}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bot.description}</p>
          
          <div className="flex items-center gap-2 mb-3">
            {getStatusIcon(bot.status)}
            <span className={`text-sm font-medium ${
              bot.status === 'running' ? 'text-green-600' : 
              bot.status === 'stopped' ? 'text-gray-600' : 'text-red-600'
            }`}>
              {bot.status}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{bot.stats.totalUsers}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={12} />
              <span>{bot.stats.activeConversations}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity size={12} />
              <span>{bot.stats.uptime}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {getPersonalityIcon(bot.personality)}
            <span className="text-xs text-gray-500 capitalize">{bot.personality}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(bot.deployment.environment)}`}>
              {bot.deployment.environment}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Real Bot Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Live Bot Information</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected to Telegram</span>
          </div>
        </div>
        
        {loadingBotInfo ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading bot information...</span>
          </div>
        ) : realBotInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={botService.getBotPhotoUrl()}
                  alt={`${realBotInfo.firstName} profile`}
                  className="w-16 h-16 rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="text-blue-600" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{realBotInfo.firstName}</h3>
                <p className="text-blue-600">@{realBotInfo.username}</p>
                <p className="text-sm text-gray-500">ID: {realBotInfo.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Can Join Groups</div>
                <div className="text-sm font-medium">{realBotInfo.canJoinGroups ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <MessageSquare className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Read All Messages</div>
                <div className="text-sm font-medium">{realBotInfo.canReadAllGroupMessages ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Bot information not available</p>
            <p className="text-sm text-gray-500">Make sure the bot is connected to Telegram</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bot Fleet</h2>
            <p className="text-gray-600 mt-1">Manage your AI workforce - Select a bot to view details</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            Deploy New Bot
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bots.map(renderBotCard)}
        </div>
      </div>

      {currentBot && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Bot className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{currentBot.name}</h3>
                  <p className="text-gray-600">{currentBot.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Version {currentBot.version}</div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(currentBot.status)}
                    <span className="text-sm font-medium">{currentBot.status}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-6 mt-4">
              <button
                onClick={() => setActiveManagementTab('conversations')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeManagementTab === 'conversations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Conversations ({currentBotConversations.length})
                </div>
              </button>
              <button
                onClick={() => setActiveManagementTab('contacts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeManagementTab === 'contacts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  Contacts ({currentBotContacts.length})
                </div>
              </button>
              <button
                onClick={() => setActiveManagementTab('controls')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeManagementTab === 'controls'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} />
                  Controls
                </div>
              </button>
              <button
                onClick={() => setActiveManagementTab('telegram')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeManagementTab === 'telegram'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send size={16} />
                  Telegram
                </div>
              </button>
              <button
                onClick={() => setActiveManagementTab('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeManagementTab === 'analytics'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  Analytics
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeManagementTab === 'conversations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Active Conversations</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {filteredConversations.map((conversation) => (
                    <div key={conversation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 rounded-full p-2">
                          <User className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{conversation.firstName}</div>
                          <div className="text-sm text-gray-600">@{conversation.username}</div>
                          <div className="text-sm text-gray-500 mt-1">{conversation.lastMessage}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{formatTimeAgo(conversation.lastActivity)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(conversation.status)}
                          <span className="text-sm text-gray-600">{conversation.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeManagementTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Bot Contacts</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-gray-100 rounded-full p-3">
                            <User className="text-gray-600" size={24} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</div>
                            <div className="text-sm text-gray-600">@{contact.username}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.primaryTopics.slice(0, 3).map((topic, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Last seen {formatTimeAgo(contact.lastSeen)}</div>
                          <div className="text-sm text-gray-600 mt-1">{contact.totalMessages} messages</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeManagementTab === 'controls' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Bot Controls</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleBotAction('start')}
                    disabled={currentBot.status === 'running'}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={16} />
                    Start Bot
                  </button>
                  <button
                    onClick={() => handleBotAction('stop')}
                    disabled={currentBot.status === 'stopped'}
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
                  <h5 className="text-md font-semibold text-gray-900 mb-4">Send Message to User</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Choose a user...</option>
                        {currentBotContacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName} (@{contact.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
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

            {activeManagementTab === 'telegram' && currentBot && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Telegram Configuration</h4>
                  {!isEditingTelegram ? (
                    <button
                      onClick={startEditingTelegram}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={16} />
                      Edit Configuration
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveTelegramConfig}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEditingTelegram}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Key className="text-gray-600" size={18} />
                        Authentication
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bot Token</label>
                          <div className="relative">
                            <input
                              type={showBotToken ? 'text' : 'password'}
                              value={isEditingTelegram ? telegramConfig?.botToken || '' : currentBot.telegram.botToken}
                              onChange={(e) => isEditingTelegram && telegramConfig && setTelegramConfig(prev => prev ? { ...prev, botToken: e.target.value } : null)}
                              readOnly={!isEditingTelegram}
                              className={`w-full px-3 py-2 border rounded-md pr-10 ${
                                isEditingTelegram 
                                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            />
                            <button
                              onClick={() => setShowBotToken(!showBotToken)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Telegram Bot API token from @BotFather</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bot Username</label>
                          <input
                            type="text"
                            value={isEditingTelegram ? telegramConfig?.username || '' : currentBot.telegram.username}
                            onChange={(e) => isEditingTelegram && telegramConfig && setTelegramConfig(prev => prev ? { ...prev, username: e.target.value } : null)}
                            readOnly={!isEditingTelegram}
                            className={`w-full px-3 py-2 border rounded-md ${
                              isEditingTelegram 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="text-gray-600" size={18} />
                        Access Control
                      </h5>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Users</label>
                        <div className="space-y-2">
                          {(isEditingTelegram ? telegramConfig?.allowedUsers || [] : currentBot.telegram.allowedUsers).map((user, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded border px-3 py-2">
                              <span className="text-sm text-gray-700">@{user}</span>
                              {isEditingTelegram && (
                                <button
                                  onClick={() => {
                                    if (telegramConfig) {
                                      const newUsers = telegramConfig.allowedUsers.filter((_, i) => i !== index)
                                      setTelegramConfig(prev => prev ? { ...prev, allowedUsers: newUsers } : null)
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditingTelegram && (
                            <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                              <Plus size={16} className="inline mr-1" />
                              Add User
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-md font-semibold text-gray-900 mb-4">Rate Limits</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Messages Per User</label>
                          <input
                            type="number"
                            value={isEditingTelegram ? telegramConfig?.rateLimits.messagesPerUser || 0 : currentBot.telegram.rateLimits.messagesPerUser}
                            onChange={(e) => isEditingTelegram && telegramConfig && setTelegramConfig(prev => 
                              prev ? { 
                                ...prev, 
                                rateLimits: { ...prev.rateLimits, messagesPerUser: parseInt(e.target.value) }
                              } : null
                            )}
                            readOnly={!isEditingTelegram}
                            className={`w-full px-3 py-2 border rounded-md ${
                              isEditingTelegram 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Commands Per Minute</label>
                          <input
                            type="number"
                            value={isEditingTelegram ? telegramConfig?.rateLimits.commandsPerMinute || 0 : currentBot.telegram.rateLimits.commandsPerMinute}
                            onChange={(e) => isEditingTelegram && telegramConfig && setTelegramConfig(prev => 
                              prev ? { 
                                ...prev, 
                                rateLimits: { ...prev.rateLimits, commandsPerMinute: parseInt(e.target.value) }
                              } : null
                            )}
                            readOnly={!isEditingTelegram}
                            className={`w-full px-3 py-2 border rounded-md ${
                              isEditingTelegram 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-md font-semibold text-gray-900 mb-4">Features</h5>
                      <div className="space-y-3">
                        {Object.entries(currentBot.telegram.features).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 capitalize">
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEditingTelegram ? telegramConfig?.features[feature as keyof typeof telegramConfig.features] ?? enabled : enabled}
                                onChange={(e) => isEditingTelegram && telegramConfig && setTelegramConfig(prev => 
                                  prev ? { 
                                    ...prev, 
                                    features: { ...prev.features, [feature]: e.target.checked }
                                  } : null
                                )}
                                disabled={!isEditingTelegram}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full transition-colors ${
                                (isEditingTelegram ? telegramConfig?.features[feature as keyof typeof telegramConfig.features] ?? enabled : enabled)
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-300'
                              } ${!isEditingTelegram ? 'opacity-60' : ''}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                  (isEditingTelegram ? telegramConfig?.features[feature as keyof typeof telegramConfig.features] ?? enabled : enabled)
                                    ? 'translate-x-5' 
                                    : 'translate-x-0'
                                } mt-0.5 ml-0.5`} />
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="text-md font-semibold text-blue-900 mb-2">Configuration Status</h5>
                      <div className="text-sm text-blue-700">
                        <p>Last updated: {currentBot.telegram.lastUpdated.toLocaleDateString()}</p>
                        <p className="flex items-center gap-1 mt-1">
                          <CheckCircle size={14} />
                          Configuration is valid and active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeManagementTab === 'analytics' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Bot Analytics</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900">{currentBot.stats.totalUsers}</p>
                      </div>
                      <Users className="text-blue-600" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Active Conversations</p>
                        <p className="text-2xl font-bold text-green-900">{currentBot.stats.activeConversations}</p>
                      </div>
                      <MessageSquare className="text-green-600" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Messages Processed</p>
                        <p className="text-2xl font-bold text-purple-900">{currentBot.stats.messagesProcessed.toLocaleString()}</p>
                      </div>
                      <Hash className="text-purple-600" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Avg Response Time</p>
                        <p className="text-2xl font-bold text-orange-900">{currentBot.stats.avgResponseTime}</p>
                      </div>
                      <Clock className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h5 className="text-md font-semibold text-gray-900 mb-4">Configuration Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Model:</span>
                          <span className="text-sm font-medium">{currentBot.configuration.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Temperature:</span>
                          <span className="text-sm font-medium">{currentBot.configuration.temperature}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Max Tokens:</span>
                          <span className="text-sm font-medium">{currentBot.configuration.maxTokens}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Messages/Min:</span>
                          <span className="text-sm font-medium">{currentBot.configuration.rateLimits.messagesPerMinute}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Environment:</span>
                          <span className="text-sm font-medium">{currentBot.deployment.environment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Region:</span>
                          <span className="text-sm font-medium">{currentBot.deployment.region}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">CPU:</span>
                          <span className="text-sm font-medium">{currentBot.deployment.resources.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Memory:</span>
                          <span className="text-sm font-medium">{currentBot.deployment.resources.memory}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 