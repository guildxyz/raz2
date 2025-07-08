import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient } from '@raz2/claude-api';
import { MemoryStore } from '@raz2/memory-store';
import { createLogger, sanitizeInput, parseCommand, MEMORY_STORE_CONFIG } from '@raz2/shared';
import { BotConfig, ConversationState, ProcessedMessage } from './types';
import { MemoryService } from './memory-service';

export class TelegramBotService {
  private bot: TelegramBot;
  private claude: ClaudeClient;
  private memoryService: MemoryService;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();

  constructor(private config: BotConfig) {
    this.logger.info('Initializing TelegramBotService', {
      botToken: this.config.telegramToken ? `${this.config.telegramToken.substring(0, 10)}...` : 'missing',
      claudeApiKey: this.config.claudeApiKey ? `${this.config.claudeApiKey.substring(0, 10)}...` : 'missing',
      mcpServerPath: this.config.mcpServerPath,
      memoryEnabled: !!this.config.memoryStore
    });

    this.bot = new TelegramBot(this.config.telegramToken, { 
      polling: true
    });
    
    this.claude = new ClaudeClient();
    
    // Initialize memory service
    if (this.config.memoryStore) {
      const memoryStore = new MemoryStore(this.config.memoryStore);
      this.memoryService = new MemoryService(memoryStore);
      this.logger.info('Memory service enabled');
    } else {
      this.memoryService = new MemoryService();
      this.logger.info('Memory service disabled - no configuration provided');
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
        memoryContext: []
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
      
      case 'memories':
        this.logger.info('Executing memories command', { chatId });
        await this.handleMemoriesCommand(processed);
        break;
      
      case 'remember':
        this.logger.info('Executing remember command', { chatId });
        await this.handleRememberCommand(processed);
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
        await this.sendMessage(chatId, `Unknown command: ${command?.command}`);
    }
  }

  private async handleMemoriesCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId } = processed;

    if (!this.memoryService.isMemoryEnabled()) {
      await this.sendMessage(chatId, '🧠 Memory feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for memory operations');
      return;
    }

    try {
      const stats = await this.memoryService.getStats(userId.toString());
      const memories = await this.memoryService.getUserMemories(userId.toString(), 10);

      if (stats.count === 0) {
        await this.sendMessage(chatId, '🧠 No memories found. Start chatting to build your memory!');
        return;
      }

      const categoriesText = Object.entries(stats.categories)
        .map(([category, count]) => `• ${category}: ${count}`)
        .join('\n');

      const recentMemories = memories.slice(0, 5)
        .map((memory, index) => {
          const date = memory.createdAt.toLocaleDateString();
          const preview = memory.content.substring(0, 60) + (memory.content.length > 60 ? '...' : '');
          return `${index + 1}. ${preview} (${date})`;
        })
        .join('\n');

      const message = `🧠 Your Memories (${stats.count} total)

📊 Categories:
${categoriesText}

📝 Recent memories:
${recentMemories}

Use /search <query> to find specific memories
Use /remember <text> to save important information`;

      await this.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error('Error in memories command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId
      });
      await this.sendMessage(chatId, '❌ Error retrieving memories');
    }
  }

  private async handleRememberCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId, command } = processed;

    if (!this.memoryService.isMemoryEnabled()) {
      await this.sendMessage(chatId, '🧠 Memory feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for memory operations');
      return;
    }

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, '❌ Please provide text to remember\nUsage: /remember <important information>');
      return;
    }

    const content = command.args.join(' ');
    
    try {
      const memory = await this.memoryService.storeUserPreference(
        content,
        userId.toString(),
        chatId,
        4 // High importance for manually saved memories
      );

      if (memory) {
        await this.sendMessage(chatId, `✅ Remembered: "${content}"`);
        this.logger.info('User manually saved memory', {
          chatId,
          userId,
          memoryId: memory.id,
          contentLength: content.length
        });
      } else {
        await this.sendMessage(chatId, '❌ Failed to save memory');
      }
    } catch (error) {
      this.logger.error('Error in remember command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId,
        content: content.substring(0, 50)
      });
      await this.sendMessage(chatId, '❌ Error saving memory');
    }
  }

  private async handleForgetCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId } = processed;

    if (!this.memoryService.isMemoryEnabled()) {
      await this.sendMessage(chatId, '🧠 Memory feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for memory operations');
      return;
    }

    // For now, just show message about clearing conversation
    // In the future, could implement selective memory deletion
    this.conversations.delete(chatId);
    
    await this.sendMessage(chatId, `🧠 Conversation cleared! 

Your stored memories remain intact. To manage individual memories, use:
• /memories - View your memories
• /search <query> - Find specific memories

Note: Automatic memory deletion is not yet implemented for safety.`);
  }

  private async handleSearchCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, userId, command } = processed;

    if (!this.memoryService.isMemoryEnabled()) {
      await this.sendMessage(chatId, '🧠 Memory feature is not enabled');
      return;
    }

    if (!userId) {
      await this.sendMessage(chatId, '❌ Unable to identify user for memory operations');
      return;
    }

    if (!command?.args || command.args.length === 0) {
      await this.sendMessage(chatId, '❌ Please provide search terms\nUsage: /search <what to find>');
      return;
    }

    const query = command.args.join(' ');
    
    try {
      const results = await this.memoryService.searchRelevantMemories(
        query,
        userId.toString(),
        10
      );

      if (results.length === 0) {
        await this.sendMessage(chatId, `🔍 No memories found for: "${query}"`);
        return;
      }

      const searchResults = results
        .map((result, index) => {
          const score = (result.score * 100).toFixed(1);
          const date = result.memory.createdAt.toLocaleDateString();
          const category = result.memory.metadata.category || 'general';
          return `${index + 1}. ${result.memory.content}
   📊 ${score}% match | 📅 ${date} | 🏷️ ${category}`;
        })
        .join('\n\n');

      await this.sendMessage(chatId, `🔍 Search results for: "${query}"

${searchResults}`);
    } catch (error) {
      this.logger.error('Error in search command', {
        error: error instanceof Error ? error : new Error(String(error)),
        chatId,
        userId,
        query: query.substring(0, 50)
      });
      await this.sendMessage(chatId, '❌ Error searching memories');
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
      memoryEnabled: this.memoryService.isMemoryEnabled(),
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });

    await this.sendTypingAction(chatId);

    try {
      // Search for relevant memories if memory is enabled
      let memoryContext = '';
      if (this.memoryService.isMemoryEnabled() && conversation.userId) {
        this.logger.debug('Searching for relevant memories', {
          chatId,
          userId: conversation.userId || 'unknown',
          query: text.substring(0, 50)
        });

        const relevantMemories = await this.memoryService.searchRelevantMemories(
          text,
          conversation.userId,
          3
        );

        if (relevantMemories.length > 0) {
          memoryContext = this.memoryService.buildMemoryContext(relevantMemories, 500);
          this.logger.info('Found relevant memories for context', {
            chatId,
            userId: conversation.userId || 'unknown',
            memoryCount: relevantMemories.length,
            contextLength: memoryContext.length
          });
        }
      }

      // Prepare message for Claude with memory context
      let messageWithContext = text;
      if (memoryContext) {
        messageWithContext = `${memoryContext}\n\nCurrent message: ${text}`;
      }

      this.logger.info('Sending message to Claude API', {
        chatId,
        messageLength: text.length,
        contextLength: memoryContext.length,
        historyLength: conversation.messages.length
      });

      const response = await this.claude.sendMessage(messageWithContext, conversation.messages);

      this.logger.info('Received response from Claude', {
        chatId,
        responseLength: response.content.length,
        toolCallsCount: response.toolCalls?.length || 0,
        toolNames: response.toolCalls?.map((t: any) => t.name) || [],
        content: response.content.substring(0, 200) + (response.content.length > 200 ? '...' : '')
      });

      conversation.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      );

      // Store conversation memory if enabled and significant
      if (this.memoryService.isMemoryEnabled() && conversation.userId && text.length > 10) {
        // Store user message as conversation memory
        await this.memoryService.storeConversationMemory(
          text,
          conversation.userId,
          chatId,
          conversation.userName
        );

        // Store significant assistant responses
        if (response.content.length > 20 && !response.content.startsWith('🛠️')) {
          await this.memoryService.storeConversationMemory(
            `Assistant response: ${response.content}`,
            conversation.userId,
            chatId,
            conversation.userName
          );
        }
      }

      this.logger.info('Sending response to Telegram', {
        chatId,
        responseLength: response.content.length
      });

      await this.sendMessage(chatId, response.content);

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolInfo = response.toolCalls.map((tool: any) => `• ${tool.name}`).join('\n');
        this.logger.info('Sending tool usage info', {
          chatId,
          toolCount: response.toolCalls.length,
          tools: response.toolCalls.map((t: any) => t.name)
        });
        await this.sendMessage(chatId, `🛠️ Tools used:\n${toolInfo}`);
      }
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
    try {
      const tools = await this.claude.listAvailableTools();
      
      if (tools.length === 0) {
        await this.sendMessage(chatId, 'No tools are currently available.');
        return;
      }

      const toolList = tools.map((tool: string) => 
        `🔧 ${tool}`
      ).join('\n');

      await this.sendMessage(chatId, `Available tools:\n\n${toolList}`);
    } catch (error) {
      this.logger.error('Error fetching tools:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      await this.sendMessage(chatId, 'Error fetching available tools.');
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
    return `🤖 Claude Bot

Welcome! I'm an AI assistant powered by Claude with access to various tools.

You can:
• Chat with me naturally
• Ask me to use tools like calculator, weather, time
• Use /help for more commands

What would you like to talk about?`;
  }

  private getHelpMessage(): string {
    const baseCommands = `📖 Available Commands

/start - Show welcome message
/help - Show this help
/clear - Clear conversation history
/tools - List available tools`;

    const memoryCommands = this.memoryService.isMemoryEnabled() ? `

🧠 Memory Commands:
/memories - View your stored memories
/remember <text> - Save important information
/search <query> - Search your memories
/forget - Clear conversation (memories preserved)` : '';

    const examples = `

Examples:
• "What's the weather like?"
• "Calculate 2 + 2 * 3"
• "What time is it in Tokyo?"
• "Echo hello world"

Just type naturally and I'll help you!`;

    return baseCommands + memoryCommands + examples;
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
      if (this.memoryService.isMemoryEnabled()) {
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
      this.conversations.clear();
      this.logger.info('Bot stopped');
    } catch (error) {
      this.logger.error('Error stopping bot:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }
} 