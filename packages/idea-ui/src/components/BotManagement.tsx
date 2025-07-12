import { useState } from 'react'
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Play, 
  Pause, 
  RotateCcw, 
  Send,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Hash,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Activity,
  Settings,
  Plus,
  Shield,
  Zap,
  Brain,
  Star,
  Target,
  Crown,
  Award,
  Scale
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





interface Contact {
  id: string
  username: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  joinedAt: Date
  lastSeen: Date
  isActive: boolean
  totalMessages: number
  avgResponseTime: string
  primaryTopics: string[]
  interactionScore: number
  influenceWeight: number
  role: 'advisor' | 'colleague' | 'stakeholder' | 'expert' | 'investor' | 'team'
  decisionAreas: string[]
  trustLevel: 'high' | 'medium' | 'low'
  conversationHistory: {
    date: Date
    messageCount: number
    topic: string
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  preferences: {
    preferredTime: string
    communicationStyle: 'formal' | 'casual'
    interests: string[]
  }
}

interface BotInstance {
  id: string
  name: string
  description: string
  avatar?: string
  personality: 'professional' | 'friendly' | 'technical' | 'creative'
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  createdAt: Date
  lastActivity: Date
  version: string
  stats: {
    totalUsers: number
    activeConversations: number
    messagesProcessed: number
    uptime: string
    avgResponseTime: string
    errorRate: number
  }
  configuration: {
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    enabledFeatures: string[]
    rateLimits: {
      messagesPerMinute: number
      messagesPerDay: number
    }
  }
  deployment: {
    environment: 'production' | 'staging' | 'development'
    region: string
    resources: {
      cpu: string
      memory: string
      storage: string
    }
  }
}

export const BotManagement = () => {
  const [activeTab, setActiveTab] = useState<'bots' | 'conversations' | 'contacts' | 'controls'>('bots')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedBot, setSelectedBot] = useState<string | null>('strategic-ai')
  const [expandedBot, setExpandedBot] = useState<string | null>(null)
  const [editingInfluence, setEditingInfluence] = useState<string | null>(null)
  const [showInfluencePanel, setShowInfluencePanel] = useState(false)
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





  const [messageToSend, setMessageToSend] = useState('')
  const [selectedUser, setSelectedUser] = useState('')

  const [contacts] = useState<Contact[]>([
    {
      id: '123456789',
      username: 'razvan',
      firstName: 'Razvan',
      lastName: 'Cosma',
      email: 'razvan@guild.xyz',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      joinedAt: new Date('2024-01-15'),
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      isActive: true,
      totalMessages: 847,
      avgResponseTime: '2.3 minutes',
      primaryTopics: ['Strategy', 'Product', 'Enterprise Sales'],
      interactionScore: 95,
      influenceWeight: 100,
      role: 'advisor',
      decisionAreas: ['Strategic Direction', 'Product Vision', 'Market Entry'],
      trustLevel: 'high',
      conversationHistory: [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          messageCount: 12,
          topic: 'Enterprise Sales Strategy',
          sentiment: 'positive'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          messageCount: 8,
          topic: 'Product Roadmap',
          sentiment: 'neutral'
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          messageCount: 15,
          topic: 'Competitive Analysis',
          sentiment: 'positive'
        }
      ],
      preferences: {
        preferredTime: 'Morning (9-11 AM)',
        communicationStyle: 'formal',
        interests: ['Strategic Planning', 'Market Analysis', 'Team Management']
      }
    },
    {
      id: '987654321',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      location: 'New York, NY',
      joinedAt: new Date('2024-02-20'),
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isActive: false,
      totalMessages: 156,
      avgResponseTime: '8.7 minutes',
      primaryTopics: ['Product', 'Technical'],
      interactionScore: 72,
      influenceWeight: 65,
      role: 'colleague',
      decisionAreas: ['Technical Architecture', 'Product Features'],
      trustLevel: 'medium',
      conversationHistory: [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          messageCount: 5,
          topic: 'Technical Integration',
          sentiment: 'neutral'
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          messageCount: 7,
          topic: 'Product Features',
          sentiment: 'positive'
        }
      ],
      preferences: {
        preferredTime: 'Afternoon (2-4 PM)',
        communicationStyle: 'casual',
        interests: ['Technology', 'Integration', 'Automation']
      }
    },
    {
      id: '456789123',
      username: 'sarah_m',
      firstName: 'Sarah',
      lastName: 'Miller',
      email: 'sarah.miller@corp.com',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX',
      joinedAt: new Date('2024-03-10'),
      lastSeen: new Date(Date.now() - 15 * 60 * 1000),
      isActive: true,
      totalMessages: 293,
      avgResponseTime: '4.1 minutes',
      primaryTopics: ['Market Research', 'Analytics'],
      interactionScore: 88,
      influenceWeight: 85,
      role: 'expert',
      decisionAreas: ['Market Strategy', 'Data Analysis', 'Competitive Intelligence'],
      trustLevel: 'high',
      conversationHistory: [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          messageCount: 9,
          topic: 'Market Research',
          sentiment: 'positive'
        },
        {
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          messageCount: 11,
          topic: 'Analytics Dashboard',
          sentiment: 'positive'
        }
      ],
      preferences: {
        preferredTime: 'Evening (6-8 PM)',
        communicationStyle: 'formal',
        interests: ['Data Analysis', 'Market Trends', 'Business Intelligence']
      }
    }
  ])

  const [bots] = useState<BotInstance[]>([
    {
      id: 'strategic-ai',
      name: 'Strategic AI Assistant',
      description: 'Primary strategic intelligence bot for CEO decision support',
      personality: 'professional',
      status: 'running',
      createdAt: new Date('2024-01-15'),
      lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      version: '2.1.3',
      stats: {
        totalUsers: 3,
        activeConversations: 2,
        messagesProcessed: 1096,
        uptime: '2h 45m',
        avgResponseTime: '1.2s',
        errorRate: 0.02
      },
      configuration: {
        model: 'claude-3-sonnet',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: 'You are a strategic AI assistant for Guild.xyz CEO...',
        enabledFeatures: ['idea-capture', 'semantic-search', 'reminders', 'analytics'],
        rateLimits: {
          messagesPerMinute: 30,
          messagesPerDay: 1000
        }
      },
      deployment: {
        environment: 'production',
        region: 'us-west-1',
        resources: {
          cpu: '2 vCPUs',
          memory: '4 GB',
          storage: '20 GB SSD'
        }
      }
    },
    {
      id: 'customer-support',
      name: 'Customer Support Bot',
      description: 'Handles customer inquiries and support tickets',
      personality: 'friendly',
      status: 'running',
      createdAt: new Date('2024-02-01'),
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      version: '1.8.2',
      stats: {
        totalUsers: 47,
        activeConversations: 12,
        messagesProcessed: 2847,
        uptime: '15d 3h',
        avgResponseTime: '0.8s',
        errorRate: 0.01
      },
      configuration: {
        model: 'claude-3-haiku',
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful customer support assistant...',
        enabledFeatures: ['ticket-creation', 'knowledge-base', 'escalation'],
        rateLimits: {
          messagesPerMinute: 60,
          messagesPerDay: 2000
        }
      },
      deployment: {
        environment: 'production',
        region: 'us-east-1',
        resources: {
          cpu: '4 vCPUs',
          memory: '8 GB',
          storage: '50 GB SSD'
        }
      }
    },
    {
      id: 'developer-assistant',
      name: 'Developer Assistant',
      description: 'Technical support and code assistance for development team',
      personality: 'technical',
      status: 'stopped',
      createdAt: new Date('2024-03-15'),
      lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
      version: '0.9.1-beta',
      stats: {
        totalUsers: 8,
        activeConversations: 0,
        messagesProcessed: 342,
        uptime: '0m',
        avgResponseTime: 'N/A',
        errorRate: 0.05
      },
      configuration: {
        model: 'claude-3-opus',
        temperature: 0.3,
        maxTokens: 8000,
        systemPrompt: 'You are a technical assistant for developers...',
        enabledFeatures: ['code-review', 'debugging', 'documentation'],
        rateLimits: {
          messagesPerMinute: 20,
          messagesPerDay: 500
        }
      },
      deployment: {
        environment: 'development',
        region: 'us-west-2',
        resources: {
          cpu: '1 vCPU',
          memory: '2 GB',
          storage: '10 GB SSD'
        }
      }
    }
  ])

  const currentBot = bots.find(bot => bot.id === selectedBot)
  const currentBotConversations = conversations.filter(() => 
    selectedBot === 'strategic-ai' ? true : false // In real app, filter by bot
  )

  const currentBotContacts = contacts.filter(() => 
    selectedBot === 'strategic-ai' ? true : false // In real app, filter by bot
  )

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )



  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.lastName && contact.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    contact.primaryTopics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.personality.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSendMessage = () => {
    if (!messageToSend.trim() || !selectedUser) return
    
    console.log('Sending message:', messageToSend, 'to user:', selectedUser)
    setMessageToSend('')
    setSelectedUser('')
  }

  const handleBotAction = (action: 'start' | 'stop' | 'restart', botId?: string) => {
    const targetBot = botId || selectedBot
    console.log(`Bot action: ${action} for bot:`, targetBot)
  }

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'professional': return <Shield className="text-blue-600" size={16} />
      case 'friendly': return <MessageCircle className="text-green-600" size={16} />
      case 'technical': return <Zap className="text-purple-600" size={16} />
      case 'creative': return <Brain className="text-pink-600" size={16} />
      default: return <Bot className="text-gray-600" size={16} />
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-green-100 text-green-800'
      case 'staging': return 'bg-yellow-100 text-yellow-800'
      case 'development': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'advisor': return <Crown className="text-yellow-600" size={16} />
      case 'colleague': return <Users className="text-blue-600" size={16} />
      case 'stakeholder': return <Target className="text-purple-600" size={16} />
      case 'expert': return <Award className="text-green-600" size={16} />
      case 'investor': return <TrendingUp className="text-red-600" size={16} />
      case 'team': return <User className="text-gray-600" size={16} />
      default: return <User className="text-gray-600" size={16} />
    }
  }

  const getTrustColor = (trust: string) => {
    switch (trust) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getInfluenceLevel = (weight: number) => {
    if (weight >= 90) return { label: 'Critical', color: 'bg-red-100 text-red-800' }
    if (weight >= 75) return { label: 'High', color: 'bg-orange-100 text-orange-800' }
    if (weight >= 50) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    if (weight >= 25) return { label: 'Low', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Minimal', color: 'bg-gray-100 text-gray-800' }
  }

  const totalInfluence = contacts.reduce((sum, contact) => sum + contact.influenceWeight, 0)
  const averageInfluence = totalInfluence / contacts.length

  const navigateToTab = (tab: string, data?: any) => {
    setActiveTab(tab as any)
    if (data?.userId) {
      setSelectedContact(data.userId)
    }
  }

  const renderBotSelector = () => {
    if (!currentBot) return null
    
    return (
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Bot className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Currently Managing: {currentBot.name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  {getStatusIcon(currentBot.status)}
                  {currentBot.status}
                </span>
                <span>{currentBot.version}</span>
                <span>{currentBot.deployment.environment}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedBot || ''}
              onChange={(e) => setSelectedBot(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => navigateToTab('bots')}
              className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Settings size={14} />
              Configure
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderQuickStats = () => {
    if (!currentBot) return null
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div 
          className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigateToTab('bots')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Bot className="text-blue-600" size={20} />
            <h5 className="font-medium text-gray-900">Bot Fleet</h5>
          </div>
          <div className="text-2xl font-bold text-gray-900">{bots.length}</div>
          <div className="text-sm text-gray-500">Active bots</div>
        </div>

        <div 
          className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigateToTab('conversations')}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="text-green-600" size={20} />
            <h5 className="font-medium text-gray-900">Conversations</h5>
          </div>
          <div className="text-2xl font-bold text-gray-900">{currentBotConversations.length}</div>
          <div className="text-sm text-gray-500">Active chats</div>
        </div>

        <div 
          className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigateToTab('contacts')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale className="text-purple-600" size={20} />
            <h5 className="font-medium text-gray-900">Contacts</h5>
          </div>
          <div className="text-2xl font-bold text-gray-900">{currentBotContacts.length}</div>
          <div className="text-sm text-gray-500">Network contacts</div>
        </div>

        <div 
          className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigateToTab('controls')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings className="text-gray-600" size={20} />
            <h5 className="font-medium text-gray-900">Controls</h5>
          </div>
          <div className="text-2xl font-bold text-gray-900">{currentBot?.stats.messagesProcessed || 0}</div>
          <div className="text-sm text-gray-500">Messages processed</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {currentBot && activeTab !== 'bots' && (
        <>
          {renderBotSelector()}
          {renderQuickStats()}
        </>
      )}

      {currentBot && activeTab === 'bots' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-sm font-semibold text-green-600">
                    {bots.filter(b => b.status === 'running').length} Running
                  </span>
                </div>
              </div>
              <Bot className="text-blue-600" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-4">{bots.length} total bots</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bots.reduce((sum, bot) => sum + bot.stats.totalUsers, 0)}
                </p>
              </div>
              <Users className="text-green-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {bots.reduce((sum, bot) => sum + bot.stats.messagesProcessed, 0).toLocaleString()}
                </p>
              </div>
              <Hash className="text-orange-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">1.1s</p>
              </div>
              <BarChart3 className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('bots')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'bots'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bot size={16} />
                  Bot Fleet
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {bots.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'conversations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Conversations
                  {currentBot && (
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {currentBotConversations.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'contacts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scale size={16} />
                  Contacts
                  {currentBot && (
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {currentBotContacts.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} />
                  Controls
                </div>
              </button>
            </div>
            
            {(activeTab === 'conversations' || activeTab === 'contacts' || activeTab === 'bots') && (
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
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'bots' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Bot Fleet Management</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{filteredBots.length} bots deployed</span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus size={16} />
                    Deploy New Bot
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredBots.map((bot) => (
                  <div key={bot.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-blue-100 rounded-full p-3">
                          <Bot className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{bot.name}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(bot.deployment.environment)}`}>
                              {bot.deployment.environment}
                            </span>
                            <div className="flex items-center gap-1">
                              {getPersonalityIcon(bot.personality)}
                              <span className="text-sm text-gray-600 capitalize">{bot.personality}</span>
                            </div>
                            {getStatusIcon(bot.status)}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{bot.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{bot.stats.totalUsers}</div>
                              <div className="text-xs text-gray-500">Users</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{bot.stats.messagesProcessed}</div>
                              <div className="text-xs text-gray-500">Messages</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{bot.stats.avgResponseTime}</div>
                              <div className="text-xs text-gray-500">Avg Response</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{(bot.stats.errorRate * 100).toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">Error Rate</div>
                            </div>
                          </div>

                          {expandedBot === bot.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3">Configuration</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Model:</span>
                                      <span className="font-mono text-gray-900">{bot.configuration.model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Temperature:</span>
                                      <span className="font-mono text-gray-900">{bot.configuration.temperature}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Max Tokens:</span>
                                      <span className="font-mono text-gray-900">{bot.configuration.maxTokens}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Features:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {bot.configuration.enabledFeatures.map((feature, index) => (
                                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {feature}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3">Deployment</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Region:</span>
                                      <span className="font-mono text-gray-900">{bot.deployment.region}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">CPU:</span>
                                      <span className="font-mono text-gray-900">{bot.deployment.resources.cpu}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Memory:</span>
                                      <span className="font-mono text-gray-900">{bot.deployment.resources.memory}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Storage:</span>
                                      <span className="font-mono text-gray-900">{bot.deployment.resources.storage}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedBot(expandedBot === bot.id ? null : bot.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Settings size={14} />
                          {expandedBot === bot.id ? 'Hide Config' : 'Configure'}
                          {expandedBot === bot.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button
                          onClick={() => setSelectedBot(bot.id)}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            selectedBot === bot.id 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {selectedBot === bot.id ? 'Selected' : 'Select'}
                        </button>
                        {bot.status === 'running' ? (
                          <button
                            onClick={() => handleBotAction('stop', bot.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Pause size={14} />
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBotAction('start', bot.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                          >
                            <Play size={14} />
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Conversations - {currentBot?.name}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigateToTab('contacts')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    <Scale size={14} />
                    View Influence Network
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredConversations.length} active conversations
                  </span>
                </div>
              </div>

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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateToTab('contacts', { userId: conversation.userId })}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        >
                          <Scale size={14} />
                          Influence
                        </button>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Strategic Contact Network</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowInfluencePanel(!showInfluencePanel)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      showInfluencePanel 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Scale size={16} />
                    Influence Panel
                  </button>
                  <div className="text-sm text-gray-500">
                    {filteredContacts.length} contacts • Avg influence: {Math.round(averageInfluence)}
                  </div>
                </div>
              </div>

              {showInfluencePanel && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Decision Influence Analytics</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="text-purple-600" size={20} />
                        <h5 className="font-medium text-gray-900">Total Influence</h5>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{totalInfluence}</div>
                      <div className="text-sm text-gray-500">Combined weight across network</div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="text-yellow-600" size={20} />
                        <h5 className="font-medium text-gray-900">Top Influencer</h5>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {contacts.reduce((max, contact) => contact.influenceWeight > max.influenceWeight ? contact : max).firstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {contacts.reduce((max, contact) => contact.influenceWeight > max.influenceWeight ? contact : max).influenceWeight}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="text-blue-600" size={20} />
                        <h5 className="font-medium text-gray-900">Decision Areas</h5>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {[...new Set(contacts.flatMap(c => c.decisionAreas))].length}
                      </div>
                      <div className="text-sm text-gray-500">Covered domains</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Influence Distribution</h5>
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-3">
                            <div className="w-24 text-sm text-gray-600 truncate">
                              {contact.firstName}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(contact.influenceWeight / 100) * 100}%` }}
                              />
                            </div>
                            <div className="w-12 text-sm font-medium text-gray-900">
                              {contact.influenceWeight}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                  <p className="text-gray-500">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredContacts
                  .sort((a, b) => b.influenceWeight - a.influenceWeight)
                  .map((contact) => {
                    const influenceLevel = getInfluenceLevel(contact.influenceWeight)
                    return (
                      <div key={contact.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-purple-100 rounded-full p-3 relative">
                              <User className="text-purple-600" size={20} />
                              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 border">
                                {getRoleIcon(contact.role)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {contact.firstName} {contact.lastName}
                                </h4>
                                <span className="text-sm text-gray-500">@{contact.username}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${influenceLevel.color}`}>
                                  {influenceLevel.label} Influence
                                </span>
                                <div className="flex items-center gap-1">
                                  <Scale className="text-purple-600" size={14} />
                                  <span className="text-sm font-medium text-purple-600">{contact.influenceWeight}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${getTrustColor(contact.trustLevel)}`}>
                                  <Star size={14} />
                                  <span className="text-sm capitalize">{contact.trustLevel}</span>
                                </div>
                                {contact.isActive ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Inactive
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-1">
                                  {contact.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail size={14} />
                                      {contact.email}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Award size={14} />
                                    <span className="capitalize">{contact.role}</span>
                                  </div>
                                  {contact.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <MapPin size={14} />
                                      {contact.location}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageSquare size={14} />
                                    {contact.totalMessages} messages
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingUp size={14} />
                                    Interaction: {contact.interactionScore}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Activity size={14} />
                                    Last seen {formatTimeAgo(contact.lastSeen)}
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">Decision Areas:</div>
                                <div className="flex flex-wrap gap-2">
                                  {contact.decisionAreas.map((area, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">Primary Topics:</div>
                                <div className="flex flex-wrap gap-2">
                                  {contact.primaryTopics.map((topic, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {selectedContact === contact.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3">Recent Conversations</h5>
                                      <div className="space-y-3">
                                        {contact.conversationHistory.map((conv, index) => (
                                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                              <div className="font-medium text-sm text-gray-900">{conv.topic}</div>
                                              <div className="text-xs text-gray-500">
                                                {conv.messageCount} messages • {formatTimeAgo(conv.date)}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${
                                                conv.sentiment === 'positive' ? 'bg-green-500' :
                                                conv.sentiment === 'negative' ? 'bg-red-500' :
                                                'bg-yellow-500'
                                              }`}></span>
                                              <span className="text-xs text-gray-500 capitalize">{conv.sentiment}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3">Influence Configuration</h5>
                                      <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                          <div className="text-sm font-medium text-gray-900 mb-2">Influence Weight</div>
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="range"
                                              min="0"
                                              max="100"
                                              value={contact.influenceWeight}
                                              className="flex-1"
                                              disabled={editingInfluence !== contact.id}
                                            />
                                            <span className="w-12 text-sm font-medium">{contact.influenceWeight}</span>
                                            <button
                                              onClick={() => setEditingInfluence(editingInfluence === contact.id ? null : contact.id)}
                                              className={`px-2 py-1 text-xs rounded ${
                                                editingInfluence === contact.id
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-blue-100 text-blue-700'
                                              }`}
                                            >
                                              {editingInfluence === contact.id ? 'Save' : 'Edit'}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                          <div className="text-sm font-medium text-gray-900">Trust Level</div>
                                          <div className={`text-sm ${getTrustColor(contact.trustLevel)} capitalize`}>
                                            {contact.trustLevel}
                                          </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                          <div className="text-sm font-medium text-gray-900">Communication Style</div>
                                          <div className="text-sm text-gray-600 capitalize">{contact.preferences.communicationStyle}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedContact(selectedContact === contact.id ? null : contact.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Eye size={14} />
                              {selectedContact === contact.id ? 'Hide Details' : 'View Details'}
                              {selectedContact === contact.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors">
                              <MessageCircle size={14} />
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bot Controls - {currentBot?.name}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigateToTab('bots')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Settings size={14} />
                    Advanced Config
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleBotAction('start')}
                  disabled={currentBot?.status === 'running'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={16} />
                  Start Bot
                </button>
                <button
                  onClick={() => handleBotAction('stop')}
                  disabled={currentBot?.status === 'stopped'}
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
                      {currentBotContacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} (@{contact.username})
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