import { useState, useEffect, useCallback } from 'react'
import type { IdeaDisplayRow, IdeaStoreStats, IdeaStoreConnection } from '../types'

export const useIdeaStore = () => {
  const [ideas, setIdeas] = useState<IdeaDisplayRow[]>([])
  const [stats, setStats] = useState<IdeaStoreStats>({ count: 0, indexSize: 0, categories: {} })
  const [connection, setConnection] = useState<IdeaStoreConnection>({
    isConnected: false,
    error: null,
    connecting: false
  })
  const [loading, setLoading] = useState(false)

  const initializeStore = useCallback(async () => {
    setConnection(prev => ({ ...prev, connecting: true, error: null }))
    
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        setConnection({ isConnected: true, error: null, connecting: false })
        await loadIdeas()
        await loadStats()
      } else {
        throw new Error('Strategic intelligence backend not available')
      }
    } catch (error) {
      setConnection({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Failed to connect to strategic intelligence system',
        connecting: false
      })
    }
  }, [])

  const loadIdeas = useCallback(async () => {
    if (!connection.isConnected) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/ideas')
      if (!response.ok) {
        throw new Error('Failed to load strategic ideas')
      }
      
      const data = await response.json()
      const transformedIdeas: IdeaDisplayRow[] = data.ideas.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
        hasReminders: idea.reminders && idea.reminders.length > 0
      }))
      
      setIdeas(transformedIdeas)
    } catch (error) {
      console.error('Failed to load strategic ideas:', error)
      setConnection(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load strategic ideas'
      }))
    } finally {
      setLoading(false)
    }
  }, [connection.isConnected])

  const loadStats = useCallback(async () => {
    if (!connection.isConnected) return
    
    try {
      const response = await fetch('/api/ideas/stats')
      if (!response.ok) {
        throw new Error('Failed to load strategic intelligence stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load strategic intelligence stats:', error)
    }
  }, [connection.isConnected])

  const deleteIdea = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete strategic idea')
      }
      
      setIdeas(prev => prev.filter(idea => idea.id !== id))
      await loadStats()
      return true
    } catch (error) {
      console.error('Failed to delete strategic idea:', error)
      return false
    }
  }, [loadStats])

  const refresh = useCallback(async () => {
    await Promise.all([loadIdeas(), loadStats()])
  }, [loadIdeas, loadStats])

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  return {
    ideas,
    stats,
    connection,
    loading,
    initializeStore,
    loadIdeas,
    loadStats,
    deleteIdea,
    refresh
  }
} 