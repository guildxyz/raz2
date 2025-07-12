import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, Subtask, KanbanColumn } from '../types'
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

export const ideasAtom = atomWithStorage<Idea[]>('strategic-ideas', [])
export const loadingAtom = atom<boolean>(false)
export const errorAtom = atom<string | null>(null)

export const createIdeaAtom = atom(
  null,
  async (_get, set, input: CreateIdeaInput) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
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
      set(ideasAtom, prev => [newIdea, ...prev])
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
      
      set(ideasAtom, prev => [newIdea, ...prev])
    } finally {
      set(loadingAtom, false)
    }
  }
)

export const updateIdeaAtom = atom(
  null,
  async (_get, set, input: UpdateIdeaInput) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
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
      set(ideasAtom, prev => prev.map(idea => 
        idea.id === input.id ? updatedIdea : idea
      ))
    } catch (err) {
      console.warn('API not available, updating locally:', err)
      
      set(ideasAtom, prev => prev.map(idea => {
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

            set(ideasAtom, prevIdeas => prevIdeas.map(prevIdea => 
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
      set(loadingAtom, false)
    }
  }
)

export const updateSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtaskId, updates }: { ideaId: string, subtaskId: string, updates: Partial<Subtask> }) => {
    set(ideasAtom, prev => prev.map(idea => {
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
  }
)

export const createSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtask }: { ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'> }) => {
    const newSubtask: Subtask = {
      ...subtask,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    set(ideasAtom, prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = [...idea.subtasks, newSubtask]
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }
)

export const deleteSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtaskId }: { ideaId: string, subtaskId: string }) => {
    set(ideasAtom, prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = idea.subtasks.filter(s => s.id !== subtaskId)
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }
)

export const deleteIdeaAtom = atom(
  null,
  async (get, set, id: string) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${id}?userId=${ZAWIASA_USER_ID}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete idea: ${response.statusText}`)
      }
      
      set(ideasAtom, prev => prev.filter(idea => idea.id !== id))
    } catch (err) {
      set(errorAtom, err instanceof Error ? err.message : 'Failed to delete idea')
    } finally {
      set(loadingAtom, false)
    }
  }
)

export const refreshIdeasAtom = atom(
  null,
  async (get, set) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas?userId=${ZAWIASA_USER_ID}&limit=1000`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`)
      }
      
      const fetchedIdeas = await response.json()
      set(ideasAtom, fetchedIdeas.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
      })))
    } catch (err) {
      console.warn('API not available, using local storage:', err)
      set(errorAtom, null)
    } finally {
      set(loadingAtom, false)
    }
  }
) 