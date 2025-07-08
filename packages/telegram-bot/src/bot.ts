import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient } from '@raz2/claude-api';
import { createLogger, sanitizeInput, parseCommand } from '@raz2/shared';
import { BotConfig, ConversationState, ProcessedMessage } from './types';

export class TelegramBotService {
  private bot: TelegramBot;
  private claude: ClaudeClient;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();

  constructor(private config: BotConfig) {
    this.logger.info('Initializing TelegramBotService', {
      botToken: this.config.telegramToken ? `${this.config.telegramToken.substring(0, 10)}...` : 'missing',
      claudeApiKey: this.config.claudeApiKey ? `${this.config.claudeApiKey.substring(0, 10)}...` : 'missing',
      mcpServerPath: this.config.mcpServerPath
    });

    this.bot = new TelegramBot(this.config.telegramToken, { 
      polling: true,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4
        }
      }
    });
    
    this.claude = new ClaudeClient();
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

      const conversation = this.getOrCreateConversation(processed.chatId);
      
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

  private getOrCreateConversation(chatId: number): ConversationState {
    if (!this.conversations.has(chatId)) {
      this.logger.info('Creating new conversation', { chatId });
      this.conversations.set(chatId, {
        chatId,
        messages: [],
        lastActivity: new Date(),
      });
    } else {
      this.logger.debug('Using existing conversation', { 
        chatId,
        messageCount: this.conversations.get(chatId)?.messages.length || 0
      });
    }

    const conversation = this.conversations.get(chatId)!;
    conversation.lastActivity = new Date();
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
      
      default:
        this.logger.warn('Unknown command received', {
          chatId,
          command: command?.command,
          fullText: processed.text
        });
        await this.sendMessage(chatId, `Unknown command: ${command?.command}`);
    }
  }

  private async handleChatMessage(
    processed: ProcessedMessage,
    conversation: ConversationState
  ): Promise<void> {
    const { chatId, text, userName } = processed;

    this.logger.info('Processing chat message with Claude', {
      chatId,
      userName,
      messageLength: text.length,
      conversationHistory: conversation.messages.length,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });

    await this.sendTypingAction(chatId);

    try {
      this.logger.info('Sending message to Claude API', {
        chatId,
        messageLength: text.length,
        historyLength: conversation.messages.length
      });

      const response = await this.claude.sendMessage(text, conversation.messages);

      this.logger.info('Received response from Claude', {
        chatId,
        responseLength: response.content.length,
        toolCallsCount: response.toolCalls?.length || 0,
        toolNames: response.toolCalls?.map(t => t.name) || [],
        content: response.content.substring(0, 200) + (response.content.length > 200 ? '...' : '')
      });

      conversation.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.content }
      );

      this.logger.info('Sending response to Telegram', {
        chatId,
        responseLength: response.content.length
      });

      await this.sendMessage(chatId, response.content);

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolInfo = response.toolCalls.map((tool) => `• ${tool.name}`).join('\n');
        this.logger.info('Sending tool usage info', {
          chatId,
          toolCount: response.toolCalls.length,
          tools: response.toolCalls.map(t => t.name)
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
    return `📖 Available Commands

/start - Show welcome message
/help - Show this help
/clear - Clear conversation history
/tools - List available tools

Examples:
• "What's the weather like?"
• "Calculate 2 + 2 * 3"
• "What time is it in Tokyo?"
• "Echo hello world"

Just type naturally and I'll help you!`;
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting bot initialization...');
      
      const me = await this.bot.getMe();
      this.logger.info(`Bot started: @${me.username}`, {
        id: me.id,
        firstName: me.first_name,
        canJoinGroups: me.can_join_groups,
        canReadAllGroupMessages: me.can_read_all_group_messages,
        supportsInlineQueries: me.supports_inline_queries
      });

      this.logger.info('Initializing Claude client...');
      await this.claude.initialize();
      this.logger.info('Claude client initialized');

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