import { ClaudeMessage } from '@raz2/shared';
import type { IdeaStoreConfig } from '@raz2/idea-store';

export interface BotConfig {
  telegramToken: string;
  claudeApiKey: string;
  mcpServerPath: string;
  ideaStore?: IdeaStoreConfig;
  webServer?: {
    enabled: boolean;
    port: number;
    host: string;
  };
}

export interface ConversationState {
  chatId: number;
  messages: ClaudeMessage[];
  lastActivity: Date;
  userId?: string;
  userName?: string;
  strategicContext?: string[];
}

export interface ProcessedMessage {
  chatId: number;
  text: string;
  command?: Command;
  isValid: boolean;
  userId?: number;
  userName: string;
}

export interface Command {
  command: string;
  args: string[];
}

export interface BotResponse {
  success: boolean;
  message?: string;
  error?: string;
} 