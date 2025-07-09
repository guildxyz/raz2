import { z } from 'zod'

export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
})

export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional()
})

export const TelegramMessageEntitySchema = z.object({
  type: z.string(),
  offset: z.number(),
  length: z.number(),
  url: z.string().optional(),
  user: TelegramUserSchema.optional()
})

export const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  chat: TelegramChatSchema,
  date: z.number(),
  text: z.string().optional(),
  entities: z.array(TelegramMessageEntitySchema).optional()
})

export const ClaudeMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
})

export const ClaudeToolCallSchema = z.object({
  name: z.string(),
  input: z.record(z.any())
})

export const ClaudeToolResultSchema = z.object({
  tool_use_id: z.string(),
  content: z.string(),
  is_error: z.boolean().optional()
})

export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional()
  })
})

export const MCPToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any())
})

export const MCPToolResultSchema = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string()
  }))
})

export const EnvironmentConfigSchema = z.object({
  telegramBotToken: z.string().min(1),
  anthropicApiKey: z.string().min(1),
  claudeModel: z.string().default('claude-3-sonnet-20240229'),
  mcpServerHost: z.string().default('localhost'),
  mcpServerPort: z.number().default(3001),
  nodeEnv: z.string().default('development'),
  logLevel: z.string().default('info'),
  port: z.number().default(3000),
  weatherApiKey: z.string().optional(),
  newsApiKey: z.string().optional(),
  redisUrl: z.string().optional(),
  openaiApiKey: z.string().optional(),
  ideaIndexName: z.string().optional(),
  embeddingModel: z.string().optional(),
  webServerEnabled: z.string().optional(),
  webServerPort: z.string().optional(),
  webServerHost: z.string().optional()
})

export const LogContextSchema = z.object({
  userId: z.number().optional(),
  chatId: z.number().optional(),
  messageId: z.number().optional(),
  command: z.string().optional(),
  error: z.any().optional()
}).catchall(z.any())

export const IdeaCategorySchema = z.enum(['strategy', 'product', 'sales', 'partnerships', 'competitive', 'market', 'team', 'operations'])

export const IdeaPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const IdeaStatusSchema = z.enum(['active', 'in_progress', 'completed', 'archived', 'cancelled'])

export const ReminderTypeSchema = z.enum(['once', 'daily', 'weekly', 'monthly', 'custom'])

export const CreateReminderInputSchema = z.object({
  type: ReminderTypeSchema,
  scheduledFor: z.date(),
  message: z.string().optional()
})

export const ReminderSchema = z.object({
  id: z.string(),
  ideaId: z.string(),
  type: ReminderTypeSchema,
  scheduledFor: z.date(),
  message: z.string().optional(),
  isActive: z.boolean(),
  isSent: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const IdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: IdeaCategorySchema,
  priority: IdeaPrioritySchema,
  status: IdeaStatusSchema,
  tags: z.array(z.string()),
  userId: z.string(),
  chatId: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  reminders: z.array(ReminderSchema).optional()
})

export const IdeaWithVectorSchema = IdeaSchema.extend({
  vector: z.array(z.number())
})

export const IdeaSearchResultSchema = z.object({
  idea: IdeaSchema,
  score: z.number(),
  distance: z.number()
})

export const IdeaFilterSchema = z.object({
  userId: z.string().optional(),
  chatId: z.number().optional(),
  category: IdeaCategorySchema.optional(),
  priority: IdeaPrioritySchema.optional(),
  status: IdeaStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional()
})

export const IdeaSearchOptionsSchema = z.object({
  limit: z.number().optional(),
  threshold: z.number().optional(),
  filter: IdeaFilterSchema.optional(),
  includeMetadata: z.boolean().optional()
})

export const IdeaStoreConfigSchema = z.object({
  redisUrl: z.string(),
  indexName: z.string(),
  vectorDimension: z.number(),
  openaiApiKey: z.string(),
  embeddingModel: z.string()
})

export const CreateIdeaInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: IdeaCategorySchema.optional(),
  priority: IdeaPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string(),
  chatId: z.number().optional(),
  reminders: z.array(CreateReminderInputSchema).optional()
})

export const UpdateIdeaInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  category: IdeaCategorySchema.optional(),
  priority: IdeaPrioritySchema.optional(),
  status: IdeaStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  reminders: z.array(CreateReminderInputSchema).optional()
})

export const EmbeddingResponseSchema = z.object({
  vector: z.array(z.number()),
  tokens: z.number()
}) 