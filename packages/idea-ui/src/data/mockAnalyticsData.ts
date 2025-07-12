export interface AnalyticsData {
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

export const mockAnalyticsData: AnalyticsData = {
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
} 