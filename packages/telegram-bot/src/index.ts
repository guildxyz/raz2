import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvironmentConfig, createLogger, IDEA_STORE_CONFIG } from '@raz2/shared';
import type { IdeaStoreConfig } from '@raz2/idea-store';
import { TelegramBotService } from './bot.js';
import { BotConfig } from './types.js';

// Load environment variables from root directory (only in development)
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(process.cwd(), '../../.env') });
}

export { TelegramBotService } from './bot.js';
export * from './types.js';

const logger = createLogger('Main');

async function createBot(): Promise<TelegramBotService> {
  try {
    const config = loadEnvironmentConfig();
    
    let ideaStoreConfig: IdeaStoreConfig | undefined;
    if (config.databaseUrl && config.openaiApiKey) {
      ideaStoreConfig = {
        databaseUrl: config.databaseUrl,
        openaiApiKey: config.openaiApiKey,
        embeddingModel: config.embeddingModel || IDEA_STORE_CONFIG.DEFAULT_EMBEDDING_MODEL,
        vectorDimension: IDEA_STORE_CONFIG.DEFAULT_VECTOR_DIMENSION
      };
      logger.info('Strategic idea store configured', {
        databaseUrl: config.databaseUrl,
        embeddingModel: ideaStoreConfig.embeddingModel
      });
    } else {
      logger.info('Strategic idea store disabled - missing Database URL or OpenAI API key', {
        hasDatabaseUrl: !!config.databaseUrl,
        hasOpenaiApiKey: !!config.openaiApiKey
      });
    }
    
    const botConfig: BotConfig = {
      telegramToken: config.telegramBotToken,
      claudeApiKey: config.anthropicApiKey,
      mcpServerPath: resolve(process.cwd(), '../../packages/mcp-server/dist/index.js'),
      ideaStore: ideaStoreConfig,
      webServer: {
        enabled: config.webServerEnabled !== 'false',
        port: parseInt(config.webServerPort || '3000'),
        host: config.webServerHost || '0.0.0.0'
      }
    };

    validateConfig(botConfig);
    
    return new TelegramBotService(botConfig);
  } catch (error) {
    logger.error('Failed to create bot:', { 
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}

function validateConfig(config: BotConfig): void {
  const required = [
    { key: 'telegramToken', value: config.telegramToken },
    { key: 'claudeApiKey', value: config.claudeApiKey },
    { key: 'mcpServerPath', value: config.mcpServerPath },
  ];

  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    const keys = missing.map(({ key }) => key).join(', ');
    throw new Error(`Missing required configuration: ${keys}`);
  }
}

async function main(): Promise<void> {
  try {
    logger.info('Starting Telegram bot...');
    
    const bot = await createBot();
    await bot.start();
    
    logger.info('Bot started successfully');

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await bot.stop();
      process.exit(0);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection', { 
        promise: String(promise),
        reason: String(reason),
        error: reason instanceof Error ? reason : new Error(String(reason))
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start bot:', { 
      error: error instanceof Error ? error : new Error(String(error))
    });
    process.exit(1);
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  main().catch((error) => {
    logger.error('Fatal error:', { 
      error: error instanceof Error ? error : new Error(String(error))
    });
    process.exit(1);
  });
} 