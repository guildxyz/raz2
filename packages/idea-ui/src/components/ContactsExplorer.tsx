import { useState, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit,
  Trash2,
  Users, 
  Building,
  MapPin,
  Star,
  TrendingUp,
  MessageCircle,
  Activity,
  Clock,
  Brain,
  Download,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import {
  contactsAtom,
  filteredContactsAtom,
  contactFilterAtom,
  contactSearchQueryAtom,
  contactSearchResultsAtom,
  selectedContactIdAtom,
  contactAnalyticsAtom,
  contactLoadingAtom,
  contactErrorAtom,
  loadContactsAtom,
  searchContactsAtom,
  calculateContactAnalyticsAtom,
  createContactAtom,
  updateContactAtom,
  deleteContactAtom,
  generateContactAIInsightsAtom,
  exportContactsAtom
} from '../store'
import type { 
  Contact, 
  ContactFilter, 
  CreateContactInput, 
  UpdateContactInput,
  ContactSearchResult 
} from '../types'

export const ContactsExplorer = () => {
  const contacts = useAtomValue(contactsAtom)
  const filteredContacts = useAtomValue(filteredContactsAtom)
  const filter = useAtomValue(contactFilterAtom)
  const searchQuery = useAtomValue(contactSearchQueryAtom)
  const searchResults = useAtomValue(contactSearchResultsAtom)
  const selectedContactId = useAtomValue(selectedContactIdAtom)
  const analytics = useAtomValue(contactAnalyticsAtom)
  const loading = useAtomValue(contactLoadingAtom)
  const error = useAtomValue(contactErrorAtom)
  
  const setFilter = useSetAtom(contactFilterAtom)
  const setSelectedContactId = useSetAtom(selectedContactIdAtom)
  const loadContacts = useSetAtom(loadContactsAtom)
  const searchContacts = useSetAtom(searchContactsAtom)
  const calculateAnalytics = useSetAtom(calculateContactAnalyticsAtom)
  const createContact = useSetAtom(createContactAtom)
  const updateContact = useSetAtom(updateContactAtom)
  const deleteContact = useSetAtom(deleteContactAtom)
  const generateAIInsights = useSetAtom(generateContactAIInsightsAtom)
  const exportContacts = useSetAtom(exportContactsAtom)

  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'lastSeen' | 'interactionScore' | 'influenceWeight'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  useEffect(() => {
    loadContacts()
    calculateAnalytics()
  }, [loadContacts, calculateAnalytics])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        searchContacts(localSearchQuery)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [localSearchQuery, searchQuery, searchContacts])

  useEffect(() => {
    if (contacts.length > 0) {
      calculateAnalytics()
    }
  }, [contacts, calculateAnalytics])

  const handleFilterChange = (newFilter: Partial<ContactFilter>) => {
    setFilter({ ...filter, ...newFilter })
  }

  const handleCreateContact = async (input: CreateContactInput) => {
    try {
      await createContact(input)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
  }

  const handleUpdateContact = async (input: UpdateContactInput) => {
    try {
      await updateContact(input)
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contactId)
      } catch (error) {
        console.error('Failed to delete contact:', error)
      }
    }
  }

  const handleGenerateInsights = async (contactId: string) => {
    try {
      await generateAIInsights(contactId)
    } catch (error) {
      console.error('Failed to generate insights:', error)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      await exportContacts(format)
    } catch (error) {
      console.error('Failed to export contacts:', error)
    }
  }

  const sortedContacts = [...(searchQuery ? searchResults.map(r => r.contact) : filteredContacts)]
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName || ''}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName || ''}`.toLowerCase()
          break
        case 'lastSeen':
          aValue = a.lastSeen.getTime()
          bValue = b.lastSeen.getTime()
          break
        case 'interactionScore':
          aValue = a.interactionScore
          bValue = b.interactionScore
          break
        case 'influenceWeight':
          aValue = a.influenceWeight
          bValue = b.influenceWeight
          break
        default:
          aValue = a.firstName.toLowerCase()
          bValue = b.firstName.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

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
      case 'stakeholder': return <Users className="text-purple-600" size={16} />
      case 'expert': return <Users className="text-green-600" size={16} />
      case 'investor': return <TrendingUp className="text-emerald-600" size={16} />
      case 'team': return <Users className="text-indigo-600" size={16} />
      case 'client': return <Building className="text-orange-600" size={16} />
      case 'partner': return <Users className="text-pink-600" size={16} />
      case 'competitor': return <Users className="text-red-600" size={16} />
      default: return <Users className="text-gray-600" size={16} />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600">
          <Activity className="animate-spin" size={20} />
          Loading contacts...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalContacts}</div>
                <div className="text-sm text-gray-500">Total Contacts</div>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.activeContacts}</div>
                <div className="text-sm text-gray-500">Active Contacts</div>
              </div>
              <Activity className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalInteractions}</div>
                <div className="text-sm text-gray-500">Total Interactions</div>
              </div>
              <MessageCircle className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(analytics.avgInfluenceWeight)}</div>
                <div className="text-sm text-gray-500">Avg Influence</div>
              </div>
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 flex h-[800px]">
        {/* Left Panel - Contact Management */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Management
              </h2>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Brain size={16} />
                  Analytics
                </button>
                
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Download size={16} />
                  Export
                </button>
                
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Contact
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                    showFilters || Object.keys(filter).length > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter size={16} />
                  Filters
                </button>
                
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-')
                    setSortBy(sort as typeof sortBy)
                    setSortOrder(order as typeof sortOrder)
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="lastSeen-desc">Recently Active</option>
                  <option value="interactionScore-desc">Highest Interaction</option>
                  <option value="influenceWeight-desc">Highest Influence</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      multiple
                      value={filter.roles || []}
                      onChange={(e) => handleFilterChange({
                        roles: Array.from(e.target.selectedOptions, option => option.value as Contact['role'])
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="advisor">Advisor</option>
                      <option value="colleague">Colleague</option>
                      <option value="stakeholder">Stakeholder</option>
                      <option value="expert">Expert</option>
                      <option value="investor">Investor</option>
                      <option value="team">Team</option>
                      <option value="client">Client</option>
                      <option value="partner">Partner</option>
                      <option value="competitor">Competitor</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      multiple
                      value={filter.priorities || []}
                      onChange={(e) => handleFilterChange({
                        priorities: Array.from(e.target.selectedOptions, option => option.value as Contact['priority'])
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => setFilter({})}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {sortedContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || Object.keys(filter).length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first contact'
                  }
                </p>
                {!searchQuery && Object.keys(filter).length === 0 && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedContacts.map((contact) => (
                  <ContactListItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onSelect={() => setSelectedContactId(contact.id)}
                    formatTimeAgo={formatTimeAgo}
                    getRoleIcon={getRoleIcon}
                    getTrustLevelColor={getTrustLevelColor}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Contact Details */}
        <div className="w-1/2 flex flex-col">
          {selectedContactId ? (
            <ContactDetailView
              contact={sortedContacts.find(c => c.id === selectedContactId)}
              onEdit={handleUpdateContact}
              onDelete={() => handleDeleteContact(selectedContactId)}
              onGenerateInsights={() => handleGenerateInsights(selectedContactId)}
              formatTimeAgo={formatTimeAgo}
              getRoleIcon={getRoleIcon}
              getTrustLevelColor={getTrustLevelColor}
              getPriorityColor={getPriorityColor}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Users className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contact</h3>
                <p className="text-gray-500">
                  Choose a contact from the list to view their details, interactions, and manage their information.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <CreateContactModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreateContact}
        />
      )}
    </div>
  )
}

interface ContactListItemProps {
  contact: Contact
  isSelected: boolean
  onSelect: () => void
  formatTimeAgo: (date: Date) => string
  getRoleIcon: (role: Contact['role']) => React.ReactElement
  getTrustLevelColor: (level: Contact['trustLevel']) => string
  getPriorityColor: (priority: Contact['priority']) => string
}

interface ContactDetailViewProps {
  contact?: Contact
  onEdit: (input: UpdateContactInput) => void
  onDelete: () => void
  onGenerateInsights: () => void
  formatTimeAgo: (date: Date) => string
  getRoleIcon: (role: Contact['role']) => React.ReactElement
  getTrustLevelColor: (level: Contact['trustLevel']) => string
  getPriorityColor: (priority: Contact['priority']) => string
}

const ContactListItem = ({
  contact,
  isSelected,
  onSelect,
  formatTimeAgo,
  getRoleIcon,
  getTrustLevelColor,
  getPriorityColor
}: ContactListItemProps) => {
  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="bg-gray-100 rounded-full p-2">
          <Users className="text-gray-600" size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 truncate">
              {contact.firstName} {contact.lastName}
            </div>
            {getRoleIcon(contact.role)}
          </div>
          
          <div className="text-sm text-gray-600 truncate">
            @{contact.username} • {contact.company || 'No company'}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(contact.priority)}`}>
              {contact.priority}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(contact.lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ContactDetailView = ({
  contact,
  onEdit,
  onDelete,
  onGenerateInsights,
  formatTimeAgo,
  getRoleIcon,
  getTrustLevelColor,
  getPriorityColor
}: ContactDetailViewProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'notes'>('overview')

  if (!contact) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 rounded-full p-3">
              <Users className="text-gray-600" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h3>
                {getRoleIcon(contact.role)}
              </div>
              <div className="text-gray-600">@{contact.username}</div>
              {contact.company && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <Building size={12} />
                  {contact.company} • {contact.position}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onGenerateInsights}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Brain size={14} />
              AI Insights
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(contact.trustLevel)}`}>
            {contact.trustLevel} trust
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(contact.priority)}`}>
            {contact.priority} priority
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {contact.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'interactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Interactions ({contact.interactions.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes ({contact.notes.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium">{contact.email || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium">{contact.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Location</div>
                  <div className="font-medium">{contact.location || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Source</div>
                  <div className="font-medium capitalize">{contact.source}</div>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Activity Stats</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <MessageCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Total Messages</div>
                  <div className="text-xl font-bold text-blue-900">{contact.totalMessages}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Interaction Score</div>
                  <div className="text-xl font-bold text-green-900">{contact.interactionScore}%</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">Influence Weight</div>
                  <div className="text-xl font-bold text-orange-900">{contact.influenceWeight}</div>
                </div>
              </div>
            </div>

            {/* Primary Topics & Tags */}
            <div className="grid grid-cols-2 gap-6">
              {contact.primaryTopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Primary Topics</h4>
                  <div className="flex flex-wrap gap-1">
                    {contact.primaryTopics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Business Context */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Business Context</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Industry</div>
                  <div className="font-medium">{contact.company ? 'Venture Capital' : 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Company Size</div>
                  <div className="font-medium">20-50 employees</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Pain Points</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Market volatility</span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Portfolio company support</span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Exit timing</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Goals</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Superior returns</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Portfolio growth</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Strategic exits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Last seen {formatTimeAgo(contact.lastSeen)}</div>
                <div>Average response time: {contact.avgResponseTime}</div>
              </div>
            </div>

            {/* Notes Preview */}
            {contact.notes && contact.notes.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                <div className="space-y-2">
                  {contact.notes.slice(0, 2).map((note, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="text-sm text-gray-700">{note}</div>
                    </div>
                  ))}
                  {contact.notes.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{contact.notes.length - 2} more notes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Interaction History</h4>
            {contact.interactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No interactions recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {contact.interactions.map((interaction) => (
                  <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{interaction.type}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          interaction.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          interaction.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interaction.sentiment}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(interaction.date)}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">{interaction.topic}</div>
                    {interaction.notes && (
                      <div className="text-sm text-gray-600">{interaction.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Plus size={14} />
                Add Note
              </button>
            </div>
            {contact.notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notes added yet
              </div>
            ) : (
              <div className="space-y-3">
                {contact.notes.map((note, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (input: CreateContactInput) => void
}

const CreateContactModal = ({ isOpen, onClose, onCreate }: CreateContactModalProps) => {
  const [formData, setFormData] = useState<CreateContactInput>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    position: '',
    role: 'colleague',
    source: 'email',
    tags: [],
    notes: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      company: '',
      position: '',
      role: 'colleague',
      source: 'email',
      tags: [],
      notes: []
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Contact</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Contact['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="colleague">Colleague</option>
                  <option value="advisor">Advisor</option>
                  <option value="stakeholder">Stakeholder</option>
                  <option value="expert">Expert</option>
                  <option value="investor">Investor</option>
                  <option value="team">Team</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                  <option value="competitor">Competitor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as Contact['source'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="telegram">Telegram</option>
                  <option value="meeting">Meeting</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social</option>
                  <option value="event">Event</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Contact
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 