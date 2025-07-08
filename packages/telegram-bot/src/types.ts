import { ClaudeMessage } from '@raz2/shared';

export interface BotConfig {
  telegramToken: string;
  claudeApiKey: string;
  mcpServerPath: string;
}

export interface ConversationState {
  chatId: number;
  messages: ClaudeMessage[];
  lastActivity: Date;
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