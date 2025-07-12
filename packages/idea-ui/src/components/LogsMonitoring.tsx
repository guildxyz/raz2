import { useState, useEffect } from 'react'
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Bot,
  Server,
  Terminal,
  Trash2,
  Play,
  Pause,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  source: 'telegram-bot' | 'idea-store' | 'claude-api' | 'web-server' | 'database'
  category: string
  message: string
  details?: any
  userId?: string
  chatId?: number
  duration?: number
  stackTrace?: string
}

interface LogFilter {
  level: string[]
  source: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  searchTerm: string
}

export const LogsMonitoring = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [isRealTime, setIsRealTime] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  
  const [filter, setFilter] = useState<LogFilter>({
    level: [],
    source: [],
    dateRange: { start: null, end: null },
    searchTerm: ''
  })

  const logLevels = [
    { id: 'debug', label: 'Debug', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'info', label: 'Info', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 'warn', label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'error', label: 'Error', color: 'text-red-600', bgColor: 'bg-red-100' },
    { id: 'fatal', label: 'Fatal', color: 'text-red-800', bgColor: 'bg-red-200' }
  ]

  const logSources = [
    { id: 'telegram-bot', label: 'Telegram Bot', icon: Bot, color: 'text-blue-600' },
    { id: 'idea-store', label: 'Idea Store', icon: Database, color: 'text-green-600' },
    { id: 'claude-api', label: 'Claude API', icon: Zap, color: 'text-purple-600' },
    { id: 'web-server', label: 'Web Server', icon: Server, color: 'text-orange-600' },
    { id: 'database', label: 'Database', icon: Database, color: 'text-indigo-600' }
  ]

  const [sampleLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      level: 'info',
      source: 'telegram-bot',
      category: 'message_processing',
      message: 'Processing new message from user',
      details: {
        userId: '123456789',
        username: 'razvan',
        messageLength: 47,
        messageType: 'text'
      },
      userId: '123456789',
      chatId: 456,
      duration: 245
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      level: 'error',
      source: 'claude-api',
      category: 'api_request',
      message: 'Claude API request failed with timeout',
      details: {
        requestId: 'req_abc123',
        timeout: 30000,
        retryAttempt: 1
      },
      stackTrace: 'Error: Request timeout\n  at ApiClient.request (claude-api.js:145)\n  at async processMessage (bot.js:89)'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      level: 'info',
      source: 'idea-store',
      category: 'database',
      message: 'Successfully created new idea with vector embedding',
      details: {
        ideaId: 'idea_xyz789',
        embeddingDimension: 1536,
        vectorSimilarity: 0.92
      },
      duration: 156
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      level: 'warn',
      source: 'web-server',
      category: 'performance',
      message: 'Slow response time detected for dashboard request',
      details: {
        path: '/analytics',
        responseTime: 2500,
        threshold: 2000
      },
      duration: 2500
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      level: 'debug',
      source: 'database',
      category: 'query',
      message: 'Executing vector similarity search',
      details: {
        query: 'SELECT *, 1 - (embedding <=> $1) as similarity FROM ideas ORDER BY similarity DESC LIMIT 5',
        executionTime: 23,
        resultCount: 5
      },
      duration: 23
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 18 * 60 * 1000),
      level: 'info',
      source: 'telegram-bot',
      category: 'startup',
      message: 'Bot started successfully',
      details: {
        botId: '7842156789',
        username: 'raz2_bot',
        features: ['idea_management', 'claude_integration', 'vector_search']
      }
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      level: 'error',
      source: 'idea-store',
      category: 'database',
      message: 'Failed to connect to PostgreSQL database',
      details: {
        error: 'connection refused',
        host: 'localhost',
        port: 5432,
        database: 'raz2_db'
      },
      stackTrace: 'ConnectionError: connection refused\n  at DatabaseClient.connect (db.js:67)\n  at IdeaStore.initialize (idea-store.js:34)'
    }
  ])

  useEffect(() => {
    setLogs(sampleLogs)
    setFilteredLogs(sampleLogs)
  }, [])

  useEffect(() => {
    let filtered = logs

    if (filter.level.length > 0) {
      filtered = filtered.filter(log => filter.level.includes(log.level))
    }

    if (filter.source.length > 0) {
      filtered = filtered.filter(log => filter.source.includes(log.source))
    }

    if (filter.searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        (log.userId && log.userId.includes(filter.searchTerm)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(filter.searchTerm.toLowerCase()))
      )
    }

    if (filter.dateRange.start && filter.dateRange.end) {
      filtered = filtered.filter(log =>
        log.timestamp >= filter.dateRange.start! && log.timestamp <= filter.dateRange.end!
      )
    }

    setFilteredLogs(filtered)
  }, [logs, filter])

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug': return <Terminal className="text-gray-600" size={16} />
      case 'info': return <CheckCircle className="text-blue-600" size={16} />
      case 'warn': return <AlertCircle className="text-yellow-600" size={16} />
      case 'error': 
      case 'fatal': return <AlertCircle className="text-red-600" size={16} />
      default: return <Clock className="text-gray-600" size={16} />
    }
  }

  const getSourceIcon = (source: string) => {
    const sourceConfig = logSources.find(s => s.id === source)
    if (!sourceConfig) return <FileText className="text-gray-600" size={16} />
    const Icon = sourceConfig.icon
    return <Icon className={sourceConfig.color} size={16} />
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${diffHours}h ago`
  }

  const copyLogDetails = (log: LogEntry) => {
    const logData = {
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      source: log.source,
      category: log.category,
      message: log.message,
      details: log.details,
      stackTrace: log.stackTrace
    }
    navigator.clipboard.writeText(JSON.stringify(logData, null, 2))
  }

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Source,Category,Message,Duration,UserId,ChatId',
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.source,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.duration || '',
        log.userId || '',
        log.chatId || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raz2_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      setLogs([])
      setFilteredLogs([])
    }
  }

  const refreshLogs = () => {
    console.log('Refreshing logs...')
    // In real implementation, this would fetch fresh logs from the server
  }

  const toggleLevelFilter = (levelId: string) => {
    setFilter(prev => ({
      ...prev,
      level: prev.level.includes(levelId)
        ? prev.level.filter(l => l !== levelId)
        : [...prev.level, levelId]
    }))
  }

  const toggleSourceFilter = (sourceId: string) => {
    setFilter(prev => ({
      ...prev,
      source: prev.source.includes(sourceId)
        ? prev.source.filter(s => s !== sourceId)
        : [...prev.source, sourceId]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
          <p className="text-gray-600">Monitor system events, errors, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isRealTime
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isRealTime ? <Pause size={16} /> : <Play size={16} />}
            {isRealTime ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={refreshLogs}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search logs by message, category, user ID..."
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredLogs.length} of {logs.length} logs
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Levels:</span>
                {logLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => toggleLevelFilter(level.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      filter.level.includes(level.id)
                        ? `${level.bgColor} ${level.color}`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sources:</span>
                {logSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => toggleSourceFilter(source.id)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                      filter.source.includes(source.id)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <source.icon size={12} />
                    {source.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id)
                const levelConfig = logLevels.find(l => l.id === log.level)
                
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleLogExpansion(log.id)}
                        className="mt-1 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getLevelIcon(log.level)}
                          {getSourceIcon(log.source)}
                          <span className={`px-2 py-1 text-xs rounded-md ${levelConfig?.bgColor} ${levelConfig?.color}`}>
                            {levelConfig?.label}
                          </span>
                          <span className="text-xs text-gray-500">{log.category}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</span>
                          {log.duration && (
                            <span className="text-xs text-gray-500">{log.duration}ms</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          {log.userId && <span>User: {log.userId}</span>}
                          {log.chatId && <span>Chat: {log.chatId}</span>}
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {log.details && (
                              <div className="bg-gray-100 rounded-md p-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Details</h5>
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.stackTrace && (
                              <div className="bg-red-50 rounded-md p-3">
                                <h5 className="text-sm font-medium text-red-900 mb-2">Stack Trace</h5>
                                <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                  {log.stackTrace}
                                </pre>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyLogDetails(log)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                <Copy size={12} />
                                Copy
                              </button>
                              {log.userId && (
                                <button className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300">
                                  <ExternalLink size={12} />
                                  View User
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 