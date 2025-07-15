import { parseTSON, validateTSON, stringifyTSON, TSONParseError } from './tson.js';
import fs from 'fs';
import path from 'path';

interface CLIOptions {
  file: string;
  strict: boolean;
  validate: boolean;
  output?: string;
  format: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    file: '',
    strict: false,
    validate: false,
    format: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--strict':
        options.strict = true;
        break;
      case '--validate':
        options.validate = true;
        break;
      case '--format':
        options.format = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (!arg.startsWith('--') && !options.file) {
          options.file = arg;
        }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
TSON Parser CLI Tool

Usage: tson-cli <file.tson> [options]

Options:
  --strict        Throw errors instead of returning null
  --validate      Only validate the file, don't parse
  --format        Format and prettify the output
  --output, -o    Output to file instead of console
  --help, -h      Show this help message

Examples:
  tson-cli config.tson
  tson-cli config.tson --strict
  tson-cli config.tson --validate
  tson-cli config.tson --format -o formatted.json
  `);
}

function formatOutput(result: any, format: boolean): string {
  if (format) {
    return JSON.stringify(result, null, 2);
  }
  return JSON.stringify(result);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("please input .tson file");
    showHelp();
    process.exit(1);
  }

  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.file) {
    console.error("No input file specified");
    showHelp();
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(options.file)) {
    console.error(`File not found: ${options.file}`);
    process.exit(1);
  }

  // Validate file extension
  if (!options.file.endsWith('.tson')) {
    console.warn("Warning: File doesn't have .tson extension");
  }

  try {
    if (options.validate) {
      // Validation mode
      const isValid = validateTSON(options.file);
      if (isValid) {
        console.log("TSON file is valid");
        process.exit(0);
      } else {
        console.error("TSON file is invalid");
        process.exit(1);
      }
    } else {
      // Parse mode
      const result = parseTSON(options.file, { strict: options.strict });
      
      if (result === null) {
        process.exit(1);
      }

      const output = formatOutput(result, options.format);
      
      if (options.output) {
        // Write to file
        fs.writeFileSync(options.output, output, 'utf-8');
        console.log(`Output written to: ${options.output}`);
      } else {
        // Print to console
        console.log("Parsed result:");
        if (options.format) {
          console.log(output);
        } else {
          console.dir(result, { depth: null, colors: true });
        }
      }
    }
  } catch (error) {
    if (error instanceof TSONParseError) {
      console.error(`${error.message}`);
      if (error.line) {
        console.error(`   at line ${error.line}${error.column ? `, column ${error.column}` : ''}`);
      }
    } else {
      console.error("Unexpected error:", error.message);
    }
    process.exit(1);
  }
}

// Run CLI
main();