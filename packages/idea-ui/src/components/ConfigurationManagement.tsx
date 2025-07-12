import { useState } from 'react'
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  Shield, 
  Database, 
  Bot, 
  Zap, 
  Server, 
  Key, 
  AlertTriangle, 
  Copy,
  Edit3,
  Search,
  Download,
  Upload
} from 'lucide-react'

interface ConfigSection {
  id: string
  name: string
  description: string
  icon: any
  configs: ConfigItem[]
}

interface ConfigItem {
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

export const ConfigurationManagement = () => {
  const [activeSection, setActiveSection] = useState<string>('telegram')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const [configSections] = useState<ConfigSection[]>([
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Telegram bot configuration and API settings',
      icon: Bot,
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
      icon: Zap,
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
      icon: Database,
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
      icon: Key,
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
      icon: Server,
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
          category: 'settings',
          lastModified: new Date('2024-01-02'),
          modifiedBy: 'raz'
        }
      ]
    }
  ])

  const currentSection = configSections.find(section => section.id === activeSection)
  
  const filteredConfigs = currentSection?.configs.filter(config =>
    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const toggleSensitive = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const startEditing = (key: string, currentValue: string) => {
    setEditingConfig(key)
    setConfigValues({ ...configValues, [key]: currentValue })
  }

  const cancelEditing = () => {
    setEditingConfig(null)
    setConfigValues({})
  }

  const saveConfig = (key: string) => {
    console.log(`Saving config ${key}:`, configValues[key])
    setEditingConfig(null)
    setHasChanges(true)
  }

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const handleConfigChange = (key: string, value: string) => {
    setConfigValues({ ...configValues, [key]: value })
  }

  const validateConfig = (config: ConfigItem, value: string) => {
    if (config.required && !value.trim()) {
      return 'This field is required'
    }
    
    if (config.validation?.pattern && !new RegExp(config.validation.pattern).test(value)) {
      return 'Invalid format'
    }
    
    if (config.type === 'number') {
      const num = parseInt(value)
      if (isNaN(num)) return 'Must be a number'
      if (config.validation?.min && num < config.validation.min) {
        return `Must be at least ${config.validation.min}`
      }
      if (config.validation?.max && num > config.validation.max) {
        return `Must be at most ${config.validation.max}`
      }
    }
    
    return null
  }

  const renderConfigValue = (config: ConfigItem) => {
    const isEditing = editingConfig === config.key
    const displayValue = isEditing ? (configValues[config.key] || config.value) : config.value
    const isHidden = config.sensitive && !showSensitive[config.key]
    
    if (isEditing) {
      if (config.type === 'boolean') {
        return (
          <div className="flex items-center gap-3">
            <select
              value={displayValue}
              onChange={(e) => handleConfigChange(config.key, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
            <button
              onClick={() => saveConfig(config.key)}
              className="text-green-600 hover:text-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelEditing}
              className="text-gray-600 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )
      }
      
      if (config.validation?.options) {
        return (
          <div className="flex items-center gap-3">
            <select
              value={displayValue}
              onChange={(e) => handleConfigChange(config.key, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {config.validation.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              onClick={() => saveConfig(config.key)}
              className="text-green-600 hover:text-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={cancelEditing}
              className="text-gray-600 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )
      }
      
      return (
        <div className="flex items-center gap-3">
          <input
            type={config.type === 'password' ? 'password' : config.type === 'number' ? 'number' : 'text'}
            value={displayValue}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={config.description}
          />
          <button
            onClick={() => saveConfig(config.key)}
            className="text-green-600 hover:text-green-700"
          >
            <Save size={16} />
          </button>
          <button
            onClick={cancelEditing}
            className="text-gray-600 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-3">
        <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm">
          {isHidden ? '••••••••••••••••' : displayValue}
        </code>
        {config.sensitive && (
          <button
            onClick={() => toggleSensitive(config.key)}
            className="text-gray-600 hover:text-gray-700"
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
        <button
          onClick={() => copyToClipboard(config.value)}
          className="text-gray-600 hover:text-gray-700"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={() => startEditing(config.key, config.value)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit3 size={16} />
        </button>
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Key className="text-red-600" size={16} />
      case 'connection': return <Database className="text-blue-600" size={16} />
      case 'settings': return <Settings className="text-gray-600" size={16} />
      case 'network': return <Server className="text-green-600" size={16} />
      case 'performance': return <Zap className="text-purple-600" size={16} />
      default: return <Settings className="text-gray-600" size={16} />
    }
  }

  const saveAllChanges = () => {
    console.log('Saving all configuration changes')
    setHasChanges(false)
  }

  const exportConfig = () => {
    console.log('Exporting configuration')
  }

  const importConfig = () => {
    console.log('Importing configuration')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration Management</h2>
          <p className="text-gray-600">Manage system settings, API keys, and environment variables</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={saveAllChanges}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save size={16} />
              Save All Changes
            </button>
          )}
          <button
            onClick={exportConfig}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={importConfig}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <Upload size={16} />
            Import
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-yellow-600" size={20} />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <p className="text-sm text-yellow-700">
              Configuration changes affect system security and functionality. Always backup before making changes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              {configSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {section.name}
                  </button>
                )
              })}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {currentSection && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <currentSection.icon className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">{currentSection.name}</h3>
              </div>
              <p className="text-gray-600">{currentSection.description}</p>
            </div>
          )}

          <div className="space-y-6">
            {filteredConfigs.map((config) => {
              const validationError = editingConfig === config.key ? 
                validateConfig(config, configValues[config.key] || config.value) : null
              
              return (
                <div key={config.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getCategoryIcon(config.category)}
                          <h4 className="font-medium text-gray-900">{config.key}</h4>
                          {config.required && (
                            <span className="text-red-500 text-sm">*</span>
                          )}
                          {config.sensitive && (
                            <Shield className="text-amber-500" size={14} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                        {renderConfigValue(config)}
                        {validationError && (
                          <p className="text-red-600 text-sm mt-1">{validationError}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>Category: {config.category}</span>
                      <span>Modified by {config.modifiedBy} on {config.lastModified.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredConfigs.length === 0 && (
            <div className="text-center py-12">
              <Settings className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations found</h3>
              <p className="text-gray-500">Try adjusting your search terms or select a different section</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 