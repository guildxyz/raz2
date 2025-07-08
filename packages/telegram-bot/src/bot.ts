import TelegramBot from 'node-telegram-bot-api';
import { ClaudeClient } from '@claude-telegram-bot/claude-api';
import { createLogger, sanitizeInput, parseCommand } from '@claude-telegram-bot/shared';
import { BotConfig, ConversationState, ProcessedMessage } from './types';

export class TelegramBotService {
  private bot: TelegramBot;
  private claude: ClaudeClient;
  private logger = createLogger('TelegramBot');
  private conversations = new Map<number, ConversationState>();

  constructor(private config: BotConfig) {
    this.bot = new TelegramBot(config.telegramToken, { polling: true });
    this.claude = new ClaudeClient({
      anthropicApiKey: config.claudeApiKey,
      mcpServerPath: config.mcpServerPath,
    });
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.on('message', this.handleMessage.bind(this));
    this.bot.on('polling_error', (error) => {
      this.logger.error('Polling error:', error);
    });

    this.logger.info('Telegram bot initialized');
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      const processed = this.processMessage(msg);
      if (!processed.isValid) {
        await this.sendMessage(processed.chatId, 'Invalid message format');
        return;
      }

      const conversation = this.getOrCreateConversation(processed.chatId);
      
      if (processed.command) {
        await this.handleCommand(processed);
        return;
      }

      await this.handleChatMessage(processed, conversation);
    } catch (error) {
      this.logger.error('Error handling message:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      await this.sendMessage(msg.chat.id, 'Sorry, an error occurred processing your message');
    }
  }

  private processMessage(msg: TelegramBot.Message): ProcessedMessage {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const sanitizedText = sanitizeInput(text);
    
    const command = parseCommand(sanitizedText);
    
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
      this.conversations.set(chatId, {
        chatId,
        messages: [],
        lastActivity: new Date(),
      });
    }

    const conversation = this.conversations.get(chatId)!;
    conversation.lastActivity = new Date();
    return conversation;
  }

  private async handleCommand(processed: ProcessedMessage): Promise<void> {
    const { chatId, command } = processed;

    switch (command?.command) {
      case 'start':
        await this.sendMessage(chatId, this.getWelcomeMessage());
        break;
      
      case 'help':
        await this.sendMessage(chatId, this.getHelpMessage());
        break;
      
      case 'clear':
        this.conversations.delete(chatId);
        await this.sendMessage(chatId, 'Conversation cleared!');
        break;
      
      case 'tools':
        await this.handleToolsCommand(chatId);
        break;
      
      default:
        await this.sendMessage(chatId, `Unknown command: ${command?.command}`);
    }
  }

  private async handleChatMessage(
    processed: ProcessedMessage,
    conversation: ConversationState
  ): Promise<void> {
    const { chatId, text, userName } = processed;

    await this.sendTypingAction(chatId);

    const response = await this.claude.sendMessage(text, {
      conversationId: chatId.toString(),
      userName,
    });

    if (response.success) {
      conversation.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.message }
      );

      await this.sendMessage(chatId, response.message);

      if (response.toolsUsed && response.toolsUsed.length > 0) {
        const toolInfo = response.toolsUsed.map((tool: string) => `• ${tool}`).join('\n');
        await this.sendMessage(chatId, `🛠️ Tools used:\n${toolInfo}`);
      }
    } else {
      await this.sendMessage(chatId, `Error: ${response.error}`);
    }
  }

  private async handleToolsCommand(chatId: number): Promise<void> {
    try {
      const tools = await this.claude.getAvailableTools();
      
      if (tools.length === 0) {
        await this.sendMessage(chatId, 'No tools are currently available.');
        return;
      }

      const toolList = tools.map((tool: any) => 
        `🔧 **${tool.name}**\n   ${tool.description}`
      ).join('\n\n');

      await this.sendMessage(chatId, `Available tools:\n\n${toolList}`);
    } catch (error) {
      this.logger.error('Error fetching tools:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      await this.sendMessage(chatId, 'Error fetching available tools.');
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
    } catch (error) {
      this.logger.error('Error sending message:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
      try {
        await this.bot.sendMessage(chatId, text);
      } catch (fallbackError) {
        this.logger.error('Error sending fallback message:', { 
          error: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
        });
      }
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
    return `🤖 **Claude Bot**

Welcome! I'm an AI assistant powered by Claude with access to various tools.

You can:
• Chat with me naturally
• Ask me to use tools like calculator, weather, time
• Use /help for more commands

What would you like to talk about?`;
  }

  private getHelpMessage(): string {
    return `📖 **Available Commands**

/start - Show welcome message
/help - Show this help
/clear - Clear conversation history
/tools - List available tools

**Examples:**
• "What's the weather like?"
• "Calculate 2 + 2 * 3"
• "What time is it in Tokyo?"
• "Echo hello world"

Just type naturally and I'll help you!`;
  }

  public async start(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      this.logger.info(`Bot started: @${me.username}`);
      
      await this.claude.initialize();
      this.logger.info('Claude client initialized');
      
      this.startCleanupInterval();
    } catch (error) {
      this.logger.error('Error starting bot:', { 
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
      await this.claude.cleanup();
      this.conversations.clear();
      this.logger.info('Bot stopped');
    } catch (error) {
      this.logger.error('Error stopping bot:', { 
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }
} 