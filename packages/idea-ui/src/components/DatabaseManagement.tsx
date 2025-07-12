import { useState, useEffect } from 'react'
import { 
  Database, 
  Table, 
  Search, 
  RefreshCw, 
  Download,
  Upload,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Settings,
  Terminal,
  FileText,
  Zap
} from 'lucide-react'

interface TableInfo {
  name: string
  rowCount: number
  sizeBytes: number
  lastUpdated: Date
  schema: string
}

interface Migration {
  id: string
  name: string
  description: string
  status: 'pending' | 'applied' | 'failed'
  appliedAt?: Date
  executionTime?: number
}

interface DatabaseStats {
  totalSize: string
  totalTables: number
  totalRows: number
  vectorEmbeddings: number
  indexSize: string
  connectionPool: {
    active: number
    idle: number
    waiting: number
  }
  performance: {
    avgQueryTime: string
    slowQueries: number
    cacheHitRate: string
  }
}

export const DatabaseManagement = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'migrations' | 'vectors' | 'queries'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const [dbStats] = useState<DatabaseStats>({
    totalSize: '1.2 GB',
    totalTables: 3,
    totalRows: 1247,
    vectorEmbeddings: 1247,
    indexSize: '45 MB',
    connectionPool: {
      active: 3,
      idle: 2,
      waiting: 0
    },
    performance: {
      avgQueryTime: '15ms',
      slowQueries: 2,
      cacheHitRate: '98.5%'
    }
  })

  const [tables] = useState<TableInfo[]>([
    {
      name: 'ideas',
      rowCount: 1247,
      sizeBytes: 1024 * 1024 * 800,
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
      schema: 'public'
    },
    {
      name: 'reminders',
      rowCount: 234,
      sizeBytes: 1024 * 1024 * 50,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      schema: 'public'
    },
    {
      name: 'drizzle_migrations',
      rowCount: 5,
      sizeBytes: 1024 * 10,
      lastUpdated: new Date('2024-07-09'),
      schema: 'drizzle'
    }
  ])

  const [migrations] = useState<Migration[]>([
    {
      id: '20250709192049',
      name: 'serious_nekra',
      description: 'Add pgvector extension',
      status: 'applied',
      appliedAt: new Date('2024-07-09T19:20:49Z'),
      executionTime: 245
    },
    {
      id: '20250709192039',
      name: 'quiet_mauler',
      description: 'Create ideas and reminders tables with vector embeddings',
      status: 'applied',
      appliedAt: new Date('2024-07-09T19:20:39Z'),
      executionTime: 189
    }
  ])

  const [vectorStats] = useState({
    totalVectors: 1247,
    dimension: 1536,
    indexType: 'hnsw',
    indexParameters: { m: 16, ef_construction: 64 },
    avgSimilarityScore: 0.85,
    searchPerformance: '12ms avg'
  })

  const [recentQueries] = useState([
    { 
      id: '1', 
      query: 'SELECT * FROM ideas WHERE category = $1 ORDER BY created_at DESC LIMIT 10',
      duration: '8ms',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      status: 'success'
    },
    {
      id: '2',
      query: 'SELECT *, 1 - (embedding <=> $1) as similarity FROM ideas ORDER BY similarity DESC LIMIT 5',
      duration: '23ms',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'success'
    },
    {
      id: '3',
      query: 'INSERT INTO ideas (title, content, embedding) VALUES ($1, $2, $3)',
      duration: '15ms',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      status: 'success'
    }
  ])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
      case 'applied':
      case 'success':
        return <CheckCircle className="text-green-600" size={16} />
      case 'pending':
        return <Clock className="text-yellow-600" size={16} />
      case 'failed':
      case 'error':
        return <AlertCircle className="text-red-600" size={16} />
      default:
        return <Clock className="text-gray-600" size={16} />
    }
  }

  const handleTableAction = (action: 'view' | 'backup' | 'truncate', tableName: string) => {
    console.log(`${action} action for table:`, tableName)
  }

  const handleMigrationAction = (action: 'run' | 'rollback', migrationId: string) => {
    console.log(`${action} migration:`, migrationId)
  }

  const handleDatabaseAction = (action: 'backup' | 'restore' | 'vacuum' | 'analyze') => {
    console.log('Database action:', action)
  }

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dbStats.totalSize}</p>
            </div>
            <Database className="text-blue-600" size={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4">Index Size: {dbStats.indexSize}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dbStats.totalRows.toLocaleString()}</p>
            </div>
            <Table className="text-green-600" size={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4">Across {dbStats.totalTables} tables</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vector Embeddings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dbStats.vectorEmbeddings.toLocaleString()}</p>
            </div>
            <Zap className="text-purple-600" size={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4">1536 dimensions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Query Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dbStats.performance.avgQueryTime}</p>
            </div>
            <BarChart3 className="text-orange-600" size={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4">Cache hit: {dbStats.performance.cacheHitRate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Pool</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-semibold">{dbStats.connectionPool.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Idle Connections</span>
              <span className="text-sm font-semibold">{dbStats.connectionPool.idle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Waiting Connections</span>
              <span className="text-sm font-semibold">{dbStats.connectionPool.waiting}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDatabaseAction('backup')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={16} />
              Backup
            </button>
            <button
              onClick={() => handleDatabaseAction('vacuum')}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <RefreshCw size={16} />
              Vacuum
            </button>
            <button
              onClick={() => handleDatabaseAction('analyze')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              <BarChart3 size={16} />
              Analyze
            </button>
            <button
              onClick={() => handleDatabaseAction('restore')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <Upload size={16} />
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'tables'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tables
              </button>
              <button
                onClick={() => setActiveTab('migrations')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'migrations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Migrations
              </button>
              <button
                onClick={() => setActiveTab('vectors')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'vectors'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Vector Index
              </button>
              <button
                onClick={() => setActiveTab('queries')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'queries'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Query Log
              </button>
            </div>
            
            {activeTab === 'tables' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}

          {activeTab === 'tables' && (
            <div className="space-y-4">
              {filteredTables.map((table) => (
                <div key={table.name} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Table className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{table.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{table.rowCount.toLocaleString()} rows</span>
                          <span>{formatBytes(table.sizeBytes)}</span>
                          <span>Updated {formatTimeAgo(table.lastUpdated)}</span>
                          <span>Schema: {table.schema}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTableAction('view', table.name)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleTableAction('backup', table.name)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleTableAction('truncate', table.name)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'migrations' && (
            <div className="space-y-4">
              {migrations.map((migration) => (
                <div key={migration.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 rounded-full p-2">
                        <FileText className="text-purple-600" size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{migration.name}</h4>
                          {getStatusIcon(migration.status)}
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            migration.status === 'applied' 
                              ? 'bg-green-100 text-green-800'
                              : migration.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {migration.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{migration.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>ID: {migration.id}</span>
                          {migration.appliedAt && (
                            <span>Applied: {migration.appliedAt.toLocaleDateString()}</span>
                          )}
                          {migration.executionTime && (
                            <span>Execution: {migration.executionTime}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {migration.status === 'pending' && (
                        <button
                          onClick={() => handleMigrationAction('run', migration.id)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Run
                        </button>
                      )}
                      {migration.status === 'applied' && (
                        <button
                          onClick={() => handleMigrationAction('rollback', migration.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'vectors' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="text-purple-600" size={20} />
                    <h3 className="font-medium text-gray-900">Vector Stats</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Vectors:</span>
                      <span className="font-medium">{vectorStats.totalVectors.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">{vectorStats.dimension}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Index Type:</span>
                      <span className="font-medium uppercase">{vectorStats.indexType}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="text-blue-600" size={20} />
                    <h3 className="font-medium text-gray-900">Index Config</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">M:</span>
                      <span className="font-medium">{vectorStats.indexParameters.m}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EF Construction:</span>
                      <span className="font-medium">{vectorStats.indexParameters.ef_construction}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-green-600" size={20} />
                    <h3 className="font-medium text-gray-900">Performance</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Similarity:</span>
                      <span className="font-medium">{vectorStats.avgSimilarityScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Time:</span>
                      <span className="font-medium">{vectorStats.searchPerformance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Queries</h3>
                <span className="text-sm text-gray-500">{recentQueries.length} queries</span>
              </div>
              {recentQueries.map((query) => (
                <div key={query.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-gray-100 rounded-full p-2">
                        <Terminal className="text-gray-600" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(query.status)}
                          <span className="text-sm font-medium text-gray-900">
                            Query #{query.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(query.timestamp)}
                          </span>
                        </div>
                        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                          {query.query}
                        </code>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{query.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 