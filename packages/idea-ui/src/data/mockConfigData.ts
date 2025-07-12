export interface ConfigSection {
  id: string
  name: string
  description: string
  icon: any
  configs: ConfigItem[]
}

export interface ConfigItem {
  key: string
  value: string
  description: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'url'
  required: boolean
  sensitive: boolean
  category: string
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }
  lastModified: Date
  modifiedBy: string
}

export const mockConfigSections: ConfigSection[] = [
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Telegram bot configuration and API settings',
    icon: 'Bot',
    configs: [
      {
        key: 'TELEGRAM_BOT_TOKEN',
        value: '7842156789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
        description: 'Telegram Bot API token for authentication',
        type: 'password',
        required: true,
        sensitive: true,
        category: 'authentication',
        validation: { pattern: '^[0-9]+:[A-Za-z0-9_-]+$' },
        lastModified: new Date('2024-01-15'),
        modifiedBy: 'raz'
      }
    ]
  },
  {
    id: 'claude',
    name: 'Claude AI',
    description: 'Anthropic Claude API configuration',
    icon: 'Zap',
    configs: [
      {
        key: 'ANTHROPIC_API_KEY',
        value: 'sk-ant-api03-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        description: 'Anthropic Claude API key for AI processing',
        type: 'password',
        required: true,
        sensitive: true,
        category: 'authentication',
        validation: { pattern: '^sk-ant-api03-[A-Za-z0-9]+$' },
        lastModified: new Date('2024-01-10'),
        modifiedBy: 'raz'
      },
      {
        key: 'CLAUDE_MODEL',
        value: 'claude-3-5-sonnet-20241022',
        description: 'Claude model version to use',
        type: 'text',
        required: false,
        sensitive: false,
        category: 'settings',
        validation: { 
          options: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'] 
        },
        lastModified: new Date('2024-01-08'),
        modifiedBy: 'raz'
      }
    ]
  },
  {
    id: 'database',
    name: 'Database',
    description: 'PostgreSQL database connection and settings',
    icon: 'Database',
    configs: [
      {
        key: 'DATABASE_URL',
        value: 'postgresql://user:password@localhost:5432/raz2_db',
        description: 'PostgreSQL connection string with credentials',
        type: 'password',
        required: true,
        sensitive: true,
        category: 'connection',
        validation: { pattern: '^postgresql://.*$' },
        lastModified: new Date('2024-01-12'),
        modifiedBy: 'raz'
      },
      {
        key: 'DB_POOL_SIZE',
        value: '20',
        description: 'Maximum number of database connections in pool',
        type: 'number',
        required: false,
        sensitive: false,
        category: 'performance',
        validation: { min: 1, max: 100 },
        lastModified: new Date('2024-01-05'),
        modifiedBy: 'raz'
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI API for embeddings and vector search',
    icon: 'Key',
    configs: [
      {
        key: 'OPENAI_API_KEY',
        value: 'sk-1234567890abcdef1234567890abcdef1234567890abcdef12',
        description: 'OpenAI API key for embedding generation',
        type: 'password',
        required: true,
        sensitive: true,
        category: 'authentication',
        validation: { pattern: '^sk-[A-Za-z0-9]+$' },
        lastModified: new Date('2024-01-14'),
        modifiedBy: 'raz'
      },
      {
        key: 'EMBEDDING_MODEL',
        value: 'text-embedding-3-small',
        description: 'OpenAI embedding model for vector generation',
        type: 'text',
        required: false,
        sensitive: false,
        category: 'settings',
        validation: { 
          options: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'] 
        },
        lastModified: new Date('2024-01-06'),
        modifiedBy: 'raz'
      }
    ]
  },
  {
    id: 'server',
    name: 'Web Server',
    description: 'Express web server configuration',
    icon: 'Server',
    configs: [
      {
        key: 'WEB_SERVER_PORT',
        value: '3000',
        description: 'Port for the web server to listen on',
        type: 'number',
        required: false,
        sensitive: false,
        category: 'network',
        validation: { min: 1024, max: 65535 },
        lastModified: new Date('2024-01-02'),
        modifiedBy: 'raz'
      },
      {
        key: 'WEB_SERVER_HOST',
        value: '0.0.0.0',
        description: 'Host address for the web server',
        type: 'text',
        required: false,
        sensitive: false,
        category: 'network',
        lastModified: new Date('2024-01-02'),
        modifiedBy: 'raz'
      },
      {
        key: 'WEB_SERVER_ENABLED',
        value: 'true',
        description: 'Enable or disable the web server',
        type: 'boolean',
        required: false,
        sensitive: false,
        category: 'feature',
        validation: { options: ['true', 'false'] },
        lastModified: new Date('2024-01-01'),
        modifiedBy: 'raz'
      }
    ]
  }
] 