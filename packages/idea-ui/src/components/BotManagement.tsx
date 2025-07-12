import { useState, useEffect } from 'react'
import { Bot, Users, MessageSquare } from 'lucide-react'
import { botService, type BotInfo } from '../services/botService'

export const BotManagement = () => {
  const [realBotInfo, setRealBotInfo] = useState<BotInfo | null>(null)
  const [loadingBotInfo, setLoadingBotInfo] = useState(true)

  useEffect(() => {
    const fetchBotInfo = async () => {
      setLoadingBotInfo(true)
      try {
        const info = await botService.getBotInfo()
        setRealBotInfo(info)
      } catch (error) {
        console.error('Failed to fetch bot info:', error)
      } finally {
        setLoadingBotInfo(false)
      }
    }

    fetchBotInfo()
  }, [])

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Live Bot Information</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected to Telegram</span>
          </div>
        </div>
        
        {loadingBotInfo ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading bot information...</span>
          </div>
        ) : realBotInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={botService.getBotPhotoUrl()}
                  alt={`${realBotInfo.firstName} profile`}
                  className="w-16 h-16 rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="text-blue-600" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{realBotInfo.firstName}</h3>
                <p className="text-blue-600">@{realBotInfo.username}</p>
                <p className="text-sm text-gray-500">ID: {realBotInfo.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Can Join Groups</div>
                <div className="text-sm font-medium">{realBotInfo.canJoinGroups ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <MessageSquare className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Read All Messages</div>
                <div className="text-sm font-medium">{realBotInfo.canReadAllGroupMessages ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Bot information not available</p>
            <p className="text-sm text-gray-500">Make sure the bot is connected to Telegram</p>
          </div>
        )}
      </div>
    </div>
  )
} 