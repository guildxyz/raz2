import { useState, useCallback } from 'react'
import type { Idea, CreateIdeaInput, UpdateIdeaInput } from '../types'

const API_BASE_URL = 'http://localhost:3000/api'
const ZAWIASA_USER_ID = 'raz'

export const useIdeaStore = () => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createIdea = useCallback(async (input: CreateIdeaInput) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          userId: ZAWIASA_USER_ID,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create idea: ${response.statusText}`)
      }
      
      const newIdea = await response.json()
      setIdeas(prev => [newIdea, ...prev])
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
      const response = await fetch(`${API_BASE_URL}/ideas/${input.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update idea: ${response.statusText}`)
      }
      
      const updatedIdea = await response.json()
      setIdeas(prev => prev.map(idea => 
        idea.id === input.id ? updatedIdea : idea
      ))
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
      const response = await fetch(`${API_BASE_URL}/ideas/${id}?userId=${ZAWIASA_USER_ID}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete idea: ${response.statusText}`)
      }
      
      setIdeas(prev => prev.filter(idea => idea.id !== id))
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
      const response = await fetch(`${API_BASE_URL}/ideas?userId=${ZAWIASA_USER_ID}&limit=1000`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`)
      }
      
      const fetchedIdeas = await response.json()
      setIdeas(fetchedIdeas.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
      })))
    } catch (err) {
      console.warn('API not available, using demo data:', err)
      const mockIdeas: Idea[] = [
        {
          id: '1',
          title: 'Enterprise Multi-Guild Strategy',
          content: 'Develop a comprehensive strategy for enterprise clients to create and manage multiple guilds within their organization. Focus on hierarchical permissions, cross-guild analytics, and enterprise SSO integration.',
          category: 'strategy',
          priority: 'high',
          status: 'active',
          tags: ['enterprise', 'multi-guild', 'permissions'],
          userId: 'raz',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          title: 'AI-Powered Guild Member Engagement',
          content: 'Implement AI recommendations for guild activities, personalized member onboarding, and automated engagement campaigns. Could increase retention by 30% based on early tests.',
          category: 'product',
          priority: 'medium',
          status: 'in_progress',
          tags: ['ai', 'engagement', 'retention'],
          userId: 'raz',
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-16'),
        },
        {
          id: '3',
          title: 'Partnership with Discord for Guild Integration',
          content: 'Explore strategic partnership opportunities with Discord to provide native Guild.xyz integration within Discord servers.',
          category: 'partnerships',
          priority: 'high',
          status: 'active',
          tags: ['discord', 'integration', 'partnerships'],
          userId: 'raz',
          createdAt: new Date('2024-01-13'),
          updatedAt: new Date('2024-01-13'),
        }
      ]
      setIdeas(mockIdeas)
      setError(null)
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