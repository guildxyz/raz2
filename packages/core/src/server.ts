import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { IdeaStore } from '@raz2/idea-store'
import { createLogger, formatError } from '@raz2/shared'
import type { IdeaStoreConfig } from '@raz2/shared'
import { IdeaService } from './services/ideaService'
import { createIdeasRouter } from './routes/ideas'
import type { ServerConfig } from './types'

const logger = createLogger('core-server')

export class CoreServer {
  private app: express.Application
  private ideaStore: IdeaStore
  private ideaService: IdeaService
  private config: ServerConfig

  constructor(
    ideaStoreConfig: IdeaStoreConfig,
    serverConfig: Partial<ServerConfig> = {}
  ) {
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      corsOrigins: ['http://localhost:5173', 'http://localhost:3000'],
      apiPrefix: '/api',
      ...serverConfig
    }

    this.app = express()
    this.ideaStore = new IdeaStore(ideaStoreConfig)
    this.ideaService = new IdeaService(this.ideaStore)

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  private setupMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }))

    this.app.use(cors({
      origin: this.config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }))

    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim())
        }
      }
    }))

    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    })

    this.app.use(`${this.config.apiPrefix}/ideas`, createIdeasRouter(this.ideaService))

    this.app.get('/', (req, res) => {
      res.json({
        message: 'Strategic Intelligence Core API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          ideas: `${this.config.apiPrefix}/ideas`
        }
      })
    })

    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      })
    })
  }

  private setupErrorHandling(): void {
    this.app.use((
      error: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      logger.error('Unhandled request error', {
        error,
        path: req.path,
        method: req.method,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    })

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error })
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise })
      process.exit(1)
    })
  }

  async start(): Promise<void> {
    try {
      await this.ideaStore.initialize()
      logger.info('Idea store initialized successfully')

      const server = this.app.listen(this.config.port, this.config.host, () => {
        logger.info('Core server started', {
          port: this.config.port,
          host: this.config.host,
          corsOrigins: this.config.corsOrigins,
          apiPrefix: this.config.apiPrefix
        })
      })

      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown`)
        
        server.close(async () => {
                     try {
             await this.ideaStore.disconnect()
             logger.info('Graceful shutdown completed')
             process.exit(0)
           } catch (error) {
             logger.error('Error during graceful shutdown', { 
               error: error instanceof Error ? error : new Error(formatError(error))
             })
             process.exit(1)
           }
        })

        setTimeout(() => {
          logger.error('Forced shutdown after timeout')
          process.exit(1)
        }, 10000)
      }

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
      process.on('SIGINT', () => gracefulShutdown('SIGINT'))

         } catch (error) {
       logger.error('Failed to start server', { 
         error: error instanceof Error ? error : new Error(formatError(error))
       })
       throw error
     }
  }

  getApp(): express.Application {
    return this.app
  }
} 