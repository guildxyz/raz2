import { createLogger } from '@raz2/shared'
import { ClaudeClient } from '@raz2/claude-api'
import type { AIServiceRequest, AIServiceResponse } from '../types'

export class AIService {
  private logger = createLogger('ai-service')
  private claude: ClaudeClient

  constructor(claude: ClaudeClient) {
    this.claude = claude
  }

  async processRequest(request: AIServiceRequest): Promise<AIServiceResponse> {
    try {
      switch (request.type) {
        case 'analyze_conversation':
          return await this.analyzeConversation(request.content, request.context)
        case 'generate_insights':
          return await this.generateInsights(request.content, request.context)
        case 'categorize_content':
          return await this.categorizeContent(request.content, request.options)
        case 'extract_entities':
          return await this.extractEntities(request.content)
        case 'sentiment_analysis':
          return await this.analyzeSentiment(request.content)
        default:
          return {
            success: false,
            error: `Unknown AI service request type: ${request.type}`
          }
      }
    } catch (error) {
      this.logger.error('AI service request failed', {
        error: error instanceof Error ? error : new Error(String(error)),
        requestType: request.type
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async analyzeConversation(
    content: string, 
    context?: Record<string, any>
  ): Promise<AIServiceResponse> {
    const prompt = `Analyze this conversation and provide comprehensive insights:

${content}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Please provide a JSON response with:
{
  "summary": "Brief summary of the conversation",
  "keyPoints": ["key point 1", "key point 2"],
  "sentiment": "positive|negative|neutral",
  "topics": ["topic1", "topic2"],
  "actionItems": ["action1", "action2"],
  "decisions": ["decision1", "decision2"],
  "participants": ["participant1", "participant2"],
  "qualityScore": 0-100,
  "recommendedFollowUp": "What should happen next"
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const analysisData = this.extractJsonFromResponse(response.content)
      
      if (analysisData) {
        return {
          success: true,
          data: analysisData,
          confidence: 0.85,
          metadata: {
            contentLength: content.length,
            analysisType: 'conversation'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to parse AI analysis response'
      }
    } catch (error) {
      throw error
    }
  }

  private async generateInsights(
    content: string,
    context?: Record<string, any>
  ): Promise<AIServiceResponse> {
    const prompt = `Generate strategic insights from this content:

${content}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide insights in JSON format:
{
  "insights": ["insight1", "insight2", "insight3"],
  "opportunities": ["opportunity1", "opportunity2"],
  "risks": ["risk1", "risk2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "priority": "low|medium|high|urgent",
  "category": "strategy|product|sales|partnerships|competitive|market|team|operations"
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const insightsData = this.extractJsonFromResponse(response.content)
      
      if (insightsData) {
        return {
          success: true,
          data: insightsData,
          insights: insightsData.insights,
          confidence: 0.8,
          metadata: {
            contentLength: content.length,
            analysisType: 'insights'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to parse insights response'
      }
    } catch (error) {
      throw error
    }
  }

  private async categorizeContent(
    content: string,
    options?: Record<string, any>
  ): Promise<AIServiceResponse> {
    const categories = options?.categories || [
      'strategy', 'product', 'sales', 'partnerships', 
      'competitive', 'market', 'team', 'operations'
    ]
    
    const prompt = `Categorize this content into one of these categories: ${categories.join(', ')}

Content: ${content}

Provide a JSON response with:
{
  "category": "selected category",
  "confidence": 0-1,
  "reasoning": "Why this category was chosen",
  "alternativeCategories": ["other possible categories"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const categoryData = this.extractJsonFromResponse(response.content)
      
      if (categoryData) {
        return {
          success: true,
          data: categoryData,
          confidence: categoryData.confidence || 0.7,
          metadata: {
            availableCategories: categories,
            analysisType: 'categorization'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to parse categorization response'
      }
    } catch (error) {
      throw error
    }
  }

  private async extractEntities(content: string): Promise<AIServiceResponse> {
    const prompt = `Extract named entities from this content:

${content}

Provide a JSON response with:
{
  "people": ["person1", "person2"],
  "organizations": ["org1", "org2"],
  "locations": ["location1", "location2"],
  "technologies": ["tech1", "tech2"],
  "products": ["product1", "product2"],
  "emails": ["email1", "email2"],
  "dates": ["date1", "date2"],
  "other": ["entity1", "entity2"]
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const entitiesData = this.extractJsonFromResponse(response.content)
      
      if (entitiesData) {
        const allEntities = Object.values(entitiesData).flat()
        
        return {
          success: true,
          data: entitiesData,
          confidence: 0.75,
          metadata: {
            totalEntities: allEntities.length,
            analysisType: 'entity_extraction'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to parse entity extraction response'
      }
    } catch (error) {
      throw error
    }
  }

  private async analyzeSentiment(content: string): Promise<AIServiceResponse> {
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 
      'love', 'like', 'fantastic', 'outstanding', 'awesome', 'brilliant'
    ]
    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'problem', 
      'issue', 'disappointed', 'frustrated', 'angry', 'upset'
    ]
    
    const text = content.toLowerCase()
    const words = text.split(/\s+/)
    
    let positiveScore = 0
    let negativeScore = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++
      if (negativeWords.includes(word)) negativeScore++
    })
    
    const totalWords = words.length
    const positiveRatio = positiveScore / totalWords
    const negativeRatio = negativeScore / totalWords
    
    let sentiment: 'positive' | 'negative' | 'neutral'
    let confidence: number
    
    if (positiveScore > negativeScore && positiveRatio > 0.01) {
      sentiment = 'positive'
      confidence = Math.min(0.9, 0.6 + positiveRatio * 10)
    } else if (negativeScore > positiveScore && negativeRatio > 0.01) {
      sentiment = 'negative'
      confidence = Math.min(0.9, 0.6 + negativeRatio * 10)
    } else {
      sentiment = 'neutral'
      confidence = 0.7
    }
    
    return {
      success: true,
      data: {
        sentiment,
        positiveScore,
        negativeScore,
        positiveRatio,
        negativeRatio,
        wordCount: totalWords
      },
      confidence,
      metadata: {
        analysisType: 'sentiment',
        method: 'word_analysis'
      }
    }
  }

  private extractJsonFromResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1])
      }
      
      return null
    } catch (error) {
      this.logger.warn('Failed to extract JSON from AI response', {
        error: error instanceof Error ? error : new Error(String(error)),
        contentPreview: content.substring(0, 200)
      })
      return null
    }
  }

  async enhanceIdea(title: string, content: string): Promise<{
    enhancedTitle?: string
    enhancedContent?: string
    suggestedCategory?: string
    suggestedPriority?: string
    suggestedTags?: string[]
  }> {
    const prompt = `Enhance this business idea with better structure and insights:

Title: ${title}
Content: ${content}

Please provide an enhanced version with:
{
  "enhancedTitle": "A clear, compelling title (max 80 chars)",
  "enhancedContent": "Structured content with key points, impact, and next steps",
  "suggestedCategory": "strategy|product|sales|partnerships|competitive|market|team|operations",
  "suggestedPriority": "low|medium|high|urgent",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const enhancement = this.extractJsonFromResponse(response.content)
      
      if (enhancement) {
        return {
          enhancedTitle: enhancement.enhancedTitle,
          enhancedContent: enhancement.enhancedContent,
          suggestedCategory: enhancement.suggestedCategory,
          suggestedPriority: enhancement.suggestedPriority,
          suggestedTags: enhancement.suggestedTags
        }
      }
      
      return {}
    } catch (error) {
      this.logger.error('Failed to enhance idea', { error })
      return {}
    }
  }

  async generateConversationTitle(messages: string[]): Promise<string> {
    const conversationSample = messages.slice(0, 5).join('\n\n')
    
    const prompt = `Generate a concise, descriptive title for this conversation (max 60 characters):

${conversationSample}

Respond with just the title, no additional text.`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const title = response.content.trim().replace(/['"]/g, '')
      
      return title.length > 60 ? title.substring(0, 57) + '...' : title
    } catch (error) {
      this.logger.error('Failed to generate conversation title', { error })
      return 'Conversation'
    }
  }

  async analyzeContactCommunication(
    contactName: string,
    interactions: Array<{ type: string; content: string; timestamp: Date }>
  ): Promise<{
    communicationStyle?: string
    engagementLevel?: 'low' | 'medium' | 'high'
    responsePattern?: string
    recommendations?: string[]
  }> {
    const interactionSummary = interactions
      .slice(-10)
      .map(i => `${i.type} (${i.timestamp.toISOString().split('T')[0]}): ${i.content}`)
      .join('\n')

    const prompt = `Analyze the communication patterns for ${contactName}:

Recent interactions:
${interactionSummary}

Provide insights in JSON format:
{
  "communicationStyle": "Brief description of their communication style",
  "engagementLevel": "low|medium|high",
  "responsePattern": "When and how they typically respond",
  "recommendations": ["recommendation1", "recommendation2"]
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, true, true)
      const analysis = this.extractJsonFromResponse(response.content)
      
      return analysis || {}
    } catch (error) {
      this.logger.error('Failed to analyze contact communication', { error })
      return {}
    }
  }
} 