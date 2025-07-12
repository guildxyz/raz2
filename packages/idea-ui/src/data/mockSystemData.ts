export interface SystemStatus {
  bot: {
    status: string
    uptime: string
    lastActivity: string
  }
  database: {
    status: string
    latency: string
    connections: number
  }
  claude: {
    status: string
    tokensUsed: number
    requestsToday: number
  }
  webServer: {
    status: string
    port: number
    requests: number
  }
}

export const mockSystemStatus: SystemStatus = {
  bot: { 
    status: 'running', 
    uptime: '2h 15m', 
    lastActivity: '2 minutes ago' 
  },
  database: { 
    status: 'connected', 
    latency: '15ms', 
    connections: 3 
  },
  claude: { 
    status: 'active', 
    tokensUsed: 45230, 
    requestsToday: 127 
  },
  webServer: { 
    status: 'running', 
    port: 3000, 
    requests: 1439 
  }
} 