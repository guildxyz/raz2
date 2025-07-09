import React, { useState } from 'react'
import { Settings, Eye, EyeOff } from 'lucide-react'
import type { MemoryStoreConfig } from '../types'

interface ConfigFormProps {
  config: MemoryStoreConfig
  onConfigChange: (config: MemoryStoreConfig) => void
  onConnect: () => void
  connecting: boolean
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onConfigChange,
  onConnect,
  connecting
}) => {
  const [showApiKey, setShowApiKey] = useState(false)
  const [localConfig, setLocalConfig] = useState(config)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfigChange(localConfig)
    onConnect()
  }

  const handleInputChange = (field: keyof MemoryStoreConfig, value: string | number) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Memory Store Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Redis URL
          </label>
          <input
            type="url"
            value={localConfig.redisUrl}
            onChange={(e) => handleInputChange('redisUrl', e.target.value)}
            placeholder="redis://localhost:6379"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Connection string for your Redis instance
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={localConfig.openaiApiKey}
              onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your OpenAI API key for generating embeddings
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Index Name
          </label>
          <input
            type="text"
            value={localConfig.indexName}
            onChange={(e) => handleInputChange('indexName', e.target.value)}
            placeholder="memory-index"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Name of the Redis search index
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Embedding Model
          </label>
          <select
            value={localConfig.embeddingModel}
            onChange={(e) => handleInputChange('embeddingModel', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text-embedding-3-small">text-embedding-3-small</option>
            <option value="text-embedding-3-large">text-embedding-3-large</option>
            <option value="text-embedding-ada-002">text-embedding-ada-002</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            OpenAI embedding model to use
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vector Dimension
          </label>
          <input
            type="number"
            value={localConfig.vectorDimension}
            onChange={(e) => handleInputChange('vectorDimension', parseInt(e.target.value))}
            min="1"
            max="3072"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Dimension of the embedding vectors (1536 for text-embedding-3-small, 3072 for text-embedding-3-large)
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Configuration will be saved in browser storage
          </div>
          <button
            type="submit"
            disabled={connecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connecting ? 'Connecting...' : 'Connect to Memory Store'}
          </button>
        </div>
      </form>
    </div>
  )
} 