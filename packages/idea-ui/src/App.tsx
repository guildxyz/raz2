import { useState, useEffect } from 'react'
import { Lightbulb, AlertCircle } from 'lucide-react'
import { IdeaList } from './components/IdeaList'
import { IdeaForm } from './components/IdeaForm'
import { useIdeaStore } from './hooks/useIdeaStore'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaStatus } from './types'

export default function App() {
  const { ideas, loading, error, createIdea, updateIdea, deleteIdea, refreshIdeas } = useIdeaStore()
  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()

  useEffect(() => {
    refreshIdeas()
  }, [refreshIdeas])

  const handleCreateIdea = async (data: CreateIdeaInput) => {
    await createIdea(data)
    setShowForm(false)
  }

  const handleUpdateIdea = async (data: CreateIdeaInput) => {
    if (!editingIdea) return
    
    const updateData: UpdateIdeaInput = {
      id: editingIdea.id,
      ...data,
    }
    
    await updateIdea(updateData)
    setEditingIdea(undefined)
  }

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea)
  }

  const handleDeleteIdea = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      await deleteIdea(id)
    }
  }

  const handleUpdateStatus = async (id: string, status: IdeaStatus) => {
    await updateIdea({ id, status })
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingIdea(undefined)
  }

  const handleCreateNew = () => {
    setEditingIdea(undefined)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Lightbulb className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Idea Manager</h1>
                <p className="text-sm text-gray-500">Capture and organize your ideas</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <IdeaList
          ideas={ideas}
          loading={loading}
          onEdit={handleEditIdea}
          onDelete={handleDeleteIdea}
          onUpdateStatus={handleUpdateStatus}
          onCreate={handleCreateNew}
        />
      </main>

      {(showForm || editingIdea) && (
        <IdeaForm
          idea={editingIdea}
          onSubmit={editingIdea ? handleUpdateIdea : handleCreateIdea}
          onCancel={handleFormCancel}
          loading={loading}
        />
      )}
    </div>
  )
}
