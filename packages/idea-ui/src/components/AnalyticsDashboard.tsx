import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Lightbulb,
  Calendar,
  Clock,
  Target,
  Zap,
  Activity,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalIdeas: number
    totalMessages: number
    activeUsers: number
    avgResponseTime: number
    uptime: number
  }
  trends: {
    ideasGrowth: number
    messagesGrowth: number
    usersGrowth: number
    responseTimeChange: number
  }
  categoryDistribution: Array<{
    category: string
    count: number
    percentage: number
    color: string
  }>
  dailyActivity: Array<{
    date: string
    ideas: number
    messages: number
    users: number
  }>
  topUsers: Array<{
    id: string
    name: string
    username: string
    messageCount: number
    ideaCount: number
    lastActive: Date
  }>
  systemMetrics: {
    cpuUsage: number
    memoryUsage: number
    dbConnections: number
    vectorSearchAvgTime: number
    claudeApiCalls: number
    errorRate: number
  }
}

export const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeMetric, setActiveMetric] = useState<'ideas' | 'messages' | 'users'>('ideas')

  const [analytics] = useState<AnalyticsData>({
    overview: {
      totalIdeas: 1247,
      totalMessages: 3842,
      activeUsers: 12,
      avgResponseTime: 1.2,
      uptime: 99.8
    },
    trends: {
      ideasGrowth: 15.2,
      messagesGrowth: 23.8,
      usersGrowth: 8.5,
      responseTimeChange: -5.3
    },
    categoryDistribution: [
      { category: 'Strategy', count: 342, percentage: 27.4, color: 'bg-blue-500' },
      { category: 'Product', count: 298, percentage: 23.9, color: 'bg-green-500' },
      { category: 'Sales', count: 187, percentage: 15.0, color: 'bg-purple-500' },
      { category: 'Market', count: 156, percentage: 12.5, color: 'bg-orange-500' },
      { category: 'Team', count: 134, percentage: 10.7, color: 'bg-pink-500' },
      { category: 'Operations', count: 89, percentage: 7.1, color: 'bg-indigo-500' },
      { category: 'Partnerships', count: 41, percentage: 3.3, color: 'bg-yellow-500' }
    ],
    dailyActivity: [
      { date: '2024-01-01', ideas: 15, messages: 47, users: 3 },
      { date: '2024-01-02', ideas: 23, messages: 62, users: 5 },
      { date: '2024-01-03', ideas: 18, messages: 55, users: 4 },
      { date: '2024-01-04', ideas: 31, messages: 89, users: 7 },
      { date: '2024-01-05', ideas: 27, messages: 73, users: 6 },
      { date: '2024-01-06', ideas: 19, messages: 58, users: 4 },
      { date: '2024-01-07', ideas: 25, messages: 71, users: 5 }
    ],
    topUsers: [
      {
        id: '1',
        name: 'Razvan Cosma',
        username: 'razvan',
        messageCount: 847,
        ideaCount: 234,
        lastActive: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: '2',
        name: 'John Doe',
        username: 'john_doe',
        messageCount: 156,
        ideaCount: 89,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Sarah Miller',
        username: 'sarah_m',
        messageCount: 93,
        ideaCount: 45,
        lastActive: new Date(Date.now() - 15 * 60 * 1000)
      }
    ],
    systemMetrics: {
      cpuUsage: 23.5,
      memoryUsage: 68.2,
      dbConnections: 5,
      vectorSearchAvgTime: 12.3,
      claudeApiCalls: 1247,
      errorRate: 0.2
    }
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${diffHours}h ago`
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="text-green-600" size={16} />
    if (change < 0) return <ArrowDown className="text-red-600" size={16} />
    return <Minus className="text-gray-600" size={16} />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getMetricValue = (metric: 'ideas' | 'messages' | 'users', day: any) => {
    switch (metric) {
      case 'ideas': return day.ideas
      case 'messages': return day.messages
      case 'users': return day.users
      default: return 0
    }
  }

  const getMetricColor = (metric: 'ideas' | 'messages' | 'users') => {
    switch (metric) {
      case 'ideas': return 'bg-blue-500'
      case 'messages': return 'bg-green-500'
      case 'users': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const maxMetricValue = Math.max(...analytics.dailyActivity.map(day => getMetricValue(activeMetric, day)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">System performance and usage insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ideas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview.totalIdeas.toLocaleString()}</p>
            </div>
            <Lightbulb className="text-blue-600" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-4">
            {getTrendIcon(analytics.trends.ideasGrowth)}
            <span className={`text-sm font-medium ${getTrendColor(analytics.trends.ideasGrowth)}`}>
              {Math.abs(analytics.trends.ideasGrowth)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview.totalMessages.toLocaleString()}</p>
            </div>
            <MessageSquare className="text-green-600" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-4">
            {getTrendIcon(analytics.trends.messagesGrowth)}
            <span className={`text-sm font-medium ${getTrendColor(analytics.trends.messagesGrowth)}`}>
              {Math.abs(analytics.trends.messagesGrowth)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview.activeUsers}</p>
            </div>
            <Users className="text-purple-600" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-4">
            {getTrendIcon(analytics.trends.usersGrowth)}
            <span className={`text-sm font-medium ${getTrendColor(analytics.trends.usersGrowth)}`}>
              {Math.abs(analytics.trends.usersGrowth)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview.avgResponseTime}s</p>
            </div>
            <Clock className="text-orange-600" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-4">
            {getTrendIcon(analytics.trends.responseTimeChange)}
            <span className={`text-sm font-medium ${getTrendColor(analytics.trends.responseTimeChange)}`}>
              {Math.abs(analytics.trends.responseTimeChange)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview.uptime}%</p>
            </div>
            <Activity className="text-emerald-600" size={24} />
          </div>
          <div className="flex items-center gap-1 mt-4">
            <span className="text-xs text-gray-500">Excellent performance</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMetric('ideas')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeMetric === 'ideas' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Ideas
              </button>
              <button
                onClick={() => setActiveMetric('messages')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeMetric === 'messages' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveMetric('users')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeMetric === 'users' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Users
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.dailyActivity.map((day, index) => {
              const value = getMetricValue(activeMetric, day)
              const height = (value / maxMetricValue) * 200
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 rounded-t-md ${getMetricColor(activeMetric)}`}
                    style={{ height: `${height}px` }}
                    title={`${new Date(day.date).toLocaleDateString()}: ${value}`}
                  />
                  <span className="text-xs text-gray-500 transform -rotate-45">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
          <div className="space-y-4">
            {analytics.categoryDistribution.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <span className="text-sm text-gray-500">{category.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${category.color}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{category.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Users</h3>
          <div className="space-y-4">
            {analytics.topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">{user.messageCount} msgs</span>
                    <span className="text-gray-600">{user.ideaCount} ideas</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(user.lastActive)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CPU Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${analytics.systemMetrics.cpuUsage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.systemMetrics.cpuUsage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${analytics.systemMetrics.memoryUsage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.systemMetrics.memoryUsage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">DB Connections</span>
              <span className="text-sm font-medium">{analytics.systemMetrics.dbConnections}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vector Search Avg</span>
              <span className="text-sm font-medium">{analytics.systemMetrics.vectorSearchAvgTime}ms</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Claude API Calls</span>
              <span className="text-sm font-medium">{analytics.systemMetrics.claudeApiCalls.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-green-600">{analytics.systemMetrics.errorRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 