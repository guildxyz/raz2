import OpenAI from 'openai'
import { createLogger } from '@raz2/shared'
import type { EmbeddingResponse } from './types'

export class EmbeddingService {
  private client: OpenAI
  private logger = createLogger('embedding-service')
  private model: string

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey })
    this.model = model
    this.logger.info('Embedding service initialized', { model: this.model })
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      this.logger.debug('Generating embedding', { 
        textLength: text.length,
        model: this.model 
      })

      const response = await this.client.embeddings.create({
        model: this.model,
        input: text.trim(),
        encoding_format: 'float'
      })

      const embedding = response.data[0]
      const tokens = response.usage.total_tokens

      this.logger.debug('Embedding generated successfully', {
        vectorDimension: embedding.embedding.length,
        tokens
      })

      return {
        vector: embedding.embedding,
        tokens
      }
    } catch (error) {
      this.logger.error('Failed to generate embedding', {
        error: error instanceof Error ? error : new Error(String(error)),
        textLength: text.length
      })
      throw error
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    try {
      this.logger.debug('Generating batch embeddings', { 
        count: texts.length,
        model: this.model 
      })

      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts.map(text => text.trim()),
        encoding_format: 'float'
      })

      const results = response.data.map(embedding => ({
        vector: embedding.embedding,
        tokens: response.usage.total_tokens / texts.length // Approximate per-text tokens
      }))

      this.logger.debug('Batch embeddings generated successfully', {
        count: results.length,
        totalTokens: response.usage.total_tokens
      })

      return results
    } catch (error) {
      this.logger.error('Failed to generate batch embeddings', {
        error: error instanceof Error ? error : new Error(String(error)),
        count: texts.length
      })
      throw error
    }
  }

  getDimension(): number {
    // text-embedding-3-small has 1536 dimensions
    // text-embedding-3-large has 3072 dimensions
    switch (this.model) {
      case 'text-embedding-3-small':
        return 1536
      case 'text-embedding-3-large':
        return 3072
      case 'text-embedding-ada-002':
        return 1536
      default:
        return 1536 // Default fallback
    }
  }
} 