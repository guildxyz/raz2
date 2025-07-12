import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient, ToolExecutor } from '@raz2/claude-api';
import { IdeaStore } from '@raz2/idea-store';
import { createLogger, sanitizeInput, parseCommand, IDEA_STORE_CONFIG } from '@raz2/shared';
import { BotConfig, ConversationState, ProcessedMessage } from './types.js';
import { IdeaService } from './idea-service.js';
import { WebServer } from './web-server.js';
import { PersonalityAnalyzer, MessageSample } from './personality-analyzer.js';
import { resolve, join } from 'node:path';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface BotInfo {
  id: number;
  username: string;
  firstName: string;
  isBot: boolean;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
  profilePhotoPath?: string;
  profilePhotoUrl?: string;
}

export class TelegramBotService {
  private bot: TelegramBot;
  private claude: ClaudeClient;
  private ideaService: IdeaService;
  private toolExecutor?: ToolExecutor;
  private webServer?: WebServer;
  private personalityAnalyzer: PersonalityAnalyzer;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();
  private botUsername?: string;
  private botId?: number;
  private botMessageIds = new Set<string>();
  private learnFromUsers = new Set<string>(['zawiasa']);
  private botInfo?: BotInfo;
  private profilePhotoDir: string;

  constructor(private config: BotConfig) {
    this.profilePhotoDir = resolve(process.cwd(), './bot-photos');
    
    this.logger.info('Initializing TelegramBotService', {
      botToken: this.config.telegramToken ? `${this.config.telegramToken.substring(0, 10)}...` : 'missing',
      claudeApiKey: this.config.claudeApiKey ? `${this.config.claudeApiKey.substring(0, 10)}...` : 'missing',
      mcpServerPath: this.config.mcpServerPath,
      ideaEnabled: !!this.config.ideaStore,
      profilePhotoDir: this.profilePhotoDir
    });

    this.bot = new TelegramBot(this.config.telegramToken, { 
      polling: true
    });
    
    this.claude = new ClaudeClient();
    
    // Initialize personality analyzer
    this.personalityAnalyzer = new PersonalityAnalyzer(this.claude);
    
    // Initialize idea service
    if (this.config.ideaStore) {
      const ideaStore = new IdeaStore(this.config.ideaStore);
      this.ideaService = new IdeaService(ideaStore, this.claude);
      
      // Enable Claude tools for idea management
      this.toolExecutor = new ToolExecutor(this.ideaService);
      this.claude.enableIdeaTools(this.toolExecutor);
      
      this.logger.info('Idea service and Claude tools enabled');
    } else {
      this.ideaService = new IdeaService();
      this.logger.info('Idea service disabled - no configuration provided');
    }
    
    // Initialize web server if enabled
    if (this.config.webServer?.enabled) {
      const uiDistPath = resolve(process.cwd(), './ui-dist');
      this.webServer = new WebServer({
        port: this.config.webServer.port,
        host: this.config.webServer.host,
        ideaService: this.ideaService,
        uiDistPath,
        botService: this
      });
      this.logger.info('Web server enabled', {
        port: this.config.webServer.port,
        host: this.config.webServer.host,
        uiDistPath
      });
    }
    
    this.setupHandlers();
    
    this.logger.info('TelegramBotService initialized');
  }

  private setupHandlers(): void {
    this.bot.on('message', async (msg) => {
      // Determine actual message type for better logging
      let messageType: string;
      let hasText = false;
      
      if (msg.photo) messageType = 'photo';
      else if (msg.document) messageType = 'document';
      else if (msg.sticker) messageType = 'sticker';
      else if (msg.voice) messageType = 'voice';
      else if (msg.video) messageType = 'video';
      else if (msg.audio) messageType = 'audio';
      else if (msg.location) messageType = 'location';
      else if (msg.contact) messageType = 'contact';
      else if (msg.text && msg.text.length > 0) {
        messageType = 'text';
        hasText = true;
      } else {
        messageType = 'unknown';
      }
      
      this.logger.info('Raw message received', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        from: {
          id: msg.from?.id,
          username: msg.from?.username,
          firstName: msg.from?.first_name
        },
        text: msg.text,
        hasText,
        messageType,
        chatType: msg.chat.type,
        entities: msg.entities?.map(e => ({
          type: e.type,
          offset: e.offset,
          length: e.length,
          text: msg.text?.substring(e.offset, e.offset + e.length)
        }))
      });
      
      await this.handleMessage(msg);
    });

    this.bot.on('polling_error', (error) => {
      this.logger.error('Polling error:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
    });

    this.logger.info('Telegram bot handlers set up');
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      this.logger.info('Starting message processing', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        chatType: msg.chat.type
      });

      const processed = this.processMessage(msg);
      
      this.logger.info('Message processed', {
        chatId: processed.chatId,
        isValid: processed.isValid,
        hasCommand: !!processed.command?.command,
        command: processed.command?.command,
        textLength: processed.text.length,
        originalText: msg.text,
        sanitizedText: processed.text,
        messageType: processed.messageType,
        isGroupChat: processed.isGroupChat,
        isReplyToBotMessage: processed.isReplyToBotMessage,
        mentionsBot: processed.mentionsBot
      });

      if (!processed.isValid) {
        this.logger.warn('Invalid message format detected', { processed });
        // Don't send error message for non-text messages, just ignore them
        if (processed.messageType === 'text' && processed.text.length === 0) {
          await this.sendMessage(processed.chatId, 'Please send a text message');
        }
        return;
      }

      // Track messages for personality learning (with privacy controls)
      await this.trackMessageForPersonalityLearning(msg, processed);

      // Group chat behavior: only respond if mentioned, replied to, or it's a command
      if (processed.isGroupChat && !processed.command?.command) {
        const shouldRespond = processed.isReplyToBotMessage || processed.mentionsBot;
        
        this.logger.info('=== GROUP CHAT EVALUATION ===', {
          chatId: processed.chatId,
          messageText: processed.text,
          isGroupChat: processed.isGroupChat,
          hasCommand: !!processed.command?.command,
          isReplyToBotMessage: processed.isReplyToBotMessage,
          mentionsBot: processed.mentionsBot,
          shouldRespond,
          decision: shouldRespond ? 'WILL RESPOND' : 'WILL IGNORE'
        });
        
        if (!shouldRespond) {
          this.logger.info('🔇 Ignoring group message - bot not mentioned or replied to', {
            chatId: processed.chatId,
            messageId: msg.message_id,
            reason: 'Not mentioned and not a reply to bot'
          });
          return;
        } else {
          this.logger.info('📢 Responding to group message', {
            chatId: processed.chatId,
            messageId: msg.message_id,
            reason: processed.isReplyToBotMessage ? 'Reply to bot' : 'Bot mentioned'
          });
        }
      }

      const conversation = this.getOrCreateConversation(
        processed.chatId, 
        processed.userId, 
        processed.userName
      );
      
      if (processed.command?.command) {
        this.logger.info('Routing to command handler', {
          command: processed.command.command,
          args: processed.command.args
        });
        await this.handleCommand(processed);
        return;
      }

      this.logger.info('Routing to chat message handler', {
        chatId: processed.chatId,
        messageLength: processed.text.length,
        conversationLength: conversation.messages.length,
        isGroupChat: processed.isGroupChat
      });
      await this.handleChatMessage(processed, conversation);
    } catch (error) {
      this.logger.error('Error handling message:', { 
        error: error instanceof Error ? error : new Error(String(error)),
        chatId: msg.chat.id,
        messageId: msg.message_id,
        text: msg.text
      });
      await this.sendMessage(msg.chat.id, 'Sorry, an error occurred processing your message');
    }
  }

  private processMessage(msg: TelegramBot.Message): ProcessedMessage {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const sanitizedText = sanitizeInput(text);
    
    // Determine actual message type
    let messageType: string;
    if (msg.photo) messageType = 'photo';
    else if (msg.document) messageType = 'document';
    else if (msg.sticker) messageType = 'sticker';
    else if (msg.voice) messageType = 'voice';
    else if (msg.video) messageType = 'video';
    else if (msg.audio) messageType = 'audio';
    else if (msg.location) messageType = 'location';
    else if (msg.contact) messageType = 'contact';
    else if (text.length > 0) messageType = 'text';
    else messageType = 'unknown';
    
    const command = parseCommand(sanitizedText);
    
    // Determine if this is a group chat
    const isGroupChat = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    
    // Check if this is a reply to a bot message
    const isReplyToBotMessage = !!(
      msg.reply_to_message && 
      this.botId && 
      msg.reply_to_message.from?.id === this.botId
    );
    
    // Check if the bot is mentioned
    const mentionsBot = this.isBotMentioned(text, msg.entities);
    
    // Message is valid if it has text content
    const isValid = messageType === 'text' && sanitizedText.length > 0;
    
    this.logger.debug('Processing message', {
      originalText: text,
      sanitizedText,
      hasCommand: !!command.command,
      command: command.command,
      messageType,
      isValid,
      isGroupChat,
      isReplyToBotMessage,
      mentionsBot
    });
    
    return {
      chatId,
      text: sanitizedText,
      command,
      isValid,
      messageType,
      isGroupChat,
      isReplyToBotMessage,
      mentionsBot,
      originalMessage: msg,
      userId: msg.from?.id,
      userName: msg.from?.username || msg.from?.first_name || 'User',
    };
  }
  
  private isBotMentioned(text: string, entities?: TelegramBot.MessageEntity[]): boolean {
    if (!this.botUsername) {
      this.logger.info('No bot username available for mention detection');
      return false;
    }
    
    this.logger.info('=== MENTION DETECTION START ===', {
      text,
      botUsername: this.botUsername,
      entitiesCount: entities?.length || 0,
      entities: entities?.map(e => ({
        type: e.type,
        offset: e.offset,
        length: e.length,
        text: text.substring(e.offset, e.offset + e.length)
      }))
    });
    
    // Method 1: Check for @username mentions in text (case insensitive)
    const mentionPattern = `@${this.botUsername}`;
    const lowerText = text.toLowerCase();
    const lowerMention = mentionPattern.toLowerCase();
    
    this.logger.info('Testing text-based mention detection', {
      originalText: text,
      lowerText,
      mentionPattern,
      lowerMention,
      containsMention: lowerText.includes(lowerMention),
      botUsernameLength: this.botUsername.length,
      textLength: text.length
    });
    
    if (lowerText.includes(lowerMention)) {
      this.logger.info('✅ Bot mention found via text search', { mentionPattern, matched: true });
      return true;
    }
    
    // Method 2: Check for mention entities
    if (entities && entities.length > 0) {
      this.logger.info('Testing entity-based mention detection', { entitiesCount: entities.length });
      
      for (const entity of entities) {
        this.logger.info('Processing entity', {
          type: entity.type,
          offset: entity.offset,
          length: entity.length
        });
        
        if (entity.type === 'mention') {
          const mention = text.substring(entity.offset, entity.offset + entity.length);
          
          this.logger.info('Found mention entity', {
            mention,
            expectedMention: mentionPattern,
            exactMatch: mention === mentionPattern,
            caseInsensitiveMatch: mention.toLowerCase() === lowerMention
          });
          
          if (mention === mentionPattern || mention.toLowerCase() === lowerMention) {
            this.logger.info('✅ Bot mention found via entity', { mention });
            return true;
          }
        }
      }
    }
    
    // Method 3: Enhanced fallback - check for username variations and common aliases
    const usernameOnly = this.botUsername.toLowerCase();
    
    // Generate common variations of the bot name
    const variations = [
      usernameOnly, // full username like "raz_2_bot"
      usernameOnly.replace(/_/g, ''), // remove underscores: "raz2bot"
      usernameOnly.replace(/_bot$/, ''), // remove _bot suffix: "raz_2"
      usernameOnly.replace(/_/g, '').replace(/bot$/, ''), // remove underscores and bot: "raz2"
    ];
    
    // Also check for the name parts
    const nameParts = usernameOnly.split('_').filter(part => part && part !== 'bot');
    variations.push(...nameParts);
    
    this.logger.info('Testing username fallback detection', {
      username: this.botUsername,
      usernameOnly,
      variations,
      text: lowerText,
      nameParts
    });
    
    for (const variation of variations) {
      if (variation.length >= 3 && lowerText.includes(variation)) { // Only check variations with 3+ chars
        this.logger.info('✅ Bot mention found via username variation', { 
          variation, 
          originalUsername: this.botUsername,
          matchedText: lowerText,
          variationLength: variation.length,
          textContainsVariation: lowerText.includes(variation)
        });
        return true;
      } else if (variation.length >= 3) {
        this.logger.info('❌ Variation not found in text', {
          variation,
          variationLength: variation.length,
          textContainsVariation: lowerText.includes(variation),
          lowerText: lowerText.substring(0, 50) + (lowerText.length > 50 ? '...' : '')
        });
      }
    }
    
    // Method 4: Check for common bot addressing patterns
    const botAddressingPatterns = [
      /\bbot\b/i,
      /\bai\b/i,
      /\bassistant\b/i
    ];
    
    // Only trigger on bot addressing if the message is clearly directed at the bot
    const isDirectlyAddressed = /^(hey|hi|hello|yo|whatsup|what's up|how are you|sup)/i.test(text.trim());
    
    this.logger.info('Testing direct addressing patterns', {
      isDirectlyAddressed,
      textStartsWithGreeting: text.trim().substring(0, 20),
      testPatternResult: /^(hey|hi|hello|yo|whatsup|what's up|how are you|sup)/i.test(text.trim())
    });
    
    if (isDirectlyAddressed) {
      for (const pattern of botAddressingPatterns) {
        if (pattern.test(text)) {
          this.logger.info('✅ Bot mention found via addressing pattern', { 
            pattern: pattern.source,
            text: text.substring(0, 50)
          });
          return true;
        }
      }
      
      // If directly addressed and contains any part of the bot name
      for (const variation of variations) {
        if (variation.length >= 3 && lowerText.includes(variation)) {
          this.logger.info('✅ Bot mention found via direct addressing with name', { 
            variation,
            text: text.substring(0, 50)
          });
          return true;
        }
      }
    }
    
    this.logger.info('❌ No bot mention detected in any method', {
      checkedVariations: variations,
      isDirectlyAddressed,
      testedPatterns: botAddressingPatterns.map(p => p.source),
      finalTextAnalysis: {
        originalText: text,
        lowerText,
        textLength: text.length,
        containsAtSymbol: text.includes('@'),
        containsBotUsername: lowerText.includes(this.botUsername.toLowerCase())
      }
    });
    this.logger.info('=== MENTION DETECTION END ===');
    return false;
  }

  private getOrCreateConversation(chatId: number, userId?: number, userName?: string): ConversationState {
    if (!this.conversations.has(chatId)) {
      this.logger.info('Creating new conversation', { chatId, userId, userName });
      this.conversations.set(chatId, {
        chatId,
        messages: [],
        lastActivity: new Date(),
        userId: userId?.toString(),
        userName,
        strategicContext: []
      });
    } else {
      this.logger.debug('Using existing conversation', { 
        chatId,
        messageCount: this.conversations.get(chatId)?.messages.length || 0
      });
    }

    const conversation = this.conversations.get(chatId)!;
    conversation.lastActivity = new Date();
    
    // Update user info if provided
    if (userId && !conversation.userId) {
      conversation.userId = userId.toString();
    }
    if (userName && !conversation.userName) {
      conversation.userName = userName;
    }
    
    return conversation;
  }

  private async handleCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    this.logger.info('Handling command', {
      chatId,
      command: command?.command,
      args: command?.args,
      fullCommand: `/${command?.command}${command?.args?.length ? ' ' + command.args.join(' ') : ''}`
    });

    switch (command?.command) {
      case 'start':
        this.logger.info('Executing start command', { chatId });
        await this.sendMessage(chatId, this.getWelcomeMessage());
        break;
      
      case 'help':
        this.logger.info('Executing help command', { chatId });
        await this.sendMessage(chatId, this.getHelpMessage());
        break;
      
      case 'clear':
        this.logger.info('Executing clear command', { chatId });
        this.conversations.delete(chatId);
        await this.sendMessage(chatId, 'Conversation cleared!');
        break;
      
      case 'tools':
        this.logger.info('Executing tools command', { chatId });
        await this.handleToolsCommand(chatId);
        break;
      
      case 'ui':
      case 'web':
      case 'dashboard':
        this.logger.info('Executing strategic dashboard command', { chatId });
        await this.handleWebUICommand(chatId);
        break;
      
      case 'ideas':
        this.logger.info('Executing ideas command', { chatId });
        await this.handleIdeasCommand(processed);
        break;
      
      case 'capture':
        this.logger.info('Executing capture command', { chatId });
        await this.handleCaptureCommand(processed);
        break;
      
      case 'forget':
        this.logger.info('Executing forget command', { chatId });
        await this.handleForgetCommand(processed);
        break;
      
      case 'search':
        this.logger.info('Executing search command', { chatId });
        await this.handleSearchCommand(processed);
        break;
      
      case 'learn':
        this.logger.info('Executing personality learning command', { chatId });
        await this.handleLearnCommand(processed);
        break;
      
      case 'personality':
        this.logger.info('Executing personality view command', { chatId });
        await this.handlePersonalityCommand(processed);
        break;
      
      case 'forget_personality':
        this.logger.info('Executing forget personality command', { chatId });
        await this.handleForgetPersonalityCommand(processed);
        break;
      
      case 'debug':
        this.logger.info('Executing debug command', { chatId });
        await this.handleDebugCommand(processed);
        break;
      
      default:
        this.logger.warn('Unknown command received', {
          chatId,
          command: command?.command,
          fullText: processed.text
        });
        await this.sendMessage(chatId, `Unknown command: ${command?.command}\n\nUse /help to see available strategic intelligence commands.`);
    }
  }

  private async handleIdeasCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId } = processed;

    if (!this.ideaService.isIdeaEnabled()) {
      await this.sendMessage(chatId, '💡 Strategic intelligence feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for strategic operations');
      return;
    }

    try {
      const stats = await this.ideaService.getStats(userId.toString());
      const ideas = await this.ideaService.getUserIdeas(userId.toString(), 10);

      if (stats.count === 0) {
        await this.sendMessage(chatId, '💡 No strategic ideas found. Start discussing strategy to build your intelligence base!');
        return;
      }

      const categoriesText = Object.entries(stats.categories)
        .map(([category, count]) => `• ${category}: ${count}`)
        .join('\n');

      const recentIdeas = ideas.slice(0, 5)
        .map((idea, index) => {
          const date = idea.createdAt.toLocaleDateString();
          const preview = idea.title || idea.content.substring(0, 60) + (idea.content.length > 60 ? '...' : '');
          const priority = idea.priority === 'urgent' ? '🔴' : idea.priority === 'high' ? '🟠' : idea.priority === 'medium' ? '🟡' : '🟢';
          return `${index + 1}. ${priority} ${preview} [ID: ${idea.id}] (${date})`;
        })
        .join('\n');

      const message = `💡 Your Strategic Ideas (${stats.count} total)

📊 Categories:
${categoriesText}

📝 Recent strategic ideas:
${recentIdeas}

Use /search <query> to find specific strategic insights
Use /capture <idea> to manually save strategic information
Use /forget <ID> to delete an idea (e.g., /forget abc123)`;

      await this.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error('Error in ideas command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId
      });
      await this.sendMessage(chatId, '❌ Error retrieving strategic ideas');
    }
  }

  private async handleCaptureCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId, command } = processed;

    if (!this.ideaService.isIdeaEnabled()) {
      await this.sendMessage(chatId, '💡 Strategic intelligence feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for strategic operations');
      return;
    }

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, '❌ Please provide strategic insight to capture\nUsage: /capture <strategic idea or insight>');
      return;
    }

    const content = command.args.join(' ');
    
    try {
      const idea = await this.ideaService.captureStrategicIdea(
        'Manual Capture',
        content,
        userId.toString(),
        chatId
      );

      if (idea) {
        let message = `✅ Strategic insight captured: "${content}"\n\nCategory: ${idea.category}\nPriority: ${idea.priority}\nID: ${idea.id}`;
        
        // Check if chat ID was skipped (workaround for database schema issue)
        if (chatId && !idea.chatId) {
          message += '\n\n⚠️ Note: Chat context temporarily unavailable due to system update';
        }
        
        await this.sendMessage(chatId, message);
        this.logger.info('User manually captured strategic idea', {
          chatId,
          userId,
          ideaId: idea.id,
          contentLength: content.length,
          chatIdSkipped: chatId && !idea.chatId
        });
      } else {
        await this.sendMessage(chatId, '❌ Failed to capture strategic insight');
      }
    } catch (error) {
      this.logger.error('Error in capture command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId,
        content: content.substring(0, 50)
      });
      
      // Provide more specific error message
      let errorMessage = '❌ Error capturing strategic insight';
      if (error instanceof Error && error.message.includes('22003')) {
        errorMessage = '❌ Unable to capture idea due to system limitations. Please try again after the next update.';
      }
      
      await this.sendMessage(chatId, errorMessage);
    }
  }

  private async handleForgetCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId, command } = processed;

    if (!this.ideaService.isIdeaEnabled()) {
      await this.sendMessage(chatId, '💡 Strategic intelligence feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for strategic operations');
      return;
    }

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, `❌ Please provide idea ID to forget
Usage: /forget <idea_id>
Example: /forget abc123

Use /ideas to see your ideas with their IDs`);
      return;
    }

    const ideaId = command.args[0];
    
    try {
      this.logger.info('Attempting to delete idea', {
        chatId,
        userId,
        ideaId
      });

      const success = await this.ideaService.deleteIdea(ideaId, userId.toString());

      if (success) {
        await this.sendMessage(chatId, `✅ **Idea Forgotten**

Idea with ID "${ideaId}" has been permanently deleted from your strategic intelligence repository.

🗑️ **This action cannot be undone.**`);
        
        this.logger.info('Successfully deleted idea', {
          chatId,
          userId,
          ideaId
        });
      } else {
        await this.sendMessage(chatId, `❌ **Failed to Delete Idea**

Could not delete idea with ID "${ideaId}".

**Possible reasons:**
• The idea doesn't exist
• You don't have permission to delete it
• Invalid idea ID format

Use /ideas to see your ideas with their correct IDs`);
      }
    } catch (error) {
      this.logger.error('Error in forget command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId,
        ideaId
      });
      await this.sendMessage(chatId, '❌ Error deleting strategic idea');
    }
  }

  private async handleSearchCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId, command } = processed;

    if (!this.ideaService.isIdeaEnabled()) {
      await this.sendMessage(chatId, '💡 Strategic intelligence feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for strategic operations');
      return;
    }

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, '❌ Please provide search terms\nUsage: /search <strategic topic or keyword>');
      return;
    }

    const query = command.args.join(' ');
    
    try {
      const results = await this.ideaService.searchRelevantIdeas(
        query,
        userId.toString(),
        10
      );

      if (results.length === 0) {
        await this.sendMessage(chatId, `🔍 No strategic insights found for: "${query}"`);
        return;
      }

      const searchResults = results
        .map((result, index) => {
          const score = (result.score * 100).toFixed(1);
          const date = result.idea.createdAt.toLocaleDateString();
          const category = result.idea.category;
          const priority = result.idea.priority === 'urgent' ? '🔴' : result.idea.priority === 'high' ? '🟠' : result.idea.priority === 'medium' ? '🟡' : '🟢';
          const title = result.idea.title || result.idea.content.substring(0, 50) + '...';
          return `${index + 1}. ${priority} ${title} [ID: ${result.idea.id}]
   📊 ${score}% match | 📅 ${date} | 🏷️ ${category}`;
        })
        .join('\n\n');

      await this.sendMessage(chatId, `🔍 Strategic insights for: "${query}"

${searchResults}

Use /forget <ID> to delete an idea`);
    } catch (error) {
      this.logger.error('Error in search command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId,
        query: query.substring(0, 50)
      });
      await this.sendMessage(chatId, '❌ Error searching strategic insights');
    }
  }

  private async handleLearnCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    if (!command?.args || command.args.length === 0) {
      const trackedUsers = this.personalityAnalyzer.getTrackedUsers();
      const learningFrom = Array.from(this.learnFromUsers);
      
      let message = '🧠 **Personality Learning System**\n\n';
      message += `**Currently learning from:** ${learningFrom.length > 0 ? learningFrom.map(u => `@${u}`).join(', ') : 'None'}\n\n`;
      
      if (trackedUsers.length > 0) {
        message += '**Analysis Status:**\n';
        for (const user of trackedUsers) {
          const sampleCount = this.personalityAnalyzer.getSampleCount(user);
          const traits = this.personalityAnalyzer.getPersonalityTraits(user);
          const status = traits ? '✅ Analyzed' : '📊 Collecting';
          message += `• @${user}: ${sampleCount} samples ${status}\n`;
        }
      }
      
      message += '\n**Usage:**\n';
      message += '• `/learn add <username>` - Start learning from user\n';
      message += '• `/learn remove <username>` - Stop learning from user\n';
      message += '• `/personality <username>` - View learned traits\n';
      message += '• `/forget_personality <username>` - Clear data';
      
      await this.sendMessage(chatId, message);
      return;
    }

    const action = command.args[0].toLowerCase();
    const username = command.args[1]?.toLowerCase();

    if (!username) {
      await this.sendMessage(chatId, '❌ Please provide a username\nUsage: `/learn add/remove <username>`');
      return;
    }

    if (action === 'add') {
      this.learnFromUsers.add(username);
      await this.sendMessage(chatId, `✅ **Learning Started**\n\nNow learning communication patterns from @${username}.\n\n📊 Will analyze messages to adapt personality and response style.\n\n⚠️ **Privacy Note:** Only analyzing public messages for communication style - no content is stored permanently.`);
      
      this.logger.info('Started learning from user', {
        chatId,
        username,
        totalLearningFrom: this.learnFromUsers.size
      });
    } else if (action === 'remove') {
      this.learnFromUsers.delete(username);
      await this.sendMessage(chatId, `✅ **Learning Stopped**\n\nNo longer learning from @${username}.\n\n🗑️ Use \`/forget_personality ${username}\` to clear existing data.`);
      
      this.logger.info('Stopped learning from user', {
        chatId,
        username,
        totalLearningFrom: this.learnFromUsers.size
      });
    } else {
      await this.sendMessage(chatId, '❌ Invalid action. Use `add` or `remove`\nUsage: `/learn add/remove <username>`');
    }
  }

  private async handlePersonalityCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    if (!command?.args || command.args.length === 0) {
      const trackedUsers = this.personalityAnalyzer.getTrackedUsers();
      
      if (trackedUsers.length === 0) {
        await this.sendMessage(chatId, '🧠 **No Personality Data**\n\nNo users are currently being tracked for personality learning.\n\nUse `/learn add <username>` to start learning from someone.');
        return;
      }
      
      let message = '🧠 **Tracked Personalities**\n\n';
      for (const user of trackedUsers) {
        const sampleCount = this.personalityAnalyzer.getSampleCount(user);
        const traits = this.personalityAnalyzer.getPersonalityTraits(user);
        
        message += `**@${user}**\n`;
        message += `📊 ${sampleCount} messages analyzed\n`;
        if (traits) {
          message += `🎭 ${traits.communicationStyle}\n`;
          message += `🧠 ${traits.technicalDepth}\n`;
          message += `💬 ${traits.casualness}\n`;
          message += `📅 Updated: ${traits.lastUpdated.toLocaleDateString()}\n`;
        } else {
          message += `⏳ Still collecting data...\n`;
        }
        message += '\n';
      }
      
      message += 'Use `/personality <username>` for detailed analysis.';
      await this.sendMessage(chatId, message);
      return;
    }

    const username = command.args[0].toLowerCase();
    const traits = this.personalityAnalyzer.getPersonalityTraits(username);
    
    if (!traits) {
      const sampleCount = this.personalityAnalyzer.getSampleCount(username);
      if (sampleCount > 0) {
        await this.sendMessage(chatId, `📊 **@${username} Analysis in Progress**\n\n${sampleCount} messages collected.\nNeed ${Math.max(0, 10 - sampleCount)} more messages for initial analysis.`);
      } else {
        await this.sendMessage(chatId, `❌ **No Data for @${username}**\n\nUser not found in personality learning system.\n\nUse \`/learn add ${username}\` to start tracking.`);
      }
      return;
    }

    const vocabularyText = traits.vocabularyPreferences.length > 0 
      ? `\n**Vocabulary:** ${traits.vocabularyPreferences.join(', ')}`
      : '';
    
    const phrasesText = traits.commonPhrases.length > 0
      ? `\n**Phrases:** ${traits.commonPhrases.join(', ')}`
      : '';
    
    const topicsText = traits.topicPreferences.length > 0
      ? `\n**Topics:** ${traits.topicPreferences.join(', ')}`
      : '';

    const message = `🧠 **@${username} Personality Analysis**

📊 **${traits.sampleCount} messages analyzed**
📅 **Last updated:** ${traits.lastUpdated.toLocaleDateString()}

🎭 **Communication Style:**
${traits.communicationStyle}

🧠 **Technical Depth:**
${traits.technicalDepth}

💬 **Casualness:**
${traits.casualness}

😄 **Humor:**
${traits.humor}

📝 **Response Patterns:**
${traits.responsePatterns}${vocabularyText}${phrasesText}${topicsText}

🤖 **Bot Adaptation:** Currently adapting responses to match this style when chatting with @${username}.`;

    await this.sendMessage(chatId, message);
  }

  private async handleForgetPersonalityCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, '❌ Please provide a username\nUsage: `/forget_personality <username>`');
      return;
    }

    const username = command.args[0].toLowerCase();
    const hadData = this.personalityAnalyzer.getSampleCount(username) > 0;
    
    this.personalityAnalyzer.clearPersonalityData(username);
    this.learnFromUsers.delete(username);
    
    if (hadData) {
      await this.sendMessage(chatId, `✅ **Personality Data Cleared**\n\nAll personality data for @${username} has been permanently deleted.\n\n🔄 The bot will no longer adapt to their communication style.\n\n💡 Use \`/learn add ${username}\` to start fresh learning.`);
      
      this.logger.info('Cleared personality data', {
        chatId,
        username
      });
    } else {
      await this.sendMessage(chatId, `ℹ️ **No Data Found**\n\nNo personality data exists for @${username}.`);
    }
  }

  private async handleDebugCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    const subCommand = command?.args?.[0]?.toLowerCase();

    if (subCommand === 'mention') {
      // Test mention detection with a sample text
      const testText = command?.args?.slice(1).join(' ') || 'whatsup raz2?';
      
      // Store original log level and temporarily enable debug logging
      this.logger.info('🔍 **DETAILED MENTION DETECTION TEST**');
      
      const mentionResult = this.isBotMentioned(testText, []);
      
      // Also test with the specific failing cases
      const testCases = [
        testText,
        'yeah @raz_2_bot',
        'hey raz2',
        '@raz_2_bot hello',
        'raz2 are you there?'
      ];
      
      let resultsText = `🔍 **Mention Detection Test Results**\n\n**Bot Username:** @${this.botUsername || 'not set'}\n**Bot ID:** ${this.botId || 'not set'}\n\n`;
      
      for (const testCase of testCases) {
        const result = this.isBotMentioned(testCase, []);
        resultsText += `**Test:** "${testCase}"\n**Result:** ${result ? '✅ DETECTED' : '❌ NOT DETECTED'}\n\n`;
      }
      
      resultsText += `**Original test:** "${testText}"\n**Result:** ${mentionResult ? '✅ DETECTED' : '❌ NOT DETECTED'}\n\n`;
      resultsText += `📋 **Check logs for detailed analysis of each detection method.**`;
      
      await this.sendMessage(chatId, resultsText);
      return;
    }

    // Default debug info
    const debugInfo = `🔧 **Bot Debug Information**

**Bot Identity:**
• Username: @${this.botUsername || 'not set'}
• ID: ${this.botId || 'not set'}
• First Name: ${this.botInfo?.firstName || 'not set'}

**Configuration:**
• Learning from: ${Array.from(this.learnFromUsers).map(u => `@${u}`).join(', ') || 'none'}
• Conversations tracked: ${this.conversations.size}
• Idea service: ${this.ideaService.isIdeaEnabled() ? 'enabled' : 'disabled'}
• Web server: ${this.webServer ? 'enabled' : 'disabled'}

**Debug Commands:**
• \`/debug mention <text>\` - Test mention detection with custom text
• \`/debug mention\` - Test with default cases including "@raz_2_bot" and "hey raz2"
• \`/debug\` - Show this debug info

**Note:** This command helps troubleshoot group chat issues and mention detection.`;

    await this.sendMessage(chatId, debugInfo);
  }

  private async handleChatMessage(
    processed: ProcessedMessage,
    conversation: ConversationState
  ): Promise<void> {
    const { chatId, text, userName, userId } = processed;

    this.logger.info('Processing chat message with Claude', {
      chatId,
      userName,
      messageLength: text.length,
      conversationHistory: conversation.messages.length,
      ideaEnabled: this.ideaService.isIdeaEnabled(),
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });

    await this.sendTypingAction(chatId);

    try {
      let strategicContext = '';
      if (this.ideaService.isIdeaEnabled() && conversation.userId) {
        this.logger.debug('Searching for relevant strategic insights', {
          chatId,
          userId: conversation.userId || 'unknown',
          query: text.substring(0, 50)
        });

        try {
          const relevantIdeas = await Promise.race([
            this.ideaService.searchRelevantIdeas(text, conversation.userId, 3),
            new Promise<any[]>((_, reject) => 
              setTimeout(() => reject(new Error('Strategic search timeout')), 5000)
            )
          ]);

          if (relevantIdeas.length > 0) {
            strategicContext = this.ideaService.buildStrategicContext(relevantIdeas, 500);
            this.logger.info('Found relevant strategic insights for context', {
              chatId,
              userId: conversation.userId || 'unknown',
              ideaCount: relevantIdeas.length,
              contextLength: strategicContext.length
            });
          }
        } catch (error) {
          this.logger.warn('Error searching for strategic context, continuing without it', {
            error: error instanceof Error ? error : new Error(String(error)),
            chatId
          });
        }
      }

      let messageWithContext = text;
      if (strategicContext) {
        messageWithContext = `${strategicContext}\n\nCurrent message: ${text}`;
      }

      // Determine if this message should have access to strategic tools
      const isStrategicMessage = this.isMessageStrategic(text);

      this.logger.info('Sending message to Claude API', {
        chatId,
        messageLength: text.length,
        contextLength: strategicContext.length,
        historyLength: conversation.messages.length,
        isStrategicMessage,
        toolsEnabled: isStrategicMessage
      });

      // Get personality adaptation if available
      const senderUsername = processed.originalMessage.from?.username?.toLowerCase()
      const personalityPrompt = senderUsername && this.learnFromUsers.has(senderUsername) 
        ? this.personalityAnalyzer.generatePersonalityPrompt(senderUsername) || undefined
        : undefined

      if (personalityPrompt) {
        this.logger.info('Using learned personality adaptation', {
          chatId,
          username: senderUsername,
          sampleCount: this.personalityAnalyzer.getSampleCount(senderUsername!)
        })
      }

      // Add timeout protection for Claude API calls
      const response = await Promise.race([
        this.claude.sendMessage(
          messageWithContext, 
          conversation.messages,
          conversation.userId,
          chatId,
          isStrategicMessage, // Only enable tools for strategic messages
          false, // isCommand: false for casual conversation
          personalityPrompt // Apply learned personality if available
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Claude API timeout')), 30000)
        )
      ]);

      this.logger.info('Received response from Claude', {
        chatId,
        responseLength: response.content.length,
        content: response.content.substring(0, 200) + (response.content.length > 200 ? '...' : '')
      });

      conversation.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      );

      // Auto-capture strategic insights with timeout protection
      if (this.ideaService.isIdeaEnabled() && conversation.userId && text.length > 20) {
        // Much more conservative strategic detection - require substantial content and specific keywords
        const hasStrategicKeywords = /\b(strategy|strategic|business model|market analysis|product strategy|sales strategy|revenue|growth strategy|competition analysis|partnership|roadmap|planning|decision making|client strategy|competitive advantage|business development)\b/i.test(text);
        const hasBusinessContext = /\b(guild|platform|users|clients|customers|revenue|pricing|features|product|enterprise|b2b|saas)\b/i.test(text);
        const isSubstantialContent = text.length > 50 && text.split(' ').length > 8;
        
        const isStrategic = hasStrategicKeywords && (hasBusinessContext || isSubstantialContent);
        
        this.logger.debug('Strategic content evaluation', {
          chatId,
          userId: conversation.userId,
          textLength: text.length,
          hasStrategicKeywords,
          hasBusinessContext,
          isSubstantialContent,
          isStrategic,
          text: text.substring(0, 100)
        });
        
        if (isStrategic) {
          try {
            const capturedIdea = await Promise.race([
              this.ideaService.captureStrategicIdea(
                'Conversation Insight',
                text,
                conversation.userId,
                chatId,
                'strategy',
                'medium',
                ['conversation', 'auto-captured']
              ),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Idea capture timeout')), 5000)
              )
            ]);
            
            this.logger.info('Auto-captured strategic insight from conversation', {
              chatId,
              userId: conversation.userId,
              contentLength: text.length,
              ideaId: capturedIdea?.id,
              chatIdSkipped: chatId && capturedIdea && !capturedIdea.chatId
            });
          } catch (error) {
            this.logger.warn('Error auto-capturing strategic insight, continuing', {
              error: error instanceof Error ? error : new Error(String(error)),
              chatId,
              userId: conversation.userId,
              isSchemaError: error instanceof Error && error.message.includes('22003')
            });
          }
        }
      }

      this.logger.info('Sending response to Telegram', {
        chatId,
        responseLength: response.content.length
      });

      await this.sendMessage(chatId, response.content);
    } catch (error) {
      this.logger.error('Error processing Claude response:', { 
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        messageText: text.substring(0, 100)
      });
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, an error occurred processing your message';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Sorry, the request took too long to process. Please try again with a shorter message.';
        } else if (error.message.includes('Claude API')) {
          errorMessage = 'Sorry, there was an issue with the AI service. Please try again in a moment.';
        }
      }
      
      await this.sendMessage(chatId, errorMessage);
    }
  }

  private async trackMessageForPersonalityLearning(msg: TelegramBot.Message, processed: ProcessedMessage): Promise<void> {
    if (!msg.from?.username || !processed.isValid || processed.command?.command) return
    
    const username = msg.from.username.toLowerCase()
    if (!this.learnFromUsers.has(username)) return

    try {
      const sample: MessageSample = {
        text: processed.text,
        timestamp: new Date(msg.date * 1000),
        chatType: processed.isGroupChat ? (msg.chat.type as 'group' | 'supergroup') : 'private',
        messageLength: processed.text.length,
        hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(processed.text),
        hasLinks: /https?:\/\//.test(processed.text),
        replyToBot: processed.isReplyToBotMessage
      }

      await this.personalityAnalyzer.addMessageSample(username, sample)
      
      this.logger.debug('Tracked message for personality learning', {
        username,
        messageLength: sample.text.length,
        chatType: sample.chatType,
        sampleCount: this.personalityAnalyzer.getSampleCount(username)
      })
    } catch (error) {
      this.logger.warn('Error tracking message for personality learning', {
        error: error instanceof Error ? error : new Error(String(error)),
        username
      })
    }
  }

  private isMessageStrategic(text: string): boolean {
    // Simple responses should not trigger tools
    const casualResponses = /^\s*(ok|okay|cool|nice|thanks|thank you|yes|no|sure|great|awesome|lol|haha|👍|👌|🙂|😊|😄)\s*$/i;
    if (casualResponses.test(text)) {
      return false;
    }

    // Very short messages are likely casual
    if (text.length < 15 || text.split(' ').length < 3) {
      return false;
    }

    // Check for strategic keywords or substantial business content
    const hasStrategicKeywords = /\b(strategy|strategic|business|market|product|sales|revenue|growth|competition|partnership|client|customer|guild|platform|feature|roadmap|planning|decision|analysis|idea|proposal|suggest|recommend|think|consider|should|could|would|how about|what if)\b/i.test(text);
    const hasQuestions = /\?/.test(text);
    const isSubstantial = text.length > 30;

    return hasStrategicKeywords || hasQuestions || isSubstantial;
  }

  private async handleToolsCommand(chatId: number): Promise<void> {
    await this.sendMessage(chatId, '🧠 Strategic Intelligence System\n\nThis system uses Claude AI for strategic business intelligence. No external tools are needed - Claude provides comprehensive strategic analysis and insights directly.');
  }

  private async handleWebUICommand(chatId: number): Promise<void> {
    try {
      if (!this.webServer) {
        await this.sendMessage(chatId, '❌ Strategic Intelligence Dashboard is not enabled. Please configure and restart the system to enable the dashboard.');
        return;
      }

      const url = this.webServer.getUrl();
      const message = `🧠 Guild.xyz Strategic Intelligence Dashboard

Your strategic intelligence dashboard is available at:
${url}

Strategic Features:
• View all strategic ideas and business intelligence
• Filter by category (strategy, product, sales, partnerships, etc.)
• Track priority and status of strategic initiatives
• Search strategic insights using natural language
• Manage reminders for strategic follow-ups
• Analytics on strategic focus areas

Open the URL in your browser to access your strategic intelligence dashboard.`;

      await this.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error('Error handling strategic dashboard command:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      await this.sendMessage(chatId, 'Error getting strategic dashboard information.');
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    this.logger.info('Attempting to send message', {
      chatId,
      messageLength: text.length,
      preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });

    try {
      const sentMessage = await this.bot.sendMessage(chatId, text, {
        disable_web_page_preview: true,
      });
      
      // Track bot message IDs for reply detection
      if (sentMessage.message_id) {
        const messageKey = `${chatId}:${sentMessage.message_id}`;
        this.botMessageIds.add(messageKey);
        
        // Clean up old message IDs (keep last 100 per chat)
        if (this.botMessageIds.size > 1000) {
          const messagesToDelete = Array.from(this.botMessageIds).slice(0, -100);
          messagesToDelete.forEach(key => this.botMessageIds.delete(key));
        }
      }
      
      this.logger.info('Message sent successfully', {
        chatId,
        messageLength: text.length,
        messageId: sentMessage.message_id
      });
    } catch (error) {
      this.logger.error('Error sending message:', { 
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        messageLength: text.length,
        messagePreview: text.substring(0, 100)
      });
    }
  }



  private async sendTypingAction(chatId: number): Promise<void> {
    try {
      await this.bot.sendChatAction(chatId, 'typing');
    } catch (error) {
      this.logger.warn('Error sending typing action:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  private getWelcomeMessage(): string {
    return `🧠 Guild.xyz Strategic Intelligence System

Welcome! I'm your AI strategic intelligence assistant, designed specifically to support your role as CEO of Guild.xyz.

I help with:
• Strategic planning and decision making
• Product strategy and roadmap insights
• Enterprise sales intelligence and client insights
• Competitive analysis and market intelligence
• Partnership and business development opportunities
• Team and operational strategy

💡 **NEW: Intelligent Idea Management**
I can now automatically:
• Capture and save your strategic ideas during conversations
• Search through your previous ideas using natural language
• Provide overviews of your idea landscape and insights

Just mention an idea or ask me to find something - I'll handle it intelligently!

Use /help for available commands.

What strategic challenge would you like to discuss?`;
  }

  private getHelpMessage(): string {
    const baseCommands = `🧠 Strategic Intelligence Commands

/start - Show welcome message
/help - Show this help
/clear - Clear conversation history
/ui or /dashboard - Access strategic intelligence dashboard

📱 **Group Chat Behavior**:
In group chats, I only respond when:
• Someone replies to my message
• Someone mentions me (@${this.botUsername || 'botname'})
• A command is used (starts with /)
This keeps conversations focused and prevents spam.`;

    const strategicCommands = this.ideaService.isIdeaEnabled() ? `

💡 Strategic Intelligence:
/ideas - View your strategic ideas and insights
/capture <idea> - Manually capture strategic insight
/search <query> - Search your strategic knowledge base
/forget <ID> - Delete a specific idea by ID (e.g., /forget abc123)

🧠 AI can now also:
• Auto-generate titles and descriptions for new ideas
• Intelligently capture strategic insights during conversations
• Search and retrieve your strategic knowledge base` : '';

    const personalityCommands = `

🎭 Personality Learning:
/learn - View learning system status  
/learn add <username> - Start learning from user's style
/learn remove <username> - Stop learning from user
/personality <username> - View learned communication traits
/forget_personality <username> - Clear personality data

🔧 Debugging:
/debug - Show bot debug information
/debug mention <text> - Test mention detection

🤖 The bot adapts its casual responses to match learned communication patterns while maintaining its core crypto founder personality.`;

    const examples = `

Strategic Examples:
• "What's our competitive position in the Web3 space?"
• "How should we approach enterprise clients in 2024?"
• "What product features would drive user engagement?"
• "Analyze the partnership opportunity with [company]"
• "What are the key hiring priorities for Q2?"

I'm here to support your strategic thinking for Guild.xyz's continued growth!`;

    return baseCommands + strategicCommands + personalityCommands + examples;
  }

  private async fetchBotInfo(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      
      this.botInfo = {
        id: me.id,
        username: me.username || '',
        firstName: me.first_name,
        isBot: me.is_bot,
        canJoinGroups: (me as any).can_join_groups || false,
        canReadAllGroupMessages: (me as any).can_read_all_group_messages || false,
        supportsInlineQueries: (me as any).supports_inline_queries || false
      };

      this.logger.info('Bot information fetched', {
        id: this.botInfo.id,
        username: this.botInfo.username,
        firstName: this.botInfo.firstName
      });

      // Try to fetch and download profile photo
      await this.fetchBotProfilePhoto();

    } catch (error) {
      this.logger.error('Failed to fetch bot information', {
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  private async fetchBotProfilePhoto(): Promise<void> {
    if (!this.botInfo) return;

    try {
      // Ensure profile photo directory exists
      if (!existsSync(this.profilePhotoDir)) {
        mkdirSync(this.profilePhotoDir, { recursive: true });
      }

      // Get bot profile photos
      const photos = await this.bot.getUserProfilePhotos(this.botInfo.id, { limit: 1 });
      
      if (!photos.photos || photos.photos.length === 0) {
        this.logger.info('No profile photos found for bot');
        return;
      }

      const photo = photos.photos[0];
      if (!photo || photo.length === 0) {
        this.logger.info('No photo sizes available');
        return;
      }

      // Get the largest photo size
      const largestPhoto = photo.reduce((prev, current) => 
        (current.width > prev.width) ? current : prev
      );

      // Get file path from Telegram
      const file = await this.bot.getFile(largestPhoto.file_id);
      if (!file.file_path) {
        this.logger.warn('No file path available for profile photo');
        return;
      }

      // Download the photo
      const photoFileName = `bot_${this.botInfo.id}_profile.jpg`;
      const localPhotoPath = join(this.profilePhotoDir, photoFileName);
      
      await this.downloadTelegramFile(file.file_path, localPhotoPath);

      // Update bot info with photo paths
      this.botInfo.profilePhotoPath = localPhotoPath;
      this.botInfo.profilePhotoUrl = `/api/bot/photo`;

      this.logger.info('Bot profile photo downloaded', {
        localPath: localPhotoPath,
        originalSize: `${largestPhoto.width}x${largestPhoto.height}`
      });

    } catch (error) {
      this.logger.warn('Failed to fetch bot profile photo', {
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  private async downloadTelegramFile(filePath: string, localPath: string): Promise<void> {
    const url = `https://api.telegram.org/file/bot${this.config.telegramToken}/${filePath}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const writeStream = createWriteStream(localPath);
      await pipeline(Readable.fromWeb(response.body), writeStream);

      this.logger.debug('File downloaded successfully', {
        url: filePath,
        localPath
      });

    } catch (error) {
      this.logger.error('Failed to download Telegram file', {
        error: error instanceof Error ? error : new Error(String(error)),
        url: filePath,
        localPath
      });
      throw error;
    }
  }

  public getBotInfo(): BotInfo | undefined {
    return this.botInfo;
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting bot initialization...');
      
      const me = await this.bot.getMe();
      this.botUsername = me.username;
      this.botId = me.id;
      
      this.logger.info(`Bot started: @${me.username}`, {
        id: me.id,
        firstName: me.first_name,
        isBot: me.is_bot,
        username: this.botUsername,
        mentionDetectionReady: !!this.botUsername
      });

      // Fetch detailed bot information and profile photo
      await this.fetchBotInfo();

      this.logger.info('Initializing Claude client...');
      await this.claude.initialize();
      this.logger.info('Claude client initialized');

      // Initialize idea store if configured
      if (this.ideaService.isIdeaEnabled()) {
        this.logger.info('Initializing idea store...');
        try {
          await this.ideaService.initializeStore();
          this.logger.info('Idea store initialized successfully');
        } catch (error) {
          this.logger.error('Failed to initialize idea store', {
            error: error instanceof Error ? error : new Error(String(error))
          });
          // Continue without idea functionality but log the failure
          this.logger.warn('Bot will continue without idea management functionality');
        }
      }

      // Start web server if configured
      if (this.webServer) {
        this.logger.info('Starting web server...');
        try {
          await this.webServer.start();
          this.logger.info('Web server started successfully', {
            url: this.webServer.getUrl()
          });
        } catch (error) {
          this.logger.error('Failed to start web server', {
            error: error instanceof Error ? error : new Error(String(error))
          });
          // Continue without web server functionality
        }
      }

      this.startCleanupInterval();
      this.logger.info('Cleanup interval started');
      
      this.logger.info('Bot fully initialized and ready for messages');
    } catch (error) {
      this.logger.error('Failed to start bot:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldConversations();
    }, 60 * 60 * 1000);
  }

  private cleanupOldConversations(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;

    for (const [chatId, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < oneHourAgo) {
        this.conversations.delete(chatId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cleaned up ${cleaned} old conversations`);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.stopPolling();
      await this.claude.shutdown();
      
      // Stop web server if running
      if (this.webServer) {
        this.logger.info('Stopping web server...');
        await this.webServer.stop();
        this.logger.info('Web server stopped');
      }
      
      this.conversations.clear();
      this.logger.info('Bot stopped');
    } catch (error) {
      this.logger.error('Error stopping bot:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }
} 