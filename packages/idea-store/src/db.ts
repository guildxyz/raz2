import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const createDatabase = (connectionString: string) => {
  const client = postgres(connectionString, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDatabase>

export const enablePgVector = async (db: Database) => {
  await db.execute('CREATE EXTENSION IF NOT EXISTS vector')
} 