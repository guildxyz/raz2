import { useState, useCallback } from 'react'
import type { Idea, CreateIdeaInput, UpdateIdeaInput } from '../types'

const STORAGE_KEY = 'idea-manager-ideas'

const generateId = () => Math.random().toString(36).substr(2, 9)

const loadIdeasFromStorage = (): Idea[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveIdeasToStorage = (ideas: Idea[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
  } catch (error) {
    console.error('Failed to save ideas to localStorage:', error)
  }
}

export const useIdeaStore = () => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createIdea = useCallback(async (input: CreateIdeaInput) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newIdea: Idea = {
        id: generateId(),
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium',
        status: 'active',
        tags: input.tags || [],
        userId: input.userId,
        chatId: input.chatId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setIdeas(prev => {
        const updated = [newIdea, ...prev]
        saveIdeasToStorage(updated)
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateIdea = useCallback(async (input: UpdateIdeaInput) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setIdeas(prev => {
        const updated = prev.map(idea => 
          idea.id === input.id 
            ? { 
                ...idea, 
                ...input, 
                updatedAt: new Date() 
              } 
            : idea
        )
        saveIdeasToStorage(updated)
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update idea')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteIdea = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setIdeas(prev => {
        const updated = prev.filter(idea => idea.id !== id)
        saveIdeasToStorage(updated)
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete idea')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshIdeas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const stored = loadIdeasFromStorage()
      setIdeas(stored)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    ideas,
    loading,
    error,
    createIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas,
  }
} 