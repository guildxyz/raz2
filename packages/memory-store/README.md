# Memory Store Package

A TypeScript package for storing and retrieving memories using Redis Stack with vector search capabilities. This package enables semantic search over stored memories using OpenAI embeddings.

## Features

- **Vector Storage**: Store memories with semantic embeddings using Redis Stack
- **Semantic Search**: Find similar memories using vector similarity search
- **Metadata Filtering**: Filter memories by user, chat, category, tags, etc.
- **CRUD Operations**: Create, read, update, delete memories
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Logging**: Built-in logging with configurable levels

## Installation

```bash
bun install @raz2/memory-store
```

## Prerequisites

- Redis Stack (with vector search support)
- OpenAI API key for embeddings

## Environment Variables

```bash
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key
MEMORY_INDEX_NAME=memories  # optional, defaults to 'memories'
EMBEDDING_MODEL=text-embedding-3-small  # optional
```

## Usage

### Basic Setup

```typescript
import { MemoryStore } from '@raz2/memory-store'
import type { MemoryStoreConfig } from '@raz2/memory-store'

const config: MemoryStoreConfig = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  indexName: 'memories',
  vectorDimension: 1536,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  embeddingModel: 'text-embedding-3-small'
}

const memoryStore = new MemoryStore(config)
await memoryStore.initialize()
```

### Creating Memories

```typescript
const memory = await memoryStore.createMemory({
  content: 'User prefers TypeScript over JavaScript',
  metadata: {
    userId: 'user123',
    chatId: 456,
    category: 'preference',
    importance: 3,
    tags: ['programming', 'typescript'],
    source: 'telegram'
  }
})
```

### Searching Memories

```typescript
const results = await memoryStore.searchMemories('programming languages', {
  limit: 10,
  threshold: 0.1,
  filter: {
    userId: 'user123',
    category: 'preference'
  }
})

results.forEach(result => {
  console.log(`Score: ${result.score}`)
  console.log(`Content: ${result.memory.content}`)
})
```

### Updating Memories

```typescript
const updated = await memoryStore.updateMemory({
  id: 'memory_id',
  content: 'Updated content',
  metadata: {
    importance: 5,
    tags: ['programming', 'typescript', 'advanced']
  }
})
```

### Listing Memories

```typescript
const memories = await memoryStore.listMemories({
  userId: 'user123',
  category: 'preference'
}, 50)
```

### Getting Stats

```typescript
const stats = await memoryStore.getStats()
console.log(`Total memories: ${stats.count}`)
console.log(`Index size: ${stats.indexSize} MB`)
```

## Memory Structure

```typescript
interface Memory {
  id: string
  content: string
  metadata: MemoryMetadata
  createdAt: Date
  updatedAt: Date
}

interface MemoryMetadata {
  userId?: string
  chatId?: number
  category?: string
  importance?: number  // 1-5 scale
  tags?: string[]
  source?: string
  [key: string]: any
}
```

## Search Options

- **limit**: Maximum number of results (default: 10)
- **threshold**: Minimum similarity score (default: 0.1)
- **filter**: Filter by metadata fields
- **includeMetadata**: Include metadata in results (default: true)

## Error Handling

The package includes comprehensive error handling and logging. All operations are wrapped in try-catch blocks with detailed error messages.

## Dependencies

- `redis`: Redis client with Stack support
- `openai`: OpenAI client for embeddings
- `@raz2/shared`: Shared utilities and types

## Example

See `src/example.ts` for a complete usage example.

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run example
bun run src/example.ts
``` 