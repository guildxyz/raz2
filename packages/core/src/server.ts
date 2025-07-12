import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { IdeaStore } from '@raz2/idea-store'
import { ClaudeClient } from '@raz2/claude-api'
import { createLogger, formatError } from '@raz2/shared'
import type { IdeaStoreConfig } from '@raz2/shared'
import { IdeaService } from './services/ideaService'
import { ConversationService } from './services/conversationService'
import { ContactService } from './services/contactService'
import { AIService } from './services/aiService'
import { NotificationService } from './services/notificationService'
import { createIdeasRouter } from './routes/ideas'
import type { ServerConfig } from './types'

const logger = createLogger('core-server')

export class CoreServer {
  private app: express.Application
  private ideaStore: IdeaStore
  private ideaService: IdeaService
  private conversationService: ConversationService
  private contactService: ContactService
  private aiService: AIService
  private notificationService: NotificationService
  private config: ServerConfig

  constructor(
    ideaStoreConfig: IdeaStoreConfig,
    serverConfig: Partial<ServerConfig> = {},
    claude?: ClaudeClient
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
    
    this.aiService = claude ? new AIService(claude) : new AIService(new ClaudeClient())
    this.ideaService = new IdeaService(this.ideaStore, this.aiService)
    this.conversationService = new ConversationService(claude)
    this.contactService = new ContactService(claude)
    this.notificationService = new NotificationService()

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
        version: '1.0.0',
        services: {
          ideas: 'active',
          conversations: 'active',
          contacts: 'active',
          ai: 'active',
          notifications: 'active'
        }
      })
    })

    this.app.use(`${this.config.apiPrefix}/ideas`, createIdeasRouter(this.ideaService))
    this.setupConversationRoutes()
    this.setupContactRoutes()
    this.setupAIRoutes()
    this.setupNotificationRoutes()

    this.app.get('/', (req, res) => {
      res.json({
        message: 'Strategic Intelligence Core API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          ideas: `${this.config.apiPrefix}/ideas`,
          conversations: `${this.config.apiPrefix}/conversations`,
          contacts: `${this.config.apiPrefix}/contacts`,
          ai: `${this.config.apiPrefix}/ai`,
          notifications: `${this.config.apiPrefix}/notifications`
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

  private setupConversationRoutes(): void {
    const router = express.Router()

    router.get('/', async (req, res) => {
      try {
        const filter = req.query
        const conversations = await this.conversationService.listConversations(filter)
        res.json({ success: true, data: conversations })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/', async (req, res) => {
      try {
        const { title, chatId, initialMessage, userId, userName } = req.body
        const conversation = await this.conversationService.createConversation(title, chatId, initialMessage, userId, userName)
        res.status(201).json({ success: true, data: conversation })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/:id', async (req, res) => {
      try {
        const conversation = await this.conversationService.getConversation(req.params.id)
        if (!conversation) {
          return res.status(404).json({ success: false, error: 'Conversation not found' })
        }
        res.json({ success: true, data: conversation })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/:id/messages', async (req, res) => {
      try {
        const { content, role, userId, userName } = req.body
        const message = await this.conversationService.addMessage(req.params.id, content, role, userId, userName)
        res.status(201).json({ success: true, data: message })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/:id/messages', async (req, res) => {
      try {
        const messages = await this.conversationService.getConversationMessages(req.params.id)
        res.json({ success: true, data: messages })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/:id/analyze', async (req, res) => {
      try {
        const insights = await this.conversationService.generateAIInsights(req.params.id)
        res.json({ success: true, data: insights })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/search/:query', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20
        const conversations = await this.conversationService.searchConversations(req.params.query, limit)
        res.json({ success: true, data: conversations })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    this.app.use(`${this.config.apiPrefix}/conversations`, router)
  }

  private setupContactRoutes(): void {
    const router = express.Router()

    router.get('/', async (req, res) => {
      try {
        const filter = req.query
        const contacts = await this.contactService.listContacts(filter)
        res.json({ success: true, data: contacts })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/', async (req, res) => {
      try {
        const { name, email, phone, company, role, industry, location, notes, tags } = req.body
        const contact = await this.contactService.createContact(name, email, phone, company, role, industry, location, notes, tags)
        res.status(201).json({ success: true, data: contact })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/:id', async (req, res) => {
      try {
        const contact = await this.contactService.getContact(req.params.id)
        if (!contact) {
          return res.status(404).json({ success: false, error: 'Contact not found' })
        }
        res.json({ success: true, data: contact })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.patch('/:id', async (req, res) => {
      try {
        const contact = await this.contactService.updateContact(req.params.id, req.body)
        if (!contact) {
          return res.status(404).json({ success: false, error: 'Contact not found' })
        }
        res.json({ success: true, data: contact })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/:id/interactions', async (req, res) => {
      try {
        const { type, content, subject, outcome, followUpRequired } = req.body
        const interaction = await this.contactService.addInteraction(req.params.id, type, content, subject, outcome, followUpRequired)
        if (!interaction) {
          return res.status(404).json({ success: false, error: 'Contact not found' })
        }
        res.status(201).json({ success: true, data: interaction })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/:id/insights', async (req, res) => {
      try {
        const insights = await this.contactService.generateAIInsights(req.params.id)
        res.json({ success: true, data: insights })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/search/:query', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20
        const contacts = await this.contactService.searchContacts(req.params.query, limit)
        res.json({ success: true, data: contacts })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/analytics/overview', async (req, res) => {
      try {
        const analytics = await this.contactService.getContactAnalytics()
        res.json({ success: true, data: analytics })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    this.app.use(`${this.config.apiPrefix}/contacts`, router)
  }

  private setupAIRoutes(): void {
    const router = express.Router()

    router.post('/process', async (req, res) => {
      try {
        const response = await this.aiService.processRequest(req.body)
        res.json(response)
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/enhance-idea', async (req, res) => {
      try {
        const { title, content } = req.body
        const enhancement = await this.aiService.enhanceIdea(title, content)
        res.json({ success: true, data: enhancement })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/analyze-conversation', async (req, res) => {
      try {
        const { messages } = req.body
        const title = await this.aiService.generateConversationTitle(messages)
        res.json({ success: true, data: { title } })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/analyze-contact', async (req, res) => {
      try {
        const { contactName, interactions } = req.body
        const analysis = await this.aiService.analyzeContactCommunication(contactName, interactions)
        res.json({ success: true, data: analysis })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    this.app.use(`${this.config.apiPrefix}/ai`, router)
  }

  private setupNotificationRoutes(): void {
    const router = express.Router()

    router.get('/', async (req, res) => {
      try {
        const filter = req.query
        const notifications = await this.notificationService.listNotifications(filter)
        res.json({ success: true, data: notifications })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/', async (req, res) => {
      try {
        const { type, title, message, scheduledFor, config, targetId, targetType } = req.body
        const notification = await this.notificationService.createNotification(
          type, title, message, new Date(scheduledFor), config, targetId, targetType
        )
        res.status(201).json({ success: true, data: notification })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/reminder', async (req, res) => {
      try {
        const { title, message, scheduledFor, targetId, targetType, channels } = req.body
        const notification = await this.notificationService.createReminder(
          title, message, new Date(scheduledFor), targetId, targetType, channels
        )
        res.status(201).json({ success: true, data: notification })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.post('/follow-up', async (req, res) => {
      try {
        const { title, message, targetId, targetType, daysFromNow, channels } = req.body
        const notification = await this.notificationService.createFollowUp(
          title, message, targetId, targetType, daysFromNow, channels
        )
        res.status(201).json({ success: true, data: notification })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/due', async (req, res) => {
      try {
        const notifications = await this.notificationService.getDueNotifications()
        res.json({ success: true, data: notifications })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.patch('/:id/sent', async (req, res) => {
      try {
        const success = await this.notificationService.markAsSent(req.params.id)
        res.json({ success })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    router.get('/stats', async (req, res) => {
      try {
        const stats = await this.notificationService.getNotificationStats()
        res.json({ success: true, data: stats })
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    this.app.use(`${this.config.apiPrefix}/notifications`, router)
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
        logger.info('Core server started with comprehensive services', {
          port: this.config.port,
          host: this.config.host,
          corsOrigins: this.config.corsOrigins,
          apiPrefix: this.config.apiPrefix,
          services: ['ideas', 'conversations', 'contacts', 'ai', 'notifications']
        })
      })

      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown`)
        
        server.close(async () => {
          try {
            await this.ideaStore.disconnect()
            this.notificationService.stop()
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