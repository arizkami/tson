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
  allowConst: boolean;
  allowImports: boolean;
  disableComments: boolean;
  disableTrailingCommas: boolean;
}

/**
 * Helper function to safely get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    file: '',
    strict: false,
    validate: false,
    format: false,
    help: false,
    allowConst: true,
    allowImports: true,
    disableComments: false,
    disableTrailingCommas: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg) continue; // Skip undefined args
    
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
      case '--no-const':
        options.allowConst = false;
        break;
      case '--no-imports':
        options.allowImports = false;
        break;
      case '--no-comments':
        options.disableComments = true;
        break;
      case '--no-trailing-commas':
        options.disableTrailingCommas = true;
        break;
      case '--output':
      case '-o':
        const nextArg = args[++i];
        if (nextArg) {
          options.output = nextArg;
        }
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
  --strict              Throw errors instead of returning null
  --validate            Only validate the file, don't parse
  --format              Format and prettify the output
  --output, -o          Output to file instead of console
  --no-const            Disable const declaration support
  --no-imports          Disable import statement support
  --no-comments         Disable comment support
  --no-trailing-commas  Disable trailing comma support
  --help, -h            Show this help message

Examples:
  tson-cli config.tson
  tson-cli config.tson --strict
  tson-cli config.tson --validate
  tson-cli config.tson --format -o formatted.json
  tson-cli config.tson --no-const --no-imports
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
    const parseOptions = {
      strict: options.strict,
      allowConst: options.allowConst,
      allowImports: options.allowImports,
      allowComments: !options.disableComments,
      allowTrailingCommas: !options.disableTrailingCommas
    };

    if (options.validate) {
      // Validation mode - use strict parsing for validation
      const isValid = validateTSON(options.file);
      if (isValid) {
        console.log("TSON file is valid");
        if (options.allowConst || options.allowImports) {
          console.log("✓ Supports const declarations and imports");
        }
        process.exit(0);
      } else {
        console.error("TSON file is invalid");
        process.exit(1);
      }
    } else {
      // Parse mode
      const result = parseTSON(options.file, parseOptions);
      
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

      // Show feature usage summary
      if (!options.validate) {
        const features = [];
        if (options.allowConst) features.push("const declarations");
        if (options.allowImports) features.push("import statements");
        if (!options.disableComments) features.push("comments");
        if (!options.disableTrailingCommas) features.push("trailing commas");
        
        if (features.length > 0) {
          console.log(`\n✓ Parsed with support for: ${features.join(", ")}`);
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
      console.error("Unexpected error:", getErrorMessage(error));
    }
    process.exit(1);
  }
}

// Run CLI
main();