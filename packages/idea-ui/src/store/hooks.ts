import { useAtom } from 'jotai'
import {
  ideasAtom,
  loadingAtom,
  errorAtom,
  createIdeaAtom,
  updateIdeaAtom,
  deleteIdeaAtom,
  refreshIdeasAtom,
  updateSubtaskAtom,
  createSubtaskAtom,
  deleteSubtaskAtom
} from './atoms'

export const useIdeas = () => {
  const [ideas] = useAtom(ideasAtom)
  const [loading] = useAtom(loadingAtom)
  const [error] = useAtom(errorAtom)
  
  return { ideas, loading, error }
}

export const useIdeaActions = () => {
  const [, createIdea] = useAtom(createIdeaAtom)
  const [, updateIdea] = useAtom(updateIdeaAtom)
  const [, deleteIdea] = useAtom(deleteIdeaAtom)
  const [, refreshIdeas] = useAtom(refreshIdeasAtom)
  
  return { createIdea, updateIdea, deleteIdea, refreshIdeas }
}

export const useSubtaskActions = () => {
  const [, updateSubtask] = useAtom(updateSubtaskAtom)
  const [, createSubtask] = useAtom(createSubtaskAtom)
  const [, deleteSubtask] = useAtom(deleteSubtaskAtom)
  
  return { updateSubtask, createSubtask, deleteSubtask }
}

export const useIdeaStore = () => {
  const { ideas, loading, error } = useIdeas()
  const { createIdea, updateIdea, deleteIdea, refreshIdeas } = useIdeaActions()
  const { updateSubtask, createSubtask, deleteSubtask } = useSubtaskActions()
  
  return {
    ideas,
    loading,
    error,
    createIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas,
    updateSubtask: (ideaId: string, subtaskId: string, updates: any) => 
      updateSubtask({ ideaId, subtaskId, updates }),
    createSubtask: (ideaId: string, subtask: any) => 
      createSubtask({ ideaId, subtask }),
    deleteSubtask: (ideaId: string, subtaskId: string) => 
      deleteSubtask({ ideaId, subtaskId })
  }
} 