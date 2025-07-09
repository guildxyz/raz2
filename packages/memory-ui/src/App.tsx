import React from 'react'
import { AlertCircle, CheckCircle, Brain } from 'lucide-react'
import { MemoryTable } from './components/MemoryTable'
import { StatsCard } from './components/StatsCard'
import { useMemoryStore } from './hooks/useMemoryStore'

const App: React.FC = () => {
  const { connection, memories, stats, loading, initializeStore, deleteMemory, refresh } = useMemoryStore()

  const handleDisconnect = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Memory Store UI</h1>
            </div>
            
            {connection.isConnected && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {connection.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Connection Error</span>
            </div>
            <p className="mt-2 text-sm text-red-700">{connection.error}</p>
          </div>
        )}

        {!connection.isConnected ? (
          <div className="py-8">
            <div className="text-center mb-8">
              <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connecting to Memory Store
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {connection.connecting ? 
                  'Connecting to the memory store API...' : 
                  'Unable to connect to the memory store API. Please check that the server is running.'
                }
              </p>
              {!connection.connecting && (
                <button
                  onClick={initializeStore}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <StatsCard stats={stats} memories={memories} />
            <MemoryTable
              memories={memories}
              loading={loading}
              onDelete={deleteMemory}
              onRefresh={refresh}
            />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Memory Store UI - A modern interface for managing your memory data</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App 