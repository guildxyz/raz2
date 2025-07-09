import { useState, useEffect, useCallback } from 'react'
import type { MemoryDisplayRow, MemoryStoreStats, MemoryStoreConnection } from '../types'

export const useMemoryStore = (apiBaseUrl: string = '/api') => {
  const [connection, setConnection] = useState<MemoryStoreConnection>({
    isConnected: false,
    error: null,
    connecting: false
  })
  const [memories, setMemories] = useState<MemoryDisplayRow[]>([])
  const [stats, setStats] = useState<MemoryStoreStats>({ count: 0, indexSize: 0 })
  const [loading, setLoading] = useState(false)

  const checkConnection = useCallback(async () => {
    if (connection.connecting) return

    setConnection(prev => ({ ...prev, connecting: true, error: null }))
    
    try {
      const response = await fetch(`${apiBaseUrl}/health`)
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      
      setConnection({
        isConnected: true,
        error: null,
        connecting: false
      })
    } catch (error) {
      setConnection({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Failed to connect to API',
        connecting: false
      })
    }
  }, [apiBaseUrl, connection.connecting])

  const loadMemories = useCallback(async (filter?: any) => {
    if (!connection.isConnected) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter?.userId) params.append('userId', filter.userId)
      if (filter?.category) params.append('category', filter.category)
      if (filter?.chatId) params.append('chatId', filter.chatId.toString())
      params.append('limit', '1000')

      const response = await fetch(`${apiBaseUrl}/memories?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load memories: ${response.status}`)
      }
      
      const memoryList = await response.json()
      const displayRows: MemoryDisplayRow[] = memoryList.map((memory: any) => ({
        id: memory.id,
        content: memory.content,
        category: memory.metadata.category || 'uncategorized',
        importance: memory.metadata.importance || 1,
        tags: memory.metadata.tags || [],
        userId: memory.metadata.userId,
        chatId: memory.metadata.chatId,
        createdAt: new Date(memory.createdAt),
        updatedAt: new Date(memory.updatedAt)
      }))
      
      setMemories(displayRows)
    } catch (error) {
      console.error('Failed to load memories:', error)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, connection.isConnected])

  const loadStats = useCallback(async () => {
    if (!connection.isConnected) return

    try {
      const response = await fetch(`${apiBaseUrl}/memories/stats`)
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`)
      }
      
      const storeStats = await response.json()
      setStats(storeStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [apiBaseUrl, connection.isConnected])

  const deleteMemory = useCallback(async (id: string) => {
    if (!connection.isConnected) return false

    try {
      const response = await fetch(`${apiBaseUrl}/memories/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setMemories(prev => prev.filter(memory => memory.id !== id))
        await loadStats()
      }
      return result.success
    } catch (error) {
      console.error('Failed to delete memory:', error)
      return false
    }
  }, [apiBaseUrl, connection.isConnected, loadStats])

  const refresh = useCallback(async () => {
    await Promise.all([loadMemories(), loadStats()])
  }, [loadMemories, loadStats])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    if (connection.isConnected) {
      refresh()
    }
  }, [connection.isConnected, refresh])

  return {
    connection,
    memories,
    stats,
    loading,
    initializeStore: checkConnection,
    loadMemories,
    deleteMemory,
    refresh
  }
} 