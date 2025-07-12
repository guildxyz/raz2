export interface BotInfo {
  id: number;
  username: string;
  firstName: string;
  isBot: boolean;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
  profilePhotoPath?: string;
  profilePhotoUrl?: string;
}

const API_BASE = '/api'

export const botService = {
  async getBotInfo(): Promise<BotInfo | null> {
    try {
      const response = await fetch(`${API_BASE}/bot/info`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // Bot info not available
        }
        throw new Error(`Failed to fetch bot info: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching bot info:', error)
      return null
    }
  },

  getBotPhotoUrl(): string {
    return `${API_BASE}/bot/photo`
  }
} 