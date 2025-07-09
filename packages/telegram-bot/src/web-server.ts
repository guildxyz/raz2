import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import { resolve, join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { createLogger } from '@raz2/shared'
import { MemoryService } from './memory-service'

export interface WebServerConfig {
  port: number
  host: string
  memoryService: MemoryService
  uiDistPath: string
}

export class WebServer {
  private app: Express
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
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    this.app.get('/api/memories', async (req: Request, res: Response) => {
      try {
        const { userId, limit = 1000 } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }

        const memories = await this.config.memoryService.getUserMemories(userId as string, parseInt(limit as string))
        res.json(memories)
      } catch (error) {
        this.logger.error('Error fetching memories:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to fetch memories' })
      }
    })

    this.app.get('/api/memories/stats', async (req: Request, res: Response) => {
      try {
        const { userId } = req.query
        const stats = await this.config.memoryService.getStats(userId as string)
        res.json(stats)
      } catch (error) {
        this.logger.error('Error fetching memory stats:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to fetch memory stats' })
      }
    })

    this.app.delete('/api/memories/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const { userId } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }
        
        const success = await this.config.memoryService.deleteMemory(id, userId as string)
        
        if (success) {
          res.json({ success: true })
        } else {
          res.status(404).json({ error: 'Memory not found or not owned by user' })
        }
      } catch (error) {
        this.logger.error('Error deleting memory:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to delete memory' })
      }
    })

    this.app.post('/api/memories/search', async (req: Request, res: Response) => {
      try {
        const { query, limit = 10, userId } = req.body
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' })
        }
        
        const results = await this.config.memoryService.searchRelevantMemories(query, userId, parseInt(limit))
        
        res.json(results)
      } catch (error) {
        this.logger.error('Error searching memories:', { error: error instanceof Error ? error : new Error(String(error)) })
        res.status(500).json({ error: 'Failed to search memories' })
      }
    })

    if (existsSync(this.config.uiDistPath)) {
      this.app.use(express.static(this.config.uiDistPath))
      
      this.app.get('*', (req: Request, res: Response) => {
        const indexPath = join(this.config.uiDistPath, 'index.html')
        if (existsSync(indexPath)) {
          res.sendFile(indexPath)
        } else {
          res.status(404).send('Memory UI not found. Please build the UI first.')
        }
      })
    } else {
      this.app.get('*', (req: Request, res: Response) => {
        res.status(404).send(`Memory UI not found at ${this.config.uiDistPath}. Please build the UI first.`)
      })
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        this.logger.info('Web server started', {
          host: this.config.host,
          port: this.config.port,
          uiDistPath: this.config.uiDistPath,
          uiExists: existsSync(this.config.uiDistPath)
        })
        resolve()
      })

      this.server.on('error', (error: Error) => {
        this.logger.error('Web server error:', { error })
        reject(error)
      })
    })
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Web server stopped')
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