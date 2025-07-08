import { BaseTool, ToolInputSchema } from './base'
import { loadEnvironmentConfig } from '@claude-telegram-bot/shared'

interface WeatherData {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  city: string
}

interface OpenWeatherMapResponse {
  main: {
    temp: number
    humidity: number
  }
  weather: Array<{
    description: string
  }>
  wind?: {
    speed: number
  }
  name: string
}

export class WeatherTool extends BaseTool {
  readonly name = 'get_weather'
  readonly description = 'Get current weather information for a city'
  readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name to get weather for'
      },
      units: {
        type: 'string',
        description: 'Temperature units: metric (°C) or imperial (°F)',
        enum: ['metric', 'imperial'],
        default: 'metric'
      }
    },
    required: ['city']
  }

  async execute(args: Record<string, any>): Promise<string> {
    const { city, units = 'metric' } = this.validateInput(args)
    
    if (!city || typeof city !== 'string') {
      throw new Error('City is required and must be a string')
    }

    const trimmedCity = city.trim()
    if (trimmedCity.length === 0) {
      throw new Error('City name cannot be empty')
    }

    try {
      const weatherData = await this.fetchWeatherData(trimmedCity, units)
      return this.formatWeatherResponse(weatherData, units)
    } catch (error) {
      throw new Error(`Failed to get weather data: ${this.formatError(error)}`)
    }
  }

  private async fetchWeatherData(city: string, units: string): Promise<WeatherData> {
    const config = loadEnvironmentConfig()
    
    if (!config.weatherApiKey) {
      return this.getMockWeatherData(city, units)
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.weatherApiKey}&units=${units}`
    
    try {
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${city}" not found`)
        }
        if (response.status === 401) {
          throw new Error('Invalid weather API key')
        }
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json() as OpenWeatherMapResponse
      
      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed || 0,
        city: data.name
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Unable to connect to weather service')
      }
      throw error
    }
  }

  private getMockWeatherData(city: string, units: string): WeatherData {
    const mockTemperature = units === 'metric' ? 22 : 72
    const descriptions = [
      'clear sky',
      'few clouds',
      'scattered clouds',
      'broken clouds',
      'shower rain',
      'rain',
      'thunderstorm',
      'snow',
      'mist'
    ]
    
    const cityHash = city.toLowerCase().split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const descriptionIndex = cityHash % descriptions.length
    
    return {
      temperature: mockTemperature + (cityHash % 21) - 10,
      description: descriptions[descriptionIndex],
      humidity: 45 + (cityHash % 40),
      windSpeed: (cityHash % 15) + 1,
      city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    }
  }

  private formatWeatherResponse(data: WeatherData, units: string): string {
    const tempUnit = units === 'metric' ? '°C' : '°F'
    const windUnit = units === 'metric' ? 'm/s' : 'mph'
    
    return `Weather in ${data.city}:
🌡️ Temperature: ${data.temperature}${tempUnit}
☁️ Conditions: ${data.description}
💧 Humidity: ${data.humidity}%
💨 Wind Speed: ${data.windSpeed} ${windUnit}`
  }
} 