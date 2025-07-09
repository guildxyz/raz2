import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ideas_db'
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp'
  }
}) 