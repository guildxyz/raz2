import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient } from '@raz2/claude-api';
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
  private webServer?: WebServer;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();

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
      this.ideaService = new IdeaService(ideaStore);
      this.logger.info('Idea service enabled');
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
      this.logger.info('Raw message received', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        from: {
          id: msg.from?.id,
          username: msg.from?.username,
          firstName: msg.from?.first_name
        },
        text: msg.text,
        hasText: !!msg.text,
        messageType: msg.photo ? 'photo' : msg.document ? 'document' : msg.sticker ? 'sticker' : 'text'
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
        messageId: msg.message_id
      });

      const processed = this.processMessage(msg);
      
      this.logger.info('Message processed', {
        chatId: processed.chatId,
        isValid: processed.isValid,
        hasCommand: !!processed.command?.command,
        command: processed.command?.command,
        textLength: processed.text.length,
        originalText: msg.text,
        sanitizedText: processed.text
      });

      if (!processed.isValid) {
        this.logger.warn('Invalid message format detected', { processed });
        await this.sendMessage(processed.chatId, 'Invalid message format');
        return;
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
        conversationLength: conversation.messages.length
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
    
    const command = parseCommand(sanitizedText);
    
    this.logger.debug('Processing message', {
      originalText: text,
      sanitizedText,
      hasCommand: !!command.command,
      command: command.command
    });
    
    return {
      chatId,
      text: sanitizedText,
      command,
      isValid: sanitizedText.length > 0,
      userId: msg.from?.id,
      userName: msg.from?.username || msg.from?.first_name || 'User',
    };
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
          return `${index + 1}. ${priority} ${preview} (${date})`;
        })
        .join('\n');

      const message = `💡 Your Strategic Ideas (${stats.count} total)

📊 Categories:
${categoriesText}

📝 Recent strategic ideas:
${recentIdeas}

Use /search <query> to find specific strategic insights
Use /capture <idea> to manually save strategic information`;

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
        await this.sendMessage(chatId, `✅ Strategic insight captured: "${content}"\n\nCategory: ${idea.category}\nPriority: ${idea.priority}`);
        this.logger.info('User manually captured strategic idea', {
          chatId,
          userId,
          ideaId: idea.id,
          contentLength: content.length
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
      await this.sendMessage(chatId, '❌ Error capturing strategic insight');
    }
  }

  private async handleForgetCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId } = processed;

    if (!this.ideaService.isIdeaEnabled()) {
      await this.sendMessage(chatId, '💡 Strategic intelligence feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for strategic operations');
      return;
    }

    this.conversations.delete(chatId);
    
    await this.sendMessage(chatId, `🧠 Conversation cleared! 

Your strategic intelligence repository remains intact. To manage strategic ideas:
• /ideas - View your strategic ideas
• /search <query> - Find specific strategic insights
• /dashboard - Access strategic intelligence dashboard

Strategic insights are preserved for long-term strategic planning.`);
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
          return `${index + 1}. ${priority} ${title}
   📊 ${score}% match | 📅 ${date} | 🏷️ ${category}`;
        })
        .join('\n\n');

      await this.sendMessage(chatId, `🔍 Strategic insights for: "${query}"

${searchResults}`);
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

        const relevantIdeas = await this.ideaService.searchRelevantIdeas(
          text,
          conversation.userId,
          3
        );

        if (relevantIdeas.length > 0) {
          strategicContext = this.ideaService.buildStrategicContext(relevantIdeas, 500);
          this.logger.info('Found relevant strategic insights for context', {
            chatId,
            userId: conversation.userId || 'unknown',
            ideaCount: relevantIdeas.length,
            contextLength: strategicContext.length
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

      const response = await this.claude.sendMessage(messageWithContext, conversation.messages);

      this.logger.info('Received response from Claude', {
        chatId,
        responseLength: response.content.length,
        content: response.content.substring(0, 200) + (response.content.length > 200 ? '...' : '')
      });

      conversation.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      );

      if (this.ideaService.isIdeaEnabled() && conversation.userId && text.length > 20) {
        const isStrategic = /\b(strategy|strategic|business|market|product|sales|revenue|growth|competition|partnership|client|customer|guild|platform|feature|roadmap|planning|decision|analysis)\b/i.test(text);
        
        if (isStrategic) {
          await this.ideaService.captureStrategicIdea(
            'Conversation Insight',
            text,
            conversation.userId,
            chatId,
            'strategy',
            'medium',
            ['conversation', 'auto-captured']
          );
          
          this.logger.info('Auto-captured strategic insight from conversation', {
            chatId,
            userId: conversation.userId,
            contentLength: text.length
          });
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
      await this.sendMessage(chatId, 'Sorry, an error occurred processing the response');
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
      await this.bot.sendMessage(chatId, text, {
        disable_web_page_preview: true,
      });
      
      this.logger.info('Message sent successfully', {
        chatId,
        messageLength: text.length
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

I automatically capture and organize strategic insights from our conversations. Use /help for available commands.

What strategic challenge would you like to discuss?`;
  }

  private getHelpMessage(): string {
    const baseCommands = `🧠 Strategic Intelligence Commands

/start - Show welcome message
/help - Show this help
/clear - Clear conversation history
/ui or /dashboard - Access strategic intelligence dashboard`;

    const strategicCommands = this.ideaService.isIdeaEnabled() ? `

💡 Strategic Intelligence:
/ideas - View your strategic ideas and insights
/capture <idea> - Manually capture strategic insight
/search <query> - Search your strategic knowledge base
/forget - Clear conversation (strategic insights preserved)` : '';

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
      this.logger.info(`Bot started: @${me.username}`, {
        id: me.id,
        firstName: me.first_name,
        isBot: me.is_bot
      });

      this.logger.info('Initializing Claude client...');
      await this.claude.initialize();
      this.logger.info('Claude client initialized');

      // Initialize memory store if configured
      if (this.ideaService.isIdeaEnabled()) {
        this.logger.info('Initializing memory store...');
        try {
          // Access the private memoryStore through a getter or make it accessible
          // For now, we'll rely on lazy initialization in memory service
          this.logger.info('Memory store initialization deferred to first use');
        } catch (error) {
          this.logger.error('Failed to initialize memory store', {
            error: error instanceof Error ? error : new Error(String(error))
          });
          // Continue without memory functionality
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