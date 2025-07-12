import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient, ToolExecutor } from '@raz2/claude-api';
import { IdeaStore } from '@raz2/idea-store';
import { createLogger, sanitizeInput, parseCommand, IDEA_STORE_CONFIG } from '@raz2/shared';
import { BotConfig, ConversationState, ProcessedMessage } from './types';
import { IdeaService } from './idea-service';
import { WebServer } from './web-server';
import { resolve, join } from 'node:path';

export class TelegramBotService {
  private bot: TelegramBot;
  private claude: ClaudeClient;
  private ideaService: IdeaService;
  private toolExecutor?: ToolExecutor;
  private webServer?: WebServer;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();
  private botUsername?: string;
  private botId?: number;
  private botMessageIds = new Set<string>();

  constructor(private config: BotConfig) {
    this.logger.info('Initializing TelegramBotService', {
      botToken: this.config.telegramToken ? `${this.config.telegramToken.substring(0, 10)}...` : 'missing',
      claudeApiKey: this.config.claudeApiKey ? `${this.config.claudeApiKey.substring(0, 10)}...` : 'missing',
      mcpServerPath: this.config.mcpServerPath,
      ideaEnabled: !!this.config.ideaStore
    });

    this.bot = new TelegramBot(this.config.telegramToken, { 
      polling: true
    });
    
    this.claude = new ClaudeClient();
    
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
        uiDistPath
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
        messageType
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

      // Group chat behavior: only respond if mentioned, replied to, or it's a command
      if (processed.isGroupChat && !processed.command?.command) {
        const shouldRespond = processed.isReplyToBotMessage || processed.mentionsBot;
        
        this.logger.info('Group chat message evaluation', {
          chatId: processed.chatId,
          shouldRespond,
          isReplyToBotMessage: processed.isReplyToBotMessage,
          mentionsBot: processed.mentionsBot,
          hasCommand: !!processed.command?.command
        });
        
        if (!shouldRespond) {
          this.logger.info('Ignoring group message - bot not mentioned or replied to', {
            chatId: processed.chatId,
            messageId: msg.message_id
          });
          return;
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
    if (!this.botUsername) return false;
    
    // Check for @username mentions
    if (text.includes(`@${this.botUsername}`)) {
      return true;
    }
    
    // Check for mention entities
    if (entities) {
      for (const entity of entities) {
        if (entity.type === 'mention') {
          const mention = text.substring(entity.offset, entity.offset + entity.length);
          if (mention === `@${this.botUsername}`) {
            return true;
          }
        }
      }
    }
    
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

      this.logger.info('Sending message to Claude API', {
        chatId,
        messageLength: text.length,
        contextLength: strategicContext.length,
        historyLength: conversation.messages.length
      });

      // Add timeout protection for Claude API calls
      const response = await Promise.race([
        this.claude.sendMessage(
          messageWithContext, 
          conversation.messages,
          conversation.userId,
          chatId
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
        const isStrategic = /\b(strategy|strategic|business|market|product|sales|revenue|growth|competition|partnership|client|customer|guild|platform|feature|roadmap|planning|decision|analysis)\b/i.test(text);
        
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

    const examples = `

Strategic Examples:
• "What's our competitive position in the Web3 space?"
• "How should we approach enterprise clients in 2024?"
• "What product features would drive user engagement?"
• "Analyze the partnership opportunity with [company]"
• "What are the key hiring priorities for Q2?"

I'm here to support your strategic thinking for Guild.xyz's continued growth!`;

    return baseCommands + strategicCommands + examples;
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
        username: this.botUsername
      });

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