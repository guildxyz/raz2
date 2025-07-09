import { IdeaStore } from './idea-store'
import type { IdeaStoreConfig } from './types'
import { IDEA_STORE_CONFIG } from '@raz2/shared'

async function ideaStoreExample() {
  const config: IdeaStoreConfig = {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/ideas_db',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.EMBEDDING_MODEL || IDEA_STORE_CONFIG.DEFAULT_EMBEDDING_MODEL,
    vectorDimension: IDEA_STORE_CONFIG.DEFAULT_VECTOR_DIMENSION
  }

  if (!config.openaiApiKey) {
    console.log('OPENAI_API_KEY environment variable is required')
    return
  }

  const ideaStore = new IdeaStore(config)
  
  try {
    console.log('Initializing idea store...')
    await ideaStore.initialize()
    
    console.log('Creating strategic ideas...')
    const idea1 = await ideaStore.createIdea({
      title: 'Enterprise Multi-Guild Strategy',
      content: 'Develop a comprehensive strategy for enterprise clients to create and manage multiple guilds within their organization. Focus on hierarchical permissions, cross-guild analytics, and enterprise SSO integration.',
      category: 'strategy',
      priority: 'high',
      tags: ['enterprise', 'multi-guild', 'permissions', 'analytics'],
      userId: 'raz',
        chatId: 456,
      reminders: [
        {
          type: 'once',
          scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
          message: 'Review multi-guild strategy with product team'
        }
      ]
    })
    
    const idea2 = await ideaStore.createIdea({
      title: 'AI-Powered Guild Member Engagement',
      content: 'Implement AI recommendations for guild activities, personalized member onboarding, and automated engagement campaigns. Could increase retention by 30% based on early tests.',
      category: 'product',
      priority: 'medium',
      tags: ['ai', 'engagement', 'retention', 'personalization'],
      userId: 'raz',
        chatId: 456,
      reminders: [
        {
          type: 'weekly',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          message: 'Check AI engagement metrics and A/B test results'
        }
      ]
    })
    
    console.log('Idea 1 created:', idea1.id)
    console.log('Idea 2 created:', idea2.id)
    
    console.log('\nSearching for enterprise strategy ideas...')
    const searchResults = await ideaStore.searchIdeas('enterprise client strategy', {
      limit: 5,
      threshold: 0.1,
      filter: { userId: 'raz' }
    })
    
    console.log(`Found ${searchResults.length} relevant ideas:`)
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. Score: ${result.score.toFixed(3)}`)
      console.log(`   Title: ${result.idea.title}`)
      console.log(`   Content: ${result.idea.content}`)
      console.log(`   Category: ${result.idea.category}`)
      console.log(`   Priority: ${result.idea.priority}`)
      console.log(`   Tags: ${result.idea.tags.join(', ') || 'none'}`)
      console.log('')
    })
    
    console.log('Listing all strategic ideas...')
    const allIdeas = await ideaStore.listIdeas({ userId: 'raz' })
    console.log(`Total ideas: ${allIdeas.length}`)
    
    console.log('\nChecking for due reminders...')
    const dueReminders = await ideaStore.getDueReminders()
    console.log(`Due reminders: ${dueReminders.length}`)
    
    dueReminders.forEach((reminder, index) => {
      console.log(`${index + 1}. Reminder for idea: ${reminder.ideaId}`)
      console.log(`   Type: ${reminder.type}`)
      console.log(`   Message: ${reminder.message}`)
      console.log(`   Scheduled: ${reminder.scheduledFor}`)
    })
    
    console.log('\nGetting idea store stats...')
    const stats = await ideaStore.getStats()
    console.log(`Total ideas in index: ${stats.count}`)
    console.log(`Index size: ${stats.indexSize} MB`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await ideaStore.disconnect()
    console.log('Disconnected from Redis')
  }
}

// Run example if this file is executed directly
ideaStoreExample().catch(console.error) 