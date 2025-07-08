import { MemoryStore } from './memory-store'
import type { MemoryStoreConfig } from './types'
import { MEMORY_STORE_CONFIG } from '@raz2/shared'

async function memoryStoreExample() {
  const config: MemoryStoreConfig = {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    indexName: process.env.MEMORY_INDEX_NAME || MEMORY_STORE_CONFIG.DEFAULT_INDEX_NAME,
    vectorDimension: MEMORY_STORE_CONFIG.DEFAULT_VECTOR_DIMENSION,
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.EMBEDDING_MODEL || MEMORY_STORE_CONFIG.DEFAULT_EMBEDDING_MODEL
  }

  if (!config.openaiApiKey) {
    console.log('OPENAI_API_KEY environment variable is required')
    return
  }

  const memoryStore = new MemoryStore(config)
  
  try {
    console.log('Initializing memory store...')
    await memoryStore.initialize()
    
    console.log('Creating memories...')
    const memory1 = await memoryStore.createMemory({
      content: 'The user loves TypeScript and prefers functional programming',
      metadata: {
        userId: 'user123',
        chatId: 456,
        category: 'preference',
        importance: 3,
        tags: ['programming', 'typescript', 'functional']
      }
    })
    
    const memory2 = await memoryStore.createMemory({
      content: 'User mentioned they work at a tech startup in San Francisco',
      metadata: {
        userId: 'user123',
        chatId: 456,
        category: 'personal',
        importance: 2,
        tags: ['work', 'location', 'startup']
      }
    })
    
    console.log('Memory 1 created:', memory1.id)
    console.log('Memory 2 created:', memory2.id)
    
    console.log('\nSearching for programming-related memories...')
    const searchResults = await memoryStore.searchMemories('programming languages', {
      limit: 5,
      threshold: 0.1,
      filter: { userId: 'user123' }
    })
    
    console.log(`Found ${searchResults.length} relevant memories:`)
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. Score: ${result.score.toFixed(3)}`)
      console.log(`   Content: ${result.memory.content}`)
      console.log(`   Tags: ${result.memory.metadata.tags?.join(', ') || 'none'}`)
      console.log('')
    })
    
    console.log('Listing all memories for user...')
    const allMemories = await memoryStore.listMemories({ userId: 'user123' })
    console.log(`Total memories: ${allMemories.length}`)
    
    console.log('\nGetting memory store stats...')
    const stats = await memoryStore.getStats()
    console.log(`Total memories in index: ${stats.count}`)
    console.log(`Index size: ${stats.indexSize} MB`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await memoryStore.disconnect()
    console.log('Disconnected from Redis')
  }
}

if (import.meta.main) {
  memoryStoreExample().catch(console.error)
} 