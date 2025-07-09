import React from 'react'
import { AlertCircle, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react'
import { IdeaTable } from './components/IdeaTable'
import { StatsCard } from './components/StatsCard'
import { useIdeaStore } from './hooks/useIdeaStore'

const App: React.FC = () => {
  const { connection, ideas, stats, loading, initializeStore, deleteIdea, refresh } = useIdeaStore()

  const handleDisconnect = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 rounded-lg">
                <Lightbulb className="w-6 h-6 text-white" />
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Guild.xyz Strategic Intelligence</h1>
                <p className="text-sm text-gray-600 mt-1">CEO Strategic Decision Making & Enterprise Sales Dashboard</p>
              </div>
            </div>
            
            {connection.isConnected && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected to Strategic Hub</span>
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
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Strategic Intelligence Connection Error
                </h3>
                <p className="mt-2 text-sm text-red-700">{connection.error}</p>
              </div>
            </div>
          </div>
        )}

        {!connection.isConnected ? (
          <div className="py-12">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-2 mb-6">
                <Lightbulb className="w-20 h-20 text-blue-600" />
                <TrendingUp className="w-20 h-20 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connecting to Strategic Intelligence Hub
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                {connection.connecting ? 
                  'Establishing secure connection to your strategic idea repository and business intelligence backend...' : 
                  'Unable to connect to the strategic intelligence backend. Please ensure the system is running and accessible.'
                }
              </p>
              {!connection.connecting && (
                <button
                  onClick={initializeStore}
                  className="mt-6 px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Strategic Overview</h2>
              <StatsCard stats={stats} ideas={ideas} />
            </div>
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Strategic Ideas & Business Intelligence</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage strategic initiatives, product decisions, and enterprise sales insights
                </p>
              </div>
              <IdeaTable
                ideas={ideas}
                loading={loading}
                onDelete={deleteIdea}
                onRefresh={refresh}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Guild.xyz Strategic Intelligence Dashboard - Empowering strategic decision making for 6M+ users platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App 