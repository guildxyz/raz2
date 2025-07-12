import React from 'react';
import { X } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import type { Idea, Subtask } from '../types';

interface KanbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea;
  onUpdateSubtask: (ideaId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  onCreateSubtask: (ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteSubtask: (ideaId: string, subtaskId: string) => void;
}

export const KanbanModal: React.FC<KanbanModalProps> = ({
  isOpen,
  onClose,
  idea,
  onUpdateSubtask,
  onCreateSubtask,
  onDeleteSubtask,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />
        
        <div className="inline-block w-full max-w-7xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{idea.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Kanban Board</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6">
            <KanbanBoard
              idea={idea}
              onUpdateSubtask={onUpdateSubtask}
              onCreateSubtask={onCreateSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 