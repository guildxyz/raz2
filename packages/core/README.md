# @raz2/core

Core backend API server for the Strategic Intelligence System.

## Overview

The core package provides a REST API server that integrates with the existing idea-store and claude-api packages to serve all the APIs needed by the idea-ui. It extends the base idea functionality with subtasks, kanban boards, and AI-powered task breakdown.

## Features

- **REST API Server**: Express.js server with proper middleware, validation, and error handling
- **Idea Management**: Full CRUD operations for strategic ideas
- **AI Task Breakdown**: Automatic generation of actionable subtasks using Claude AI
- **Kanban Integration**: Built-in kanban board organization for subtasks
- **Search & Filtering**: Support for semantic search and advanced filtering
- **Type Safety**: Full TypeScript support with Zod validation

## API Endpoints

### Ideas

- `POST /api/ideas` - Create new idea with optional AI task breakdown
- `GET /api/ideas` - List ideas with filtering and search
- `GET /api/ideas/:id` - Get specific idea
- `PATCH /api/ideas/:id` - Update idea with optional subtask regeneration  
- `DELETE /api/ideas/:id` - Delete idea

### Health & Status

- `GET /health` - Health check endpoint
- `GET /` - API information and available endpoints

## Usage

### Starting the Server

```bash
cd packages/core
bun run dev        # Development mode with hot reload
bun run build      # Build for production
bun run start      # Start production server
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string with pgvector
- `ANTHROPIC_API_KEY` - Claude API key for AI task breakdown
- `OPENAI_API_KEY` - OpenAI API key for embeddings

Optional:
- `WEB_SERVER_PORT` - Server port (default: 3000)
- `WEB_SERVER_HOST` - Server host (default: 0.0.0.0)
- `EMBEDDING_MODEL` - OpenAI embedding model (default: text-embedding-3-small)

### Integration

The core server integrates seamlessly with:

- **@raz2/idea-store** - Data persistence and vector search
- **@raz2/claude-api** - AI-powered task breakdown
- **@raz2/shared** - Common types and utilities

### API Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
```

### Extended Idea Format

Ideas are enhanced with subtask and kanban functionality:

```typescript
interface ExtendedIdea extends BaseIdea {
  subtasks: Subtask[]
  kanbanColumns: KanbanColumn[]
  aiBreakdown?: AITaskBreakdown
}
```

## Development

The core package is designed to be the central API hub for the Strategic Intelligence System, providing all the endpoints the idea-ui needs while maintaining clean separation of concerns and proper integration with existing packages. 