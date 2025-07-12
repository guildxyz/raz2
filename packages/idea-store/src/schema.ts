import { pgTable, text, varchar, timestamp, integer, boolean, json, uuid, index, vector, bigint } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { IdeaCategory, IdeaPriority, IdeaStatus, ReminderType } from '@raz2/shared'

export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull().$type<IdeaCategory>().default('strategy'),
  priority: varchar('priority', { length: 20 }).notNull().$type<IdeaPriority>().default('medium'),
  status: varchar('status', { length: 20 }).notNull().$type<IdeaStatus>().default('active'),
  tags: json('tags').$type<string[]>().default([]),
  userId: varchar('user_id', { length: 100 }).notNull(),
  chatId: bigint('chat_id', { mode: 'number' }),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  chatIdIdx: index('chat_id_idx').on(table.chatId),
  categoryIdx: index('category_idx').on(table.category),
  statusIdx: index('status_idx').on(table.status),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')).with({ m: 16, ef_construction: 64 }),
}))

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  ideaId: uuid('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull().$type<ReminderType>(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  message: text('message'),
  isActive: boolean('is_active').default(true).notNull(),
  isSent: boolean('is_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ideaIdIdx: index('idea_id_idx').on(table.ideaId),
  scheduledForIdx: index('scheduled_for_idx').on(table.scheduledFor),
  isActiveIdx: index('is_active_idx').on(table.isActive),
  isSentIdx: index('is_sent_idx').on(table.isSent),
}))

export const ideasRelations = relations(ideas, ({ many }) => ({
  reminders: many(reminders),
}))

export const remindersRelations = relations(reminders, ({ one }) => ({
  idea: one(ideas, {
    fields: [reminders.ideaId],
    references: [ideas.id],
  }),
}))

export type IdeaRow = typeof ideas.$inferSelect
export type IdeaInsert = typeof ideas.$inferInsert
export type ReminderRow = typeof reminders.$inferSelect
export type ReminderInsert = typeof reminders.$inferInsert 