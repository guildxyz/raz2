import React from 'react'
import { Database, HardDrive, Clock, Users } from 'lucide-react'
import type { MemoryStoreStats, MemoryDisplayRow } from '../types'

interface StatsCardProps {
  stats: MemoryStoreStats
  memories: MemoryDisplayRow[]
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, memories }) => {
  const uniqueUsers = new Set(memories.map(m => m.userId).filter(Boolean)).size
  const uniqueCategories = new Set(memories.map(m => m.category)).size
  const totalTags = new Set(memories.flatMap(m => m.tags)).size
  
  const recentMemories = memories.filter(m => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return m.createdAt > oneDayAgo
  }).length

  const averageImportance = memories.length > 0 
    ? (memories.reduce((sum, m) => sum + m.importance, 0) / memories.length).toFixed(1)
    : '0'

  const statItems = [
    {
      icon: Database,
      label: 'Total Memories',
      value: stats.count.toLocaleString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: HardDrive,
      label: 'Index Size',
      value: `${stats.indexSize} MB`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Users,
      label: 'Unique Users',
      value: uniqueUsers.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Clock,
      label: 'Recent (24h)',
      value: recentMemories.toString(),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const detailItems = [
    { label: 'Categories', value: uniqueCategories },
    { label: 'Unique Tags', value: totalTags },
    { label: 'Avg Importance', value: averageImportance }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Memory Store Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className={`p-3 rounded-full ${item.bgColor} mr-4`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {detailItems.map((item) => (
          <div key={item.label} className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{item.label}</p>
            <p className="text-xl font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 