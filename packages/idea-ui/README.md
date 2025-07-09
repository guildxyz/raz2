# Memory Store UI

A modern React-based web interface for viewing and managing data stored in the Memory Store. This application provides a spreadsheet-like view of all memories with powerful filtering, sorting, and management capabilities.

## Features

- **Spreadsheet View**: Display all memories in a clean, sortable table format
- **Advanced Filtering**: Filter by user ID, category, chat ID, and tags
- **Real-time Search**: Search across memory content, categories, and tags
- **Statistics Dashboard**: View comprehensive stats about your memory store
- **Memory Management**: Delete memories directly from the interface
- **Responsive Design**: Works on desktop and mobile devices
- **Connection Management**: Easy configuration for Redis and OpenAI connections

## Prerequisites

- Node.js (version 18 or higher)
- Bun package manager
- Redis server running
- OpenAI API key
- Memory Store package configured and running

## Installation

1. Navigate to the memory-ui package directory:
```bash
cd packages/memory-ui
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun dev
```

The application will be available at `http://localhost:5173`

## Configuration

On first launch, you'll need to configure your connection settings:

### Required Settings

- **Redis URL**: Connection string for your Redis instance (e.g., `redis://localhost:6379`)
- **OpenAI API Key**: Your OpenAI API key for generating embeddings
- **Index Name**: Name of the Redis search index (default: `memory-index`)
- **Embedding Model**: OpenAI model to use for embeddings
- **Vector Dimension**: Dimension of the embedding vectors

### Supported Embedding Models

- `text-embedding-3-small` (1536 dimensions)
- `text-embedding-3-large` (3072 dimensions)
- `text-embedding-ada-002` (1536 dimensions)

Configuration is automatically saved to browser localStorage for convenience.

## Usage

### Viewing Memories

Once connected, you'll see:
- **Statistics Card**: Overview of your memory store including total memories, index size, unique users, and recent activity
- **Memory Table**: Sortable table showing all memories with their content, metadata, and timestamps

### Table Features

- **Sorting**: Click column headers to sort by any field
- **Search**: Use the search bar to find memories by content, category, or tags
- **Filtering**: Toggle the filter panel to narrow results by:
  - User ID
  - Category
  - Chat ID
  - Tags
- **Actions**: Delete memories directly from the table

### Memory Table Columns

- **ID**: Unique identifier for each memory
- **Content**: The actual memory content (truncated for display)
- **Category**: Memory category with colored badges
- **Importance**: Numerical importance score
- **Tags**: Associated tags with badges
- **User ID**: User who created the memory
- **Chat ID**: Associated chat identifier
- **Created**: When the memory was created
- **Updated**: When the memory was last modified
- **Actions**: Available actions (delete)

## Development

### Project Structure

```
packages/memory-ui/
├── src/
│   ├── components/
│   │   ├── ConfigForm.tsx      # Connection configuration form
│   │   ├── MemoryTable.tsx     # Main data table component
│   │   └── StatsCard.tsx       # Statistics display component
│   ├── hooks/
│   │   └── useMemoryStore.ts   # Custom hook for memory store operations
│   ├── types.ts                # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # Application entry point
├── index.html                  # HTML template
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

### Building for Production

```bash
bun run build
```

This creates a `dist` folder with the production build.

### Preview Production Build

```bash
bun run preview
```

## Troubleshooting

### Connection Issues

- Ensure Redis is running and accessible
- Verify your OpenAI API key is valid
- Check that the index name matches your memory store configuration
- Ensure vector dimensions match your embedding model

### Performance

- The interface loads up to 1000 memories at once
- Use filters to reduce the dataset for better performance
- Large memory content is automatically truncated in the table view

### Browser Compatibility

- Modern browsers with ES2020 support
- Chrome 88+, Firefox 88+, Safari 14+, Edge 88+

## Contributing

This package is part of the larger raz2 monorepo. To contribute:

1. Make changes in the `packages/memory-ui` directory
2. Follow the existing code style and patterns
3. Test your changes thoroughly
4. Submit a pull request

## License

This project is part of the raz2 monorepo and follows the same licensing terms. 