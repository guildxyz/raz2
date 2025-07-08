import { BaseTool, ToolInputSchema } from './base'

export class TimeTool extends BaseTool {
  readonly name = 'get_time'
  readonly description = 'Get current time and date information'
  readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone (optional, defaults to UTC)',
        default: 'UTC'
      },
      format: {
        type: 'string',
        description: 'Format type: "iso", "locale", or "unix"',
        enum: ['iso', 'locale', 'unix'],
        default: 'iso'
      }
    }
  }

  async execute(args: Record<string, any>): Promise<string> {
    const { timezone = 'UTC', format = 'iso' } = this.validateInput(args)
    
    const now = new Date()
    
    try {
      switch (format) {
        case 'unix':
          return `Current Unix timestamp: ${Math.floor(now.getTime() / 1000)}`
        
        case 'locale':
          const localeOptions: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          }
          return `Current time: ${now.toLocaleString('en-US', localeOptions)}`
        
        case 'iso':
        default:
          if (timezone === 'UTC') {
            return `Current time (UTC): ${now.toISOString()}`
          } else {
            const timeInZone = new Intl.DateTimeFormat('en-CA', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).formatToParts(now)
            
            const formatted = `${timeInZone.find(p => p.type === 'year')?.value}-${timeInZone.find(p => p.type === 'month')?.value}-${timeInZone.find(p => p.type === 'day')?.value}T${timeInZone.find(p => p.type === 'hour')?.value}:${timeInZone.find(p => p.type === 'minute')?.value}:${timeInZone.find(p => p.type === 'second')?.value}`
            
            return `Current time (${timezone}): ${formatted}`
          }
      }
    } catch (error) {
      if (error instanceof RangeError) {
        throw new Error(`Invalid timezone: ${timezone}`)
      }
      throw error
    }
  }
} 