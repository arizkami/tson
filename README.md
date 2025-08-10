# TSON - TypeScript Object Notation

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

TSON (TypeScript Object Notation) is a powerful configuration format that extends JSON with TypeScript-like features. Think of it as JSON's more flexible cousin that actually understands how developers work.

## Why TSON?

Ever been frustrated by JSON's limitations? No comments, no trailing commas, no variables? TSON solves these pain points while maintaining the simplicity and ubiquity of JSON.

```tson
// This is valid TSON! 🎉
const API_VERSION = "v2";
const BASE_URL = "https://api.example.com";

{
  // Comments are supported!
  name: "My Awesome App",
  version: API_VERSION,
  api: {
    baseUrl: BASE_URL,
    timeout: 5000,
    endpoints: [
      "/users",
      "/posts",
      "/comments", // Trailing commas work too!
    ]
  }
}
```

## ✨ Features

- **💬 Comments**: Single-line (`//`) and block comments (`/* */`)
- **🔗 Variables**: Const declarations for reusable values
- **📦 Imports**: Import other TSON files for modular configurations
- **🎯 Trailing Commas**: No more syntax errors from extra commas
- **🏗️ Compilation**: Compile TSON to JSON for production
- **👀 File Watching**: Auto-compile on file changes
- **🚨 Error Handling**: Detailed error messages with line numbers
- **⚡ CLI Tool**: Command-line interface for easy integration
- **🔧 TypeScript**: Full TypeScript support with type definitions

## 📦 Installation

```bash
npm install tson
```

Or with other package managers:

```bash
yarn add tson
bun add tson
pnpm add tson
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { parseTSON } from 'tson';

// Parse a TSON file
const config = parseTSON('./config.tson');
console.log(config);

// Parse TSON string directly
import { parseTSONString } from 'tson';

const tsonContent = `
  const PORT = 3000;
  {
    server: {
      port: PORT,
      host: "localhost"
    }
  }
`;

const result = parseTSONString(tsonContent);
// Output: { server: { port: 3000, host: "localhost" } }
```

### TSON File Imports

Create modular configurations by importing other TSON files:

**database.tson**
```tson
// Database configuration
{
  host: "localhost",
  port: 5432,
  database: "myapp",
  ssl: false
}
```

**app.tson**
```tson
// Main application config
import dbConfig from "./database.tson";

const APP_NAME = "My Application";

{
  name: APP_NAME,
  version: "1.0.0",
  database: dbConfig,
  features: {
    auth: true,
    logging: true
  }
}
```

### Compilation to JSON

Compile TSON files to JSON for production use:

```typescript
import { compileTSONToJSON } from 'tson';

// Compile single file
const outputPath = compileTSONToJSON('./config.tson', {
  outputDir: './dist',
  minify: true,
  preserveComments: true
});

// Compile multiple files
import { compileTSONFiles } from 'tson';

const outputPaths = compileTSONFiles([
  './config/app.tson',
  './config/database.tson'
], {
  outputDir: './dist/config',
  minify: false
});
```

### File Watching

Auto-compile TSON files when they change:

```typescript
import { watchTSONFile } from 'tson';

// Watch and auto-compile
const stopWatching = watchTSONFile('./config.tson', {
  outputDir: './dist',
  minify: true
});

// Stop watching when done
// stopWatching();
```

## 🖥️ CLI Usage

TSON comes with a powerful command-line tool:

```bash
# Parse and validate a TSON file
tson-cli config.tson

# Validate only (no output)
tson-cli config.tson --validate

# Format and prettify output
tson-cli config.tson --format

# Save output to file
tson-cli config.tson --output config.json

# Strict mode (throw on errors)
tson-cli config.tson --strict

# Disable specific features
tson-cli config.tson --no-comments --no-const
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--strict` | Throw errors instead of returning null |
| `--validate` | Only validate the file, don't parse |
| `--format` | Format and prettify the output |
| `--output, -o` | Output to file instead of console |
| `--no-const` | Disable const declaration support |
| `--no-imports` | Disable import statement support |
| `--no-comments` | Disable comment support |
| `--no-trailing-commas` | Disable trailing comma support |
| `--help, -h` | Show help message |

## 📚 API Reference

### Core Functions

#### `parseTSON(filePath, options?)`

Parse a TSON file from disk.

```typescript
interface TSONParseOptions {
  allowTrailingCommas?: boolean;  // default: true
  allowComments?: boolean;        // default: true
  allowConst?: boolean;           // default: true
  allowImports?: boolean;         // default: true
  allowTSONImports?: boolean;     // default: true
  strict?: boolean;               // default: false
  baseDir?: string;               // default: process.cwd()
}
```

#### `parseTSONString(content, options?)`

Parse TSON content from a string.

#### `compileTSONToJSON(inputPath, options?)`

Compile a TSON file to JSON.

```typescript
interface TSONCompileOptions {
  outputDir?: string;           // Output directory
  minify?: boolean;             // Minify JSON output
  preserveComments?: boolean;   // Save comments to .meta.json
  outputExtension?: string;     // File extension (default: '.json')
}
```

#### `validateTSON(filePath)`

Validate a TSON file without parsing.

#### `stringifyTSON(obj, options?)`

Convert a JavaScript object to TSON format.

### Error Handling

TSON provides detailed error information:

```typescript
import { TSONParseError, isTSONParseError } from 'tson';

try {
  const config = parseTSON('./config.tson', { strict: true });
} catch (error) {
  if (isTSONParseError(error)) {
    console.error(`Parse error in ${error.filePath}:${error.line}:${error.column}`);
    console.error(error.message);
  }
}
```

## 🎯 Use Cases

### Configuration Files

Perfect for application configuration with environment-specific overrides:

```tson
// config/base.tson
const DEFAULT_TIMEOUT = 5000;

{
  api: {
    timeout: DEFAULT_TIMEOUT,
    retries: 3
  },
  logging: {
    level: "info"
  }
}
```

```tson
// config/development.tson
import baseConfig from "./base.tson";

{
  ...baseConfig,
  logging: {
    ...baseConfig.logging,
    level: "debug" // Override for development
  },
  debug: true
}
```

### Build Configurations

Manage complex build setups with reusable components:

```tson
// webpack.config.tson
const IS_PRODUCTION = process.env.NODE_ENV === "production";

{
  mode: IS_PRODUCTION ? "production" : "development",
  devtool: IS_PRODUCTION ? false : "source-map",
  optimization: {
    minimize: IS_PRODUCTION,
    // More webpack config...
  }
}
```

### API Schemas

Define API configurations with documentation:

```tson
// api-schema.tson
const API_VERSION = "v1";

{
  // API endpoint definitions
  endpoints: {
    users: {
      path: `/api/${API_VERSION}/users`,
      methods: ["GET", "POST"],
      auth: true
    },
    posts: {
      path: `/api/${API_VERSION}/posts`,
      methods: ["GET", "POST", "PUT", "DELETE"],
      auth: true
    }
  }
}
```

## 🔧 Integration

### Webpack

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tson$/,
        use: [
          {
            loader: 'json-loader'
          },
          {
            loader: 'tson-loader' // Custom loader needed
          }
        ]
      }
    ]
  }
};
```

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.tson'],
  // Custom plugin for TSON processing
});
```

### Node.js Scripts

```javascript
// build-config.js
const { compileTSONFiles } = require('tson');

compileTSONFiles(['./config/*.tson'], {
  outputDir: './dist/config',
  minify: true
});
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/arizkami/tson.git
cd tson

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

## 📄 License

TSON is licensed under the [BSD-3-Clause License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the need for better configuration formats
- Built with TypeScript for type safety
- Designed for developer productivity

---

**Made with ❤️ by [Ariz Kamizuki](https://github.com/arizkami)**

If you find TSON useful, please consider giving it a ⭐ on [GitHub](https://github.com/arizkami/tson)!