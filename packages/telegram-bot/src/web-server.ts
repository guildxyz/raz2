import express from 'express'
import cors from 'cors'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { createLogger } from '@raz2/shared'
import { IdeaService } from './idea-service.js'

export interface WebServerConfig {
  port: number
  host: string
  ideaService: IdeaService
  uiDistPath: string
  botService?: any // We'll use any to avoid circular dependency
}

export class WebServer {
  private app: express.Express
  private logger = createLogger('WebServer')
  private server: any = null

  constructor(private config: WebServerConfig) {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: true,
      credentials: true
    }))
    this.app.use(express.json())
  }

  private setupRoutes(): void {
    this.app.get('/api/health', (req: express.Request, res: express.Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    // Bot information endpoints
    this.app.get('/api/bot/info', (req: express.Request, res: express.Response) => {
      try {
        if (!this.config.botService) {
          return res.status(404).json({ error: 'Bot service not available' })
        }

        const botInfo = this.config.botService.getBotInfo()
        if (!botInfo) {
          return res.status(404).json({ error: 'Bot information not available' })
        }

        res.json(botInfo)
      } catch (error) {
        this.logger.error('Error fetching bot info:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to fetch bot information' })
      }
    })

    this.app.get('/api/bot/photo', (req: express.Request, res: express.Response) => {
      try {
        if (!this.config.botService) {
          return res.status(404).json({ error: 'Bot service not available' })
        }

        const botInfo = this.config.botService.getBotInfo()
        if (!botInfo || !botInfo.profilePhotoPath) {
          return res.status(404).json({ error: 'Bot profile photo not available' })
        }

        if (!existsSync(botInfo.profilePhotoPath)) {
          return res.status(404).json({ error: 'Profile photo file not found' })
        }

        res.sendFile(botInfo.profilePhotoPath)
      } catch (error) {
        this.logger.error('Error serving bot photo:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to serve bot profile photo' })
      }
    })

    this.app.get('/api/ideas', async (req: express.Request, res: express.Response) => {
      try {
        const { userId, limit = 1000 } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }

        const ideas = await this.config.ideaService.getUserIdeas(userId as string, parseInt(limit as string))
        res.json(ideas)
      } catch (error) {
        this.logger.error('Error fetching ideas:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to fetch strategic ideas' })
      }
    })

    this.app.get('/api/ideas/stats', async (req: express.Request, res: express.Response) => {
      try {
        const { userId } = req.query
        const stats = await this.config.ideaService.getStats(userId as string)
        res.json(stats)
      } catch (error) {
        this.logger.error('Error fetching idea stats:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to fetch strategic intelligence stats' })
      }
    })

    this.app.post('/api/ideas', async (req: express.Request, res: express.Response) => {
      try {
        const { title, content, category, priority, tags, userId } = req.body
        
        if (!title || !content || !userId) {
          return res.status(400).json({ error: 'title, content, and userId are required' })
        }
        
        const idea = await this.config.ideaService.createIdea({
          title,
          content,
          category,
          priority,
          tags,
          userId
        })
        
        res.status(201).json(idea)
      } catch (error) {
        this.logger.error('Error creating idea:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to create strategic idea' })
      }
    })

    this.app.patch('/api/ideas/:id', async (req: express.Request, res: express.Response) => {
      try {
        const { id } = req.params
        const { title, content, category, priority, status, tags } = req.body
        
        const idea = await this.config.ideaService.updateIdea({
          id,
          title,
          content,
          category,
          priority,
          status,
          tags
        })
        
        if (idea) {
          res.json(idea)
        } else {
          res.status(404).json({ error: 'Strategic idea not found' })
        }
      } catch (error) {
        this.logger.error('Error updating idea:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to update strategic idea' })
      }
    })

    this.app.delete('/api/ideas/:id', async (req: express.Request, res: express.Response) => {
      try {
        const { id } = req.params
        const { userId } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }
        
        const success = await this.config.ideaService.deleteIdea(id, userId as string)
        
        if (success) {
          res.json({ success: true })
        } else {
          res.status(404).json({ error: 'Strategic idea not found or not owned by user' })
        }
      } catch (error) {
        this.logger.error('Error deleting idea:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to delete strategic idea' })
      }
    })

    this.app.post('/api/ideas/search', async (req: express.Request, res: express.Response) => {
      try {
        const { query, limit = 10, userId } = req.body
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }
        
        const results = await this.config.ideaService.searchRelevantIdeas(query, userId, parseInt(limit))
        
        res.json(results)
      } catch (error) {
        this.logger.error('Error searching ideas:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to search strategic ideas' })
      }
    })

    if (existsSync(this.config.uiDistPath)) {
      this.app.use(express.static(this.config.uiDistPath))
      
      this.app.get('*', (req: express.Request, res: express.Response) => {
        const indexPath = join(this.config.uiDistPath, 'index.html')
        if (existsSync(indexPath)) {
          res.sendFile(indexPath)
        } else {
          res.status(404).send('Strategic Intelligence Dashboard not found. Please build the UI first.')
        }
      })
    } else {
      this.app.get('*', (req: express.Request, res: express.Response) => {
        res.status(404).send(`Strategic Intelligence Dashboard not found at ${this.config.uiDistPath}. Please build the UI first.`)
      })
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.logger.info('Strategic Intelligence Dashboard server started', {
          host: this.config.host,
          port: this.config.port,
          uiDistPath: this.config.uiDistPath,
          uiExists: existsSync(this.config.uiDistPath)
        })
        resolve()
      })

      this.server.on('error', (error: Error) => {
        this.logger.error('Strategic Intelligence Dashboard server error:', { error })
        reject(error)
      })
    })
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Strategic Intelligence Dashboard server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  public getUrl(): string {
    return `http://${this.config.host}:${this.config.port}`
  }
} 