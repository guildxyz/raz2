import { useState, useCallback } from 'react'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, Subtask, SubtaskStatus, KanbanColumn } from '../types'
import { aiTaskBreakdownService } from '../services/aiTaskBreakdown'

const API_BASE_URL = 'http://localhost:3000/api'
const ZAWIASA_USER_ID = 'raz'

const generateId = () => Math.random().toString(36).substr(2, 9)

const createKanbanColumns = (subtasks: Subtask[]): KanbanColumn[] => {
  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', subtasks: [] },
    { id: 'in_progress', title: 'In Progress', subtasks: [] },
    { id: 'review', title: 'Review', subtasks: [] },
    { id: 'done', title: 'Done', subtasks: [] }
  ]

  subtasks.forEach(subtask => {
    const column = columns.find(col => col.id === subtask.status)
    if (column) {
      column.subtasks.push(subtask)
    }
  })

  return columns
}

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
      console.warn('API not available, using AI breakdown locally:', err)
      
      const aiBreakdown = await aiTaskBreakdownService.breakdownIdea({
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium'
      })

      const subtasks: Subtask[] = aiBreakdown.subtasks.map(subtask => ({
        ...subtask,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const newIdea: Idea = {
        id: generateId(),
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium',
        status: 'active',
        tags: input.tags || [],
        userId: ZAWIASA_USER_ID,
        chatId: input.chatId,
        subtasks,
        kanbanColumns: createKanbanColumns(subtasks),
        aiBreakdown,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setIdeas(prev => [newIdea, ...prev])
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
      console.warn('API not available, updating locally:', err)
      
      setIdeas(prev => prev.map(idea => {
        if (idea.id !== input.id) return idea
        
        const updated = { 
          ...idea, 
          ...input, 
          updatedAt: new Date() 
        }

        if (input.regenerateSubtasks && input.title && input.content) {
          aiTaskBreakdownService.breakdownIdea({
            title: input.title,
            content: input.content,
            category: updated.category,
            priority: updated.priority
          }).then(aiBreakdown => {
            const newSubtasks: Subtask[] = aiBreakdown.subtasks.map(subtask => ({
              ...subtask,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date()
            }))

            setIdeas(prevIdeas => prevIdeas.map(prevIdea => 
              prevIdea.id === input.id ? {
                ...prevIdea,
                subtasks: newSubtasks,
                kanbanColumns: createKanbanColumns(newSubtasks),
                aiBreakdown
              } : prevIdea
            ))
          })
        } else if (input.subtasks) {
          updated.subtasks = input.subtasks
          updated.kanbanColumns = createKanbanColumns(input.subtasks)
        }

        return updated
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSubtask = useCallback(async (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = idea.subtasks.map(s => 
        s.id === subtaskId ? { ...s, ...updates, updatedAt: new Date() } : s
      )
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }, [])

  const createSubtask = useCallback(async (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSubtask: Subtask = {
      ...subtask,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = [...idea.subtasks, newSubtask]
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }, [])

  const deleteSubtask = useCallback(async (ideaId: string, subtaskId: string) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = idea.subtasks.filter(s => s.id !== subtaskId)
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
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
      console.warn('API not available, using demo data with kanban:', err)
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
          subtasks: [
            {
              id: 's1',
              title: 'Research and Analysis',
              description: 'Conduct market research and competitive analysis',
              status: 'in_progress',
              priority: 'high',
              estimatedHours: 8,
              tags: ['research', 'analysis'],
              dependencies: [],
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date('2024-01-16'),
            },
            {
              id: 's2',
              title: 'Stakeholder Alignment',
              description: 'Present findings and get stakeholder buy-in',
              status: 'todo',
              priority: 'high',
              estimatedHours: 4,
              tags: ['stakeholders', 'presentation'],
              dependencies: [],
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date('2024-01-15'),
            }
          ],
          kanbanColumns: [],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          title: 'AI-Powered Guild Member Engagement',
          content: 'Implement AI recommendations for guild activities, personalized member onboarding, and automated engagement campaigns.',
          category: 'product',
          priority: 'medium',
          status: 'in_progress',
          tags: ['ai', 'engagement', 'retention'],
          userId: 'raz',
          subtasks: [
            {
              id: 's3',
              title: 'User Research',
              description: 'Conduct user interviews and gather requirements',
              status: 'done',
              priority: 'high',
              estimatedHours: 12,
              tags: ['research', 'users'],
              dependencies: [],
              createdAt: new Date('2024-01-14'),
              updatedAt: new Date('2024-01-16'),
              completedAt: new Date('2024-01-16'),
            }
          ],
          kanbanColumns: [],
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-16'),
        }
      ]
      
      // Generate kanban columns for mock data
      const ideasWithKanban = mockIdeas.map(idea => ({
        ...idea,
        kanbanColumns: createKanbanColumns(idea.subtasks)
      }))
      
      setIdeas(ideasWithKanban)
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
    updateSubtask,
    createSubtask,
    deleteSubtask,
  }
} 