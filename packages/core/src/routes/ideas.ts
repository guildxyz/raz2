import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@raz2/shared'
import type { IdeaService } from '../services/ideaService'
import type { ApiResponse, CreateIdeaRequest, UpdateIdeaRequest } from '../types'

const logger = createLogger('ideas-routes')

const CreateIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.enum(['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string().min(1),
  chatId: z.number().optional(),
  generateSubtasks: z.boolean().optional()
})

const UpdateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  category: z.enum(['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['active', 'in_progress', 'completed', 'archived', 'cancelled']).optional(),
  tags: z.array(z.string()).optional(),
  regenerateSubtasks: z.boolean().optional()
})

export function createIdeasRouter(ideaService: IdeaService): Router {
  const router = Router()

  router.post('/', async (req: Request, res: Response) => {
    try {
      const validated = CreateIdeaSchema.parse(req.body)
      
      const idea = await ideaService.createIdea(validated as CreateIdeaRequest)
      
      const response: ApiResponse = {
        success: true,
        data: idea
      }
      
      res.status(201).json(response)
    } catch (error) {
      logger.error('Failed to create idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        body: req.body
      })
      
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }
        res.status(400).json(response)
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error'
        }
        res.status(500).json(response)
      }
    }
  })

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { userId, category, priority, status, limit = '50', search } = req.query
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'userId query parameter is required'
        }
        res.status(400).json(response)
        return
      }

      let ideas
      
      if (search && typeof search === 'string') {
        ideas = await ideaService.searchIdeas(search, parseInt(limit as string) || 50)
      } else {
        const filter = {
          userId: userId as string,
          category: category as any,
          priority: priority as any,
          status: status as any
        }
        
        Object.keys(filter).forEach(key => {
          if (filter[key as keyof typeof filter] === undefined) {
            delete filter[key as keyof typeof filter]
          }
        })
        
        ideas = await ideaService.listIdeas(filter, parseInt(limit as string) || 50)
      }
      
      const response: ApiResponse = {
        success: true,
        data: ideas
      }
      
      res.json(response)
    } catch (error) {
      logger.error('Failed to get ideas', {
        error: error instanceof Error ? error : new Error(String(error)),
        query: req.query
      })
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error'
      }
      res.status(500).json(response)
    }
  })

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      
      const ideas = await ideaService.listIdeas({ userId: req.query.userId as string })
      const idea = ideas.find(i => i.id === id)
      
      if (!idea) {
        const response: ApiResponse = {
          success: false,
          error: 'Idea not found'
        }
        res.status(404).json(response)
        return
      }
      
      const response: ApiResponse = {
        success: true,
        data: idea
      }
      
      res.json(response)
    } catch (error) {
      logger.error('Failed to get idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: req.params.id
      })
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error'
      }
      res.status(500).json(response)
    }
  })

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const validated = UpdateIdeaSchema.parse(req.body)
      
      const updateRequest: UpdateIdeaRequest = {
        ...validated,
        id
      }
      
      const idea = await ideaService.updateIdea(updateRequest)
      
      if (!idea) {
        const response: ApiResponse = {
          success: false,
          error: 'Idea not found'
        }
        res.status(404).json(response)
        return
      }
      
      const response: ApiResponse = {
        success: true,
        data: idea
      }
      
      res.json(response)
    } catch (error) {
      logger.error('Failed to update idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: req.params.id,
        body: req.body
      })
      
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }
        res.status(400).json(response)
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error'
        }
        res.status(500).json(response)
      }
    }
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { userId } = req.query
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'userId query parameter is required'
        }
        res.status(400).json(response)
        return
      }
      
      const success = await ideaService.deleteIdea(id, userId as string)
      
      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: 'Idea not found or could not be deleted'
        }
        res.status(404).json(response)
        return
      }
      
      const response: ApiResponse = {
        success: true,
        data: { deleted: true }
      }
      
      res.json(response)
    } catch (error) {
      logger.error('Failed to delete idea', {
        error: error instanceof Error ? error : new Error(String(error)),
        ideaId: req.params.id
      })
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error'
      }
      res.status(500).json(response)
    }
  })

  return router
} 