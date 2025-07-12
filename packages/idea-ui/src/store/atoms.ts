import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Idea, CreateIdeaInput, UpdateIdeaInput, Subtask, KanbanColumn, Conversation, ConversationFilter, ConversationSearchResult, CreateConversationInput, UpdateConversationInput } from '../types'
import { aiTaskBreakdownService } from '../services/aiTaskBreakdown'
import { conversationService } from '../services/conversationService'
import type { Contact, ContactFilter, ContactSearchResult, ContactAnalytics, CreateContactInput, UpdateContactInput } from '../types'
import { contactService } from '../services/contactService'

const API_BASE_URL = 'http://localhost:3000/api'
const ZAWIASA_USER_ID = 'raz'

const generateId = () => Math.random().toString(36).substr(2, 9)

const createKanbanColumns = (subtasks: Subtask[]): KanbanColumn[] => {
  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', subtasks: [] },
    { id: 'in_progress', title: 'In Progress', subtasks: [] },
    { id: 'review', title: 'Review', subtasks: [] },
    { id: 'done', title: 'Done', subtasks: [] }
  ]

  subtasks.forEach(subtask => {
    const column = columns.find(col => col.id === subtask.status)
    if (column) {
      column.subtasks.push(subtask)
    }
  })

  return columns
}

export const ideasAtom = atomWithStorage<Idea[]>('strategic-ideas', [])
export const loadingAtom = atom<boolean>(false)
export const errorAtom = atom<string | null>(null)

export const createIdeaAtom = atom(
  null,
  async (_get, set, input: CreateIdeaInput) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          userId: ZAWIASA_USER_ID,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create idea: ${response.statusText}`)
      }
      
      const newIdea = await response.json()
      set(ideasAtom, prev => [newIdea, ...prev])
    } catch (err) {
      console.warn('API not available, using AI breakdown locally:', err)
      
      const aiBreakdown = await aiTaskBreakdownService.breakdownIdea({
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium'
      })

      const subtasks: Subtask[] = aiBreakdown.subtasks.map(subtask => ({
        ...subtask,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const newIdea: Idea = {
        id: generateId(),
        title: input.title,
        content: input.content,
        category: input.category || 'strategy',
        priority: input.priority || 'medium',
        status: 'active',
        tags: input.tags || [],
        userId: ZAWIASA_USER_ID,
        chatId: input.chatId,
        subtasks,
        kanbanColumns: createKanbanColumns(subtasks),
        aiBreakdown,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      set(ideasAtom, prev => [newIdea, ...prev])
    } finally {
      set(loadingAtom, false)
    }
  }
)

export const updateIdeaAtom = atom(
  null,
  async (_get, set, input: UpdateIdeaInput) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${input.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update idea: ${response.statusText}`)
      }
      
      const updatedIdea = await response.json()
      set(ideasAtom, prev => prev.map(idea => 
        idea.id === input.id ? updatedIdea : idea
      ))
    } catch (err) {
      console.warn('API not available, updating locally:', err)
      
      set(ideasAtom, prev => prev.map(idea => {
        if (idea.id !== input.id) return idea
        
        const updated = { 
          ...idea, 
          ...input, 
          updatedAt: new Date() 
        }

        if (input.regenerateSubtasks && input.title && input.content) {
          aiTaskBreakdownService.breakdownIdea({
            title: input.title,
            content: input.content,
            category: updated.category,
            priority: updated.priority
          }).then(aiBreakdown => {
            const newSubtasks: Subtask[] = aiBreakdown.subtasks.map(subtask => ({
              ...subtask,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date()
            }))

            set(ideasAtom, prevIdeas => prevIdeas.map(prevIdea => 
              prevIdea.id === input.id ? {
                ...prevIdea,
                subtasks: newSubtasks,
                kanbanColumns: createKanbanColumns(newSubtasks),
                aiBreakdown
              } : prevIdea
            ))
          })
        } else if (input.subtasks) {
          updated.subtasks = input.subtasks
          updated.kanbanColumns = createKanbanColumns(input.subtasks)
        }

        return updated
      }))
    } finally {
      set(loadingAtom, false)
    }
  }
)

export const updateSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtaskId, updates }: { ideaId: string, subtaskId: string, updates: Partial<Subtask> }) => {
    set(ideasAtom, prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = idea.subtasks.map(s => 
        s.id === subtaskId ? { ...s, ...updates, updatedAt: new Date() } : s
      )
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }
)

export const createSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtask }: { ideaId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'> }) => {
    const newSubtask: Subtask = {
      ...subtask,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    set(ideasAtom, prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = [...idea.subtasks, newSubtask]
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }
)

export const deleteSubtaskAtom = atom(
  null,
  (get, set, { ideaId, subtaskId }: { ideaId: string, subtaskId: string }) => {
    set(ideasAtom, prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea
      
      const updatedSubtasks = idea.subtasks.filter(s => s.id !== subtaskId)
      
      return {
        ...idea,
        subtasks: updatedSubtasks,
        kanbanColumns: createKanbanColumns(updatedSubtasks),
        updatedAt: new Date()
      }
    }))
  }
)

export const deleteIdeaAtom = atom(
  null,
  async (get, set, id: string) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${id}?userId=${ZAWIASA_USER_ID}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete idea: ${response.statusText}`)
      }
      
      set(ideasAtom, prev => prev.filter(idea => idea.id !== id))
    } catch (err) {
      set(errorAtom, err instanceof Error ? err.message : 'Failed to delete idea')
    } finally {
      set(loadingAtom, false)
    }
  }
)

export const refreshIdeasAtom = atom(
  null,
  async (get, set) => {
    set(loadingAtom, true)
    set(errorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/ideas?userId=${ZAWIASA_USER_ID}&limit=1000`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`)
      }
      
      const fetchedIdeas = await response.json()
      set(ideasAtom, fetchedIdeas.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
      })))
    } catch (err) {
      console.warn('API not available, using local storage:', err)
      set(errorAtom, null)
    } finally {
      set(loadingAtom, false)
    }
  }
) 

export const conversationsAtom = atomWithStorage<Conversation[]>('strategic-conversations', [])
export const conversationLoadingAtom = atom<boolean>(false)
export const conversationErrorAtom = atom<string | null>(null)
export const conversationFiltersAtom = atom<Partial<ConversationFilter>>({})
export const conversationSearchResultsAtom = atom<ConversationSearchResult[]>([])
export const selectedConversationAtom = atom<Conversation | null>(null)

export const refreshConversationsAtom = atom(
  null,
  async (get, set) => {
    set(conversationLoadingAtom, true)
    set(conversationErrorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations?userId=${ZAWIASA_USER_ID}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`)
      }
      
      const fetchedConversations = await response.json()
      const processedConversations = fetchedConversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        lastActivity: new Date(conv.lastActivity),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
      
      set(conversationsAtom, processedConversations)
    } catch (err) {
      console.warn('API not available, using mock conversations:', err)
      set(conversationsAtom, generateMockConversations())
      set(conversationErrorAtom, null)
    } finally {
      set(conversationLoadingAtom, false)
    }
  }
)

export const createConversationAtom = atom(
  null,
  async (get, set, input: CreateConversationInput) => {
    set(conversationLoadingAtom, true)
    set(conversationErrorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`)
      }
      
      const newConversation = await response.json()
      set(conversationsAtom, prev => [newConversation, ...prev])
    } catch (err) {
      console.warn('API not available, creating conversation locally:', err)
      
      const newConversation: Conversation = {
        id: conversationService.generateId(),
        chatId: input.chatId,
        title: input.title,
        type: input.type,
        participants: input.participants.map(p => ({
          ...p,
          messageCount: 0,
          firstSeen: new Date(),
          lastSeen: new Date(),
          isActive: true
        })),
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
        tags: input.tags || [],
        analytics: {
          messageCount: 0,
          participantCount: input.participants.length,
          averageResponseTime: 0,
          mostActiveTimeOfDay: '12:00',
          commonTopics: [],
          sentimentTrend: [],
          wordCloudData: [],
          commandUsage: [],
          messageTypes: [],
          conversationFlow: {
            userMessages: 0,
            botResponses: 0,
            commands: 0,
            systemMessages: 0
          }
        },
        priority: input.priority || 'medium',
        archived: false
      }
      
      set(conversationsAtom, prev => [newConversation, ...prev])
    } finally {
      set(conversationLoadingAtom, false)
    }
  }
)

export const updateConversationAtom = atom(
  null,
  async (get, set, input: UpdateConversationInput) => {
    set(conversationLoadingAtom, true)
    set(conversationErrorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update conversation: ${response.statusText}`)
      }
      
      const updatedConversation = await response.json()
      set(conversationsAtom, prev => prev.map(conv => 
        conv.id === input.id ? updatedConversation : conv
      ))
    } catch (err) {
      console.warn('API not available, updating locally:', err)
      
      set(conversationsAtom, prev => prev.map(conv => {
        if (conv.id !== input.id) return conv
        
        return {
          ...conv,
          ...input,
          lastActivity: new Date()
        }
      }))
    } finally {
      set(conversationLoadingAtom, false)
    }
  }
)

export const deleteConversationAtom = atom(
  null,
  async (get, set, id: string) => {
    set(conversationLoadingAtom, true)
    set(conversationErrorAtom, null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`)
      }
      
      set(conversationsAtom, prev => prev.filter(conv => conv.id !== id))
      
      const selected = get(selectedConversationAtom)
      if (selected && selected.id === id) {
        set(selectedConversationAtom, null)
      }
    } catch (err) {
      set(conversationErrorAtom, err instanceof Error ? err.message : 'Failed to delete conversation')
    } finally {
      set(conversationLoadingAtom, false)
    }
  }
)

export const searchConversationsAtom = atom(
  null,
  (get, set, { query, filters }: { query: string, filters?: Partial<ConversationFilter> }) => {
    const conversations = get(conversationsAtom)
    const results = conversationService.searchConversations(conversations, query, filters)
    set(conversationSearchResultsAtom, results)
    set(conversationFiltersAtom, filters || {})
  }
)

export const analyzeConversationAtom = atom(
  null,
  async (get, set, conversationId: string) => {
    set(conversationLoadingAtom, true)
    set(conversationErrorAtom, null)
    
    try {
      const conversations = get(conversationsAtom)
      const conversation = conversations.find(c => c.id === conversationId)
      
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      
      const insights = await conversationService.analyzeConversationWithAI(conversation)
      const analytics = conversationService.calculateAnalytics(conversation)
      
      const updatedConversation = {
        ...conversation,
        aiInsights: insights,
        analytics
      }
      
      set(conversationsAtom, prev => prev.map(conv =>
        conv.id === conversationId ? updatedConversation : conv
      ))
      
      set(selectedConversationAtom, updatedConversation)
    } catch (err) {
      set(conversationErrorAtom, err instanceof Error ? err.message : 'Failed to analyze conversation')
    } finally {
      set(conversationLoadingAtom, false)
    }
  }
)

export const exportConversationAtom = atom(
  null,
  async (get, set, { conversationId, format }: { conversationId: string, format: 'json' | 'csv' | 'pdf' }) => {
    const conversations = get(conversationsAtom)
    const conversation = conversations.find(c => c.id === conversationId)
    
    if (!conversation) {
      throw new Error('Conversation not found')
    }
    
    const blob = await conversationService.exportConversation(conversation, format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${conversation.title}-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
)

export const contactsAtom = atom<Contact[]>([])

export const contactFilterAtom = atom<ContactFilter>({})

export const contactSearchQueryAtom = atom('')

export const contactSearchResultsAtom = atom<ContactSearchResult[]>([])

export const selectedContactIdAtom = atom<string | null>(null)

export const contactAnalyticsAtom = atom<ContactAnalytics | null>(null)

export const contactLoadingAtom = atom(false)

export const contactErrorAtom = atom<string | null>(null)

export const loadContactsAtom = atom(
  null,
  async (get, set) => {
    set(contactLoadingAtom, true)
    set(contactErrorAtom, null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockContacts: Contact[] = [
        {
          id: '1',
          username: 'razvan_cosma',
          firstName: 'Razvan',
          lastName: 'Cosma',
          email: 'razvan@guild.xyz',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          company: 'Guild.xyz',
          position: 'CEO',
          linkedinUrl: 'https://linkedin.com/in/razvan-cosma',
          twitterUrl: 'https://twitter.com/razvan_cosma',
          website: 'https://guild.xyz',
          joinedAt: new Date('2024-01-15'),
          lastSeen: new Date(Date.now() - 5 * 60 * 1000),
          isActive: true,
          totalMessages: 847,
          totalInteractions: 1240,
          avgResponseTime: '2.3 minutes',
          primaryTopics: ['Strategy', 'Product Vision', 'Enterprise Sales', 'Team Building'],
          secondaryTopics: ['Web3', 'DAO Governance', 'Funding', 'Partnerships'],
          interactionScore: 95,
          influenceWeight: 100,
          role: 'advisor',
          decisionAreas: ['Strategic Direction', 'Product Vision', 'Market Entry', 'Partnerships'],
          trustLevel: 'high',
          priority: 'urgent',
          status: 'active',
          tags: ['Founder', 'Strategic Partner', 'Key Decision Maker'],
          source: 'telegram',
          interactions: [
            {
              id: '1',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              type: 'message',
              topic: 'Enterprise Sales Strategy',
              sentiment: 'positive',
              followUpRequired: false,
              notes: 'Discussed Q1 sales targets and client outreach strategy'
            },
            {
              id: '2',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              type: 'meeting',
              duration: 60,
              topic: 'Product Roadmap Review',
              sentiment: 'positive',
              outcome: 'Approved new feature priorities',
              followUpRequired: true,
              notes: 'Need to follow up on developer resource allocation'
            }
          ],
          relationships: [
            {
              contactId: '2',
              type: 'direct',
              strength: 95,
              context: 'Co-founded Guild.xyz together',
              establishedDate: new Date('2022-01-01')
            }
          ],
          preferences: {
            preferredTime: 'Morning (9-11 AM)',
            timezone: 'PST',
            communicationStyle: 'formal',
            interests: ['Strategic Planning', 'Web3 Innovation', 'Team Leadership', 'Market Analysis'],
            languages: ['English', 'Romanian']
          },
          businessContext: {
            industry: 'Web3 Infrastructure',
            companySize: '50-100 employees',
            budget: '$10M+ ARR',
            decisionTimeline: 'Quarterly planning cycles',
            painPoints: ['Scaling enterprise sales', 'Developer adoption', 'Regulatory compliance'],
            goals: ['$50M ARR by 2025', 'Enterprise market dominance', 'Global expansion']
          },
          conversationHistory: [
            {
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              messageCount: 12,
              topic: 'Enterprise Sales Strategy',
              sentiment: 'positive',
              keyPoints: ['Q1 targets', 'Client segmentation', 'Sales process optimization'],
              actionItems: ['Update CRM', 'Schedule client calls', 'Review pricing strategy']
            },
            {
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              messageCount: 8,
              topic: 'Product Innovation',
              sentiment: 'positive',
              keyPoints: ['New feature concepts', 'User feedback analysis', 'Technical feasibility'],
              actionItems: ['Prototype development', 'User testing', 'Technical specs']
            }
          ],
          notes: [
            'Extremely responsive and decisive',
            'Prefers data-driven discussions',
            'Available for urgent matters via Telegram',
            'Weekly strategy calls on Mondays at 10 AM PST'
          ],
          reminders: [
            {
              id: '1',
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              type: 'follow_up',
              title: 'Follow up on developer resources',
              description: 'Check on progress of new hire approvals',
              completed: false
            }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        },
        {
          id: '2',
          username: 'sarah_tech',
          firstName: 'Sarah',
          lastName: 'Chen',
          email: 'sarah.chen@techcorp.com',
          phone: '+1 (555) 987-6543',
          location: 'Austin, TX',
          company: 'TechCorp Solutions',
          position: 'CTO',
          linkedinUrl: 'https://linkedin.com/in/sarah-chen-cto',
          joinedAt: new Date('2024-02-01'),
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true,
          totalMessages: 234,
          totalInteractions: 456,
          avgResponseTime: '45 minutes',
          primaryTopics: ['Technical Integration', 'API Development', 'Security'],
          secondaryTopics: ['Scalability', 'Cloud Architecture', 'DevOps'],
          interactionScore: 78,
          influenceWeight: 85,
          role: 'stakeholder',
          decisionAreas: ['Technical Architecture', 'Integration Decisions', 'Security Policies'],
          trustLevel: 'high',
          priority: 'high',
          status: 'active',
          tags: ['Technical Leader', 'Integration Partner', 'Security Expert'],
          source: 'email',
          interactions: [
            {
              id: '3',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              type: 'email',
              topic: 'API Integration Security',
              sentiment: 'neutral',
              followUpRequired: true,
              notes: 'Raised concerns about authentication methods'
            }
          ],
          relationships: [],
          preferences: {
            preferredTime: 'Afternoon (2-4 PM)',
            timezone: 'CST',
            communicationStyle: 'casual',
            interests: ['Cloud Technologies', 'Cybersecurity', 'AI/ML'],
            languages: ['English', 'Mandarin']
          },
          businessContext: {
            industry: 'Enterprise Software',
            companySize: '500-1000 employees',
            budget: '$5M technology budget',
            decisionTimeline: 'Monthly technical reviews',
            painPoints: ['Legacy system integration', 'Security compliance', 'Scalability challenges'],
            goals: ['Modernize infrastructure', 'Improve security posture', 'Reduce technical debt']
          },
          conversationHistory: [
            {
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              messageCount: 6,
              topic: 'API Security Review',
              sentiment: 'neutral',
              keyPoints: ['Authentication protocols', 'Rate limiting', 'Monitoring'],
              actionItems: ['Security audit', 'Protocol documentation', 'Monitoring setup']
            }
          ],
          notes: [
            'Very security-conscious',
            'Prefers detailed technical documentation',
            'Responds well to data and metrics'
          ],
          reminders: [
            {
              id: '2',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              type: 'follow_up',
              title: 'API security documentation',
              description: 'Send updated security protocols',
              completed: false
            }
          ],
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date()
        },
        {
          id: '3',
          username: 'alex_investor',
          firstName: 'Alex',
          lastName: 'Rodriguez',
          email: 'alex@venturetech.com',
          location: 'New York, NY',
          company: 'VentureTech Capital',
          position: 'Managing Partner',
          joinedAt: new Date('2023-11-20'),
          lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isActive: true,
          totalMessages: 156,
          totalInteractions: 234,
          avgResponseTime: '4 hours',
          primaryTopics: ['Funding', 'Market Analysis', 'Growth Strategy'],
          secondaryTopics: ['Due Diligence', 'Portfolio Management', 'Exit Strategy'],
          interactionScore: 82,
          influenceWeight: 92,
          role: 'investor',
          decisionAreas: ['Investment Decisions', 'Strategic Guidance', 'Board Matters'],
          trustLevel: 'high',
          priority: 'high',
          status: 'active',
          tags: ['Series A Lead', 'Strategic Advisor', 'Board Member'],
          source: 'meeting',
          interactions: [
            {
              id: '4',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              type: 'meeting',
              duration: 90,
              topic: 'Q4 Performance Review',
              sentiment: 'positive',
              outcome: 'Approved additional funding round',
              followUpRequired: false,
              notes: 'Very pleased with growth metrics'
            }
          ],
          relationships: [],
          preferences: {
            preferredTime: 'Late afternoon (4-6 PM)',
            timezone: 'EST',
            communicationStyle: 'formal',
            interests: ['Market Trends', 'Startup Ecosystems', 'Technology Innovation'],
            languages: ['English', 'Spanish']
          },
          businessContext: {
            industry: 'Venture Capital',
            companySize: '20-50 employees',
            budget: '$500M fund size',
            decisionTimeline: 'Quarterly board meetings',
            painPoints: ['Market volatility', 'Portfolio company support', 'Exit timing'],
            goals: ['Superior returns', 'Portfolio growth', 'Strategic exits']
          },
          conversationHistory: [
            {
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              messageCount: 4,
              topic: 'Quarterly Review',
              sentiment: 'positive',
              keyPoints: ['Growth metrics', 'Market position', 'Future funding'],
              actionItems: ['Board presentation', 'Metrics dashboard', 'Strategic planning']
            }
          ],
          notes: [
            'Responds quickly to urgent matters',
            'Prefers executive summaries',
            'Values transparency and regular updates'
          ],
          reminders: [],
          createdAt: new Date('2023-11-20'),
          updatedAt: new Date()
        }
      ]
      
      set(contactsAtom, mockContacts)
    } catch (error) {
      set(contactErrorAtom, error instanceof Error ? error.message : 'Failed to load contacts')
    } finally {
      set(contactLoadingAtom, false)
    }
  }
)

export const searchContactsAtom = atom(
  null,
  async (get, set, query: string) => {
    const contacts = get(contactsAtom)
    
    if (!query.trim()) {
      set(contactSearchResultsAtom, [])
      return
    }
    
    try {
      const results = await contactService.searchContacts(query, contacts)
      set(contactSearchResultsAtom, results)
    } catch (error) {
      console.error('Contact search error:', error)
      set(contactSearchResultsAtom, [])
    }
  }
)

export const filteredContactsAtom = atom((get) => {
  const contacts = get(contactsAtom)
  const filter = get(contactFilterAtom)
  
  if (Object.keys(filter).length === 0) {
    return contacts
  }
  
  return contactService.filterContacts(contacts, filter)
})

export const calculateContactAnalyticsAtom = atom(
  null,
  async (get, set) => {
    const contacts = get(contactsAtom)
    
    try {
      const analytics = contactService.calculateAnalytics(contacts)
      set(contactAnalyticsAtom, analytics)
    } catch (error) {
      console.error('Contact analytics error:', error)
      set(contactAnalyticsAtom, null)
    }
  }
)

export const createContactAtom = atom(
  null,
  async (get, set, input: CreateContactInput) => {
    set(contactLoadingAtom, true)
    set(contactErrorAtom, null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const contacts = get(contactsAtom)
      const now = new Date()
      
      const newContact: Contact = {
        id: Math.random().toString(36).substr(2, 9),
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        location: input.location,
        company: input.company,
        position: input.position,
        joinedAt: now,
        lastSeen: now,
        isActive: true,
        totalMessages: 0,
        totalInteractions: 0,
        avgResponseTime: '0 minutes',
        primaryTopics: [],
        secondaryTopics: [],
        interactionScore: 50,
        influenceWeight: 50,
        role: input.role,
        decisionAreas: [],
        trustLevel: 'medium',
        priority: 'medium',
        status: 'active',
        tags: input.tags || [],
        source: input.source,
        interactions: [],
        relationships: [],
        preferences: {
          preferredTime: 'Business hours',
          communicationStyle: 'formal',
          interests: [],
          languages: ['English']
        },
        businessContext: {
          industry: input.businessContext?.industry || '',
          companySize: input.businessContext?.companySize || '',
          painPoints: input.businessContext?.painPoints || [],
          goals: input.businessContext?.goals || []
        },
        conversationHistory: [],
        notes: input.notes || [],
        reminders: [],
        createdAt: now,
        updatedAt: now
      }
      
      set(contactsAtom, [newContact, ...contacts])
    } catch (error) {
      set(contactErrorAtom, error instanceof Error ? error.message : 'Failed to create contact')
      throw error
    } finally {
      set(contactLoadingAtom, false)
    }
  }
)

export const updateContactAtom = atom(
  null,
  async (get, set, input: UpdateContactInput) => {
    set(contactLoadingAtom, true)
    set(contactErrorAtom, null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const contacts = get(contactsAtom)
      const updatedContacts = contacts.map(contact => {
        if (contact.id === input.id) {
          return {
            ...contact,
            ...input,
            updatedAt: new Date()
          }
        }
        return contact
      })
      
      set(contactsAtom, updatedContacts)
    } catch (error) {
      set(contactErrorAtom, error instanceof Error ? error.message : 'Failed to update contact')
      throw error
    } finally {
      set(contactLoadingAtom, false)
    }
  }
)

export const deleteContactAtom = atom(
  null,
  async (get, set, contactId: string) => {
    set(contactLoadingAtom, true)
    set(contactErrorAtom, null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const contacts = get(contactsAtom)
      const filteredContacts = contacts.filter(contact => contact.id !== contactId)
      
      set(contactsAtom, filteredContacts)
      
      const selectedId = get(selectedContactIdAtom)
      if (selectedId === contactId) {
        set(selectedContactIdAtom, null)
      }
    } catch (error) {
      set(contactErrorAtom, error instanceof Error ? error.message : 'Failed to delete contact')
      throw error
    } finally {
      set(contactLoadingAtom, false)
    }
  }
)

export const generateContactAIInsightsAtom = atom(
  null,
  async (get, set, contactId: string) => {
    const contacts = get(contactsAtom)
    const contact = contacts.find(c => c.id === contactId)
    
    if (!contact) return null
    
    try {
      const insights = contactService.generateAIInsights(contact)
      
      const updatedContacts = contacts.map(c => 
        c.id === contactId ? { ...c, aiInsights: insights, updatedAt: new Date() } : c
      )
      
      set(contactsAtom, updatedContacts)
      return insights
    } catch (error) {
      console.error('AI insights generation error:', error)
      return null
    }
  }
)

export const exportContactsAtom = atom(
  null,
  async (get, set, format: 'json' | 'csv') => {
    const contacts = get(filteredContactsAtom)
    
    try {
      const exportData = await contactService.exportContacts(contacts, format)
      
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contacts_export_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return exportData
    } catch (error) {
      set(contactErrorAtom, error instanceof Error ? error.message : 'Failed to export contacts')
      throw error
    }
  }
) 