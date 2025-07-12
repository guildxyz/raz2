import { ClaudeClient } from '@raz2/claude-api'
import { createLogger } from '@raz2/shared'

export interface MessageSample {
  text: string
  timestamp: Date
  chatType: 'private' | 'group' | 'supergroup'
  messageLength: number
  hasEmojis: boolean
  hasLinks: boolean
  replyToBot: boolean
}

export interface CommunicationPattern {
  avgMessageLength: number
  emojiUsage: number
  linkSharingFrequency: number
  responseStyle: 'brief' | 'detailed' | 'conversational'
  technicalLanguage: number
  casualness: number
  questionAsking: number
  vocabularyComplexity: number
}

export interface PersonalityTraits {
  communicationStyle: string
  technicalDepth: string
  casualness: string
  humor: string
  responsePatterns: string
  vocabularyPreferences: string[]
  commonPhrases: string[]
  topicPreferences: string[]
  lastUpdated: Date
  sampleCount: number
}

export class PersonalityAnalyzer {
  private logger = createLogger('personality-analyzer')
  private messageSamples: Map<string, MessageSample[]> = new Map()
  private personalityCache: Map<string, PersonalityTraits> = new Map()
  private claude: ClaudeClient

  constructor(claude: ClaudeClient) {
    this.claude = claude
  }

  async addMessageSample(username: string, sample: MessageSample): Promise<void> {
    if (!this.messageSamples.has(username)) {
      this.messageSamples.set(username, [])
    }

    const samples = this.messageSamples.get(username)!
    samples.push(sample)

    const maxSamples = 100
    if (samples.length > maxSamples) {
      samples.splice(0, samples.length - maxSamples)
    }

    this.logger.debug('Added message sample for personality analysis', {
      username,
      sampleCount: samples.length,
      messageLength: sample.text.length,
      chatType: sample.chatType
    })

    if (samples.length >= 10 && samples.length % 5 === 0) {
      await this.analyzePersonality(username)
    }
  }

  private async analyzePersonality(username: string): Promise<void> {
    const samples = this.messageSamples.get(username)
    if (!samples || samples.length < 5) return

    try {
      this.logger.info('Analyzing personality patterns', {
        username,
        sampleCount: samples.length
      })

      const patterns = this.calculateCommunicationPatterns(samples)
      const aiAnalysis = await this.getAIPersonalityAnalysis(samples, patterns)
      
      const traits: PersonalityTraits = {
        ...aiAnalysis,
        lastUpdated: new Date(),
        sampleCount: samples.length
      }

      this.personalityCache.set(username, traits)

      this.logger.info('Personality analysis completed', {
        username,
        communicationStyle: traits.communicationStyle,
        technicalDepth: traits.technicalDepth,
        sampleCount: traits.sampleCount
      })

    } catch (error) {
      this.logger.error('Error analyzing personality', {
        error: error instanceof Error ? error : new Error(String(error)),
        username,
        sampleCount: samples?.length
      })
    }
  }

  private calculateCommunicationPatterns(samples: MessageSample[]): CommunicationPattern {
    const totalMessages = samples.length
    const avgMessageLength = samples.reduce((sum, s) => sum + s.messageLength, 0) / totalMessages
    const emojiUsage = samples.filter(s => s.hasEmojis).length / totalMessages
    const linkSharingFrequency = samples.filter(s => s.hasLinks).length / totalMessages

    const briefMessages = samples.filter(s => s.messageLength < 50).length
    const detailedMessages = samples.filter(s => s.messageLength > 200).length
    
    let responseStyle: 'brief' | 'detailed' | 'conversational'
    if (briefMessages / totalMessages > 0.6) responseStyle = 'brief'
    else if (detailedMessages / totalMessages > 0.3) responseStyle = 'detailed'
    else responseStyle = 'conversational'

    const techKeywords = ['blockchain', 'crypto', 'defi', 'smart contract', 'protocol', 'ai', 'ml', 'algorithm', 'api', 'backend', 'frontend']
    const technicalLanguage = samples.filter(s => 
      techKeywords.some(keyword => s.text.toLowerCase().includes(keyword))
    ).length / totalMessages

    const casualKeywords = ['lol', 'haha', 'yeah', 'nah', 'cool', 'nice', 'damn', 'shit', 'fuck']
    const casualness = samples.filter(s => 
      casualKeywords.some(keyword => s.text.toLowerCase().includes(keyword))
    ).length / totalMessages

    const questionAsking = samples.filter(s => s.text.includes('?')).length / totalMessages

    const words = samples.flatMap(s => s.text.split(/\s+/))
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const vocabularyComplexity = avgWordLength / 10

    return {
      avgMessageLength,
      emojiUsage,
      linkSharingFrequency,
      responseStyle,
      technicalLanguage,
      casualness,
      questionAsking,
      vocabularyComplexity
    }
  }

  private async getAIPersonalityAnalysis(samples: MessageSample[], patterns: CommunicationPattern): Promise<Omit<PersonalityTraits, 'lastUpdated' | 'sampleCount'>> {
    const recentMessages = samples.slice(-20).map(s => s.text).join('\n\n')
    
    const prompt = `Analyze the communication style and personality from these message samples. Focus on extracting actionable insights for mimicking this person's communication style.

COMMUNICATION PATTERNS:
- Average message length: ${patterns.avgMessageLength} characters
- Emoji usage: ${(patterns.emojiUsage * 100).toFixed(1)}%
- Technical language frequency: ${(patterns.technicalLanguage * 100).toFixed(1)}%
- Casualness level: ${(patterns.casualness * 100).toFixed(1)}%
- Response style: ${patterns.responseStyle}
- Question asking frequency: ${(patterns.questionAsking * 100).toFixed(1)}%

RECENT MESSAGES:
${recentMessages}

Please provide a detailed personality analysis in this exact JSON format:
{
  "communicationStyle": "Brief description of overall communication approach",
  "technicalDepth": "Level of technical knowledge and how it's expressed",
  "casualness": "Level of formality vs casual tone",
  "humor": "Type and frequency of humor used",
  "responsePatterns": "How they typically structure responses",
  "vocabularyPreferences": ["word1", "word2", "word3"],
  "commonPhrases": ["phrase1", "phrase2", "phrase3"],
  "topicPreferences": ["topic1", "topic2", "topic3"]
}`

    try {
      const response = await this.claude.sendMessage(prompt, [], undefined, undefined, false, true)
      
      const jsonStart = response.content.indexOf('{')
      const jsonEnd = response.content.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = response.content.substring(jsonStart, jsonEnd + 1)
        const analysis = JSON.parse(jsonStr)
        
        return {
          communicationStyle: analysis.communicationStyle || 'Conversational',
          technicalDepth: analysis.technicalDepth || 'Moderate',
          casualness: analysis.casualness || 'Balanced',
          humor: analysis.humor || 'Occasional',
          responsePatterns: analysis.responsePatterns || 'Direct',
          vocabularyPreferences: analysis.vocabularyPreferences || [],
          commonPhrases: analysis.commonPhrases || [],
          topicPreferences: analysis.topicPreferences || []
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI personality analysis', {
        error: error instanceof Error ? error : new Error(String(error))
      })
    }

    return {
      communicationStyle: `${patterns.responseStyle} communicator with ${patterns.technicalLanguage > 0.3 ? 'high' : 'moderate'} technical depth`,
      technicalDepth: patterns.technicalLanguage > 0.3 ? 'High technical knowledge' : 'Moderate technical knowledge',
      casualness: patterns.casualness > 0.3 ? 'Very casual' : patterns.casualness > 0.1 ? 'Moderately casual' : 'Formal',
      humor: patterns.casualness > 0.2 ? 'Frequent casual humor' : 'Occasional humor',
      responsePatterns: `Typically ${patterns.responseStyle} responses averaging ${Math.round(patterns.avgMessageLength)} characters`,
      vocabularyPreferences: [],
      commonPhrases: [],
      topicPreferences: []
    }
  }

  getPersonalityTraits(username: string): PersonalityTraits | null {
    return this.personalityCache.get(username) || null
  }

  getSampleCount(username: string): number {
    return this.messageSamples.get(username)?.length || 0
  }

  generatePersonalityPrompt(username: string): string | null {
    const traits = this.getPersonalityTraits(username)
    if (!traits) return null

    const vocabularyText = traits.vocabularyPreferences.length > 0 
      ? `\nPreferred vocabulary: ${traits.vocabularyPreferences.join(', ')}`
      : ''

    const phrasesText = traits.commonPhrases.length > 0
      ? `\nCommon phrases: ${traits.commonPhrases.join(', ')}`
      : ''

    const topicsText = traits.topicPreferences.length > 0
      ? `\nPreferred topics: ${traits.topicPreferences.join(', ')}`
      : ''

    return `Communication Style Adaptation for @${username}:

${traits.communicationStyle}
Technical Depth: ${traits.technicalDepth}
Casualness: ${traits.casualness}
Humor Style: ${traits.humor}
Response Patterns: ${traits.responsePatterns}${vocabularyText}${phrasesText}${topicsText}

Adapt your responses to match this communication style while maintaining your crypto founder personality. Be authentic but incorporate these learned patterns naturally.

Sample Count: ${traits.sampleCount} messages analyzed
Last Updated: ${traits.lastUpdated.toLocaleDateString()}`
  }

  clearPersonalityData(username: string): void {
    this.messageSamples.delete(username)
    this.personalityCache.delete(username)
    this.logger.info('Cleared personality data', { username })
  }

  getTrackedUsers(): string[] {
    return Array.from(this.messageSamples.keys())
  }
} 