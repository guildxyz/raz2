import { createLogger, loadEnvironmentConfig, formatError } from '@raz2/shared'
import { CoreServer } from './server'

const logger = createLogger('core-main')

async function main() {
  try {
    const env = loadEnvironmentConfig()
    
    if (!env.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    if (!env.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    if (!env.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    const ideaStoreConfig = {
      databaseUrl: env.databaseUrl,
      openaiApiKey: env.openaiApiKey,
      embeddingModel: env.embeddingModel || 'text-embedding-3-small',
      vectorDimension: 1536
    }

    const serverConfig = {
      port: parseInt(env.webServerPort || '3000'),
      host: env.webServerHost || '0.0.0.0',
      corsOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
    }

    const server = new CoreServer(
      ideaStoreConfig,
      serverConfig
    )

    await server.start()

  } catch (error) {
    logger.error('Failed to start core server', { 
      error: error instanceof Error ? error : new Error(formatError(error))
    })
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { CoreServer }
export * from './types'
export * from './services/ideaService' 