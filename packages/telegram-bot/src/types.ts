import { ClaudeMessage } from '@raz2/shared';
import type { MemoryStoreConfig } from '@raz2/memory-store';

export interface BotConfig {
  telegramToken: string;
  claudeApiKey: string;
  mcpServerPath: string;
  memoryStore?: MemoryStoreConfig;
}

export interface ConversationState {
  chatId: number;
  messages: ClaudeMessage[];
  lastActivity: Date;
  userId?: string;
  userName?: string;
  memoryContext?: string[];
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