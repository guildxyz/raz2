import { useState, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Clock, 
  Activity, 
  TrendingUp, 
  MessageSquare,
  Brain,
  Star,
  Edit,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Shield,
  Users,
  Link,
  Bell,
  Tag,
  FileText,
  BarChart3,
  Heart,
  Zap,
  Eye
} from 'lucide-react'
import {
  contactsAtom,
  selectedContactIdAtom,
  generateContactAIInsightsAtom,
  updateContactAtom
} from '../store'
import type { Contact, ContactInteraction, UpdateContactInput } from '../types'

export const ContactProfile = () => {
  const contacts = useAtomValue(contactsAtom)
  const selectedContactId = useAtomValue(selectedContactIdAtom)
  const generateAIInsights = useSetAtom(generateContactAIInsightsAtom)
  const updateContact = useSetAtom(updateContactAtom)

  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'insights' | 'relationships'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Contact>>({})

  const contact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null

  useEffect(() => {
    if (contact && !contact.aiInsights) {
      generateAIInsights(contact.id)
    }
  }, [contact, generateAIInsights])

  const handleSave = async () => {
    if (!contact || !editData) return
    
    try {
      await updateContact({
        id: contact.id,
        ...editData
      } as UpdateContactInput)
      setIsEditing(false)
      setEditData({})
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths}mo ago`
    
    return `${Math.floor(diffInMonths / 12)}y ago`
  }

  const getRoleIcon = (role: Contact['role']) => {
    switch (role) {
      case 'advisor': return <Star className="text-yellow-600" size={16} />
      case 'colleague': return <Users className="text-blue-600" size={16} />
      case 'stakeholder': return <Target className="text-purple-600" size={16} />
      case 'expert': return <Brain className="text-green-600" size={16} />
      case 'investor': return <TrendingUp className="text-emerald-600" size={16} />
      case 'team': return <Users className="text-indigo-600" size={16} />
      case 'client': return <Building className="text-orange-600" size={16} />
      case 'partner': return <Award className="text-pink-600" size={16} />
      case 'competitor': return <AlertCircle className="text-red-600" size={16} />
      default: return <User className="text-gray-600" size={16} />
    }
  }

  const getTrustLevelColor = (level: Contact['trustLevel']) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: Contact['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentColor = (sentiment: ContactInteraction['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInteractionIcon = (type: ContactInteraction['type']) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} />
      case 'call': return <Phone size={16} />
      case 'meeting': return <Calendar size={16} />
      case 'email': return <Mail size={16} />
      default: return <Activity size={16} />
    }
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <User className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-500">Select a contact to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 rounded-full p-4">
              {contact.avatarUrl ? (
                <img 
                  src={contact.avatarUrl} 
                  alt={contact.firstName}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <User className="text-gray-600" size={24} />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h2>
                {getRoleIcon(contact.role)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(contact.trustLevel)}`}>
                  {contact.trustLevel} trust
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(contact.priority)}`}>
                  {contact.priority} priority
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={14} />
                  @{contact.username}
                </div>
                
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    {contact.email}
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {contact.phone}
                  </div>
                )}
                
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building size={14} />
                    {contact.company} {contact.position && `• ${contact.position}`}
                  </div>
                )}
                
                {contact.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    {contact.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            
            <button
              onClick={() => generateAIInsights(contact.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Brain size={16} />
              Generate Insights
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{contact.interactionScore}%</div>
                <div className="text-sm text-gray-500">Interaction Score</div>
              </div>
              <Activity className="text-blue-600" size={20} />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{contact.influenceWeight}</div>
                <div className="text-sm text-gray-500">Influence Weight</div>
              </div>
              <TrendingUp className="text-green-600" size={20} />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{contact.totalMessages}</div>
                <div className="text-sm text-gray-500">Total Messages</div>
              </div>
              <MessageSquare className="text-purple-600" size={20} />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{formatTimeAgo(contact.lastSeen)}</div>
                <div className="text-sm text-gray-500">Last Seen</div>
              </div>
              <Clock className="text-orange-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'interactions', label: 'Interactions', icon: MessageSquare },
            { id: 'insights', label: 'AI Insights', icon: Brain },
            { id: 'relationships', label: 'Relationships', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.primaryTopics.map((topic, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Context</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Industry</div>
                    <div className="text-sm text-gray-600">{contact.businessContext.industry}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Company Size</div>
                    <div className="text-sm text-gray-600">{contact.businessContext.companySize}</div>
                  </div>
                </div>
                
                {contact.businessContext.painPoints.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Pain Points</div>
                    <div className="flex flex-wrap gap-2">
                      {contact.businessContext.painPoints.map((point, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {contact.businessContext.goals.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Goals</div>
                    <div className="flex flex-wrap gap-2">
                      {contact.businessContext.goals.map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="space-y-2">
                {contact.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <FileText className="text-yellow-600 flex-shrink-0" size={16} />
                    <div className="text-sm text-gray-700">{note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminders</h3>
              <div className="space-y-2">
                {contact.reminders.map((reminder) => (
                  <div key={reminder.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                    reminder.completed ? 'bg-green-50' : 'bg-blue-50'
                  }`}>
                    {reminder.completed ? (
                      <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    ) : (
                      <Bell className="text-blue-600 flex-shrink-0" size={16} />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{reminder.title}</div>
                      {reminder.description && (
                        <div className="text-sm text-gray-600">{reminder.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {reminder.date.toLocaleDateString()} • {reminder.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Interaction History</h3>
              <div className="text-sm text-gray-500">
                {contact.interactions.length} total interactions
              </div>
            </div>
            
            <div className="space-y-3">
              {contact.interactions
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((interaction) => (
                  <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSentimentColor(interaction.sentiment)}`}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900">{interaction.topic}</div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(interaction.sentiment)}`}>
                              {interaction.sentiment}
                            </span>
                            {interaction.followUpRequired && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                Follow-up required
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            {interaction.type} • {formatTimeAgo(interaction.date)}
                            {interaction.duration && ` • ${interaction.duration} min`}
                          </div>
                          
                          {interaction.notes && (
                            <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                              {interaction.notes}
                            </div>
                          )}
                          
                          {interaction.outcome && (
                            <div className="text-sm text-green-700 bg-green-50 rounded p-2 mt-2">
                              <strong>Outcome:</strong> {interaction.outcome}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {contact.aiInsights ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Pattern</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Preferred Times</div>
                        <div className="text-sm text-gray-600">
                          {contact.aiInsights.communicationPattern.preferredTime.join(', ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Response Pattern</div>
                        <div className="text-sm text-gray-600">
                          {contact.aiInsights.communicationPattern.responseTimePattern}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Topic Preferences</div>
                      <div className="flex flex-wrap gap-2">
                        {contact.aiInsights.communicationPattern.topicPreferences.map((topic, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Sentiment Trend</div>
                      <div className={`text-sm font-medium ${
                        contact.aiInsights.communicationPattern.sentimentTrend === 'improving' ? 'text-green-600' :
                        contact.aiInsights.communicationPattern.sentimentTrend === 'declining' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {contact.aiInsights.communicationPattern.sentimentTrend}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Influence Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {contact.aiInsights.influenceMetrics.networkReach}
                      </div>
                      <div className="text-sm text-gray-500">Network Reach</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {contact.aiInsights.influenceMetrics.decisionMakingPower}%
                      </div>
                      <div className="text-sm text-gray-500">Decision Power</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {contact.aiInsights.influenceMetrics.recommendationLikelihood}%
                      </div>
                      <div className="text-sm text-gray-500">Recommendation</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {contact.aiInsights.engagementPrediction.likelihood}%
                      </div>
                      <div className="text-sm text-gray-500">Engagement</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Prediction</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Best Approach</div>
                      <div className="text-sm text-gray-600">
                        {contact.aiInsights.engagementPrediction.bestApproach}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Optimal Timing</div>
                      <div className="text-sm text-gray-600">
                        {contact.aiInsights.engagementPrediction.optimalTiming}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Suggested Topics</div>
                      <div className="flex flex-wrap gap-2">
                        {contact.aiInsights.engagementPrediction.suggestedTopics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {contact.aiInsights.riskAssessment.churnProbability}%
                          </div>
                          <div className="text-sm text-gray-500">Churn Risk</div>
                        </div>
                        <AlertCircle className={`${
                          contact.aiInsights.riskAssessment.churnProbability > 70 ? 'text-red-600' :
                          contact.aiInsights.riskAssessment.churnProbability > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`} size={20} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {contact.aiInsights.riskAssessment.competitorRisk}%
                          </div>
                          <div className="text-sm text-gray-500">Competitor Risk</div>
                        </div>
                        <Shield className={`${
                          contact.aiInsights.riskAssessment.competitorRisk > 70 ? 'text-red-600' :
                          contact.aiInsights.riskAssessment.competitorRisk > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`} size={20} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {contact.aiInsights.riskAssessment.satisfactionScore}%
                          </div>
                          <div className="text-sm text-gray-500">Satisfaction</div>
                        </div>
                        <Heart className={`${
                          contact.aiInsights.riskAssessment.satisfactionScore > 70 ? 'text-green-600' :
                          contact.aiInsights.riskAssessment.satisfactionScore > 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`} size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI insights yet</h3>
                <p className="text-gray-500 mb-4">Generate AI insights to see communication patterns and predictions</p>
                <button
                  onClick={() => generateAIInsights(contact.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Brain size={16} />
                  Generate Insights
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Relationships</h3>
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                Add Relationship
              </button>
            </div>
            
            {contact.relationships.length > 0 ? (
              <div className="space-y-3">
                {contact.relationships.map((relationship, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {contacts.find(c => c.id === relationship.contactId)?.firstName || 'Unknown Contact'}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {relationship.type} • Strength: {relationship.strength}%
                        </div>
                        <div className="text-sm text-gray-500">{relationship.context}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Since {relationship.establishedDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships mapped</h3>
                <p className="text-gray-500 mb-4">Start mapping relationships to understand network connections</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Plus size={16} />
                  Add Relationship
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 