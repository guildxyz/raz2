import React from 'react'
import { TrendingUp, Lightbulb, Target, BarChart3, AlertCircle, CheckCircle } from 'lucide-react'
import type { IdeaStoreStats, IdeaDisplayRow } from '../types'

interface StatsCardProps {
  stats: IdeaStoreStats
  ideas: IdeaDisplayRow[]
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, ideas }) => {
  const uniqueCategories = new Set(ideas.map(i => i.category)).size
  const totalTags = new Set(ideas.flatMap(i => i.tags)).size
  
  const recentIdeas = ideas.filter(i => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return i.createdAt > sevenDaysAgo
  }).length

  const urgentIdeas = ideas.filter(i => i.priority === 'urgent').length
  const highPriorityIdeas = ideas.filter(i => i.priority === 'high').length
  const activeIdeas = ideas.filter(i => i.status === 'active').length
  const completedIdeas = ideas.filter(i => i.status === 'completed').length

  const categoryBreakdown = ideas.reduce((acc, idea) => {
    acc[idea.category] = (acc[idea.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  const statItems = [
    {
      icon: Lightbulb,
      label: 'Strategic Ideas',
      value: stats.count.toLocaleString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total strategic insights captured'
    },
    {
      icon: Target,
      label: 'High Priority',
      value: (urgentIdeas + highPriorityIdeas).toString(),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Urgent + high priority initiatives'
    },
    {
      icon: TrendingUp,
      label: 'Active Ideas',
      value: activeIdeas.toString(),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Currently active strategic initiatives'
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: completedIdeas.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Successfully executed ideas'
    }
  ]

  const insightItems = [
    { 
      label: 'Strategic Focus Areas', 
      value: uniqueCategories,
      description: 'Different business domains covered'
    },
    { 
      label: 'Recent Activity (7d)', 
      value: recentIdeas,
      description: 'New strategic insights this week'
    },
    { 
      label: 'Strategic Tags', 
      value: totalTags,
      description: 'Unique strategic themes and topics'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Strategic Focus Distribution</h3>
          </div>
          
          <div className="space-y-4">
            {topCategories.map(([category, count]) => {
              const percentage = ((count / ideas.length) * 100).toFixed(1)
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count} ideas</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strategic Analytics */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Strategic Intelligence Metrics</h3>
          </div>
          
          <div className="space-y-4">
            {insightItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Alert */}
      {urgentIdeas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {urgentIdeas} urgent strategic {urgentIdeas === 1 ? 'initiative' : 'initiatives'} requiring immediate attention
              </p>
              <p className="text-xs text-red-600">Review and prioritize these critical strategic items</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 