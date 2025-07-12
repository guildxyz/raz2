import type { Contact } from '../types'

export const mockContacts: Contact[] = [
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