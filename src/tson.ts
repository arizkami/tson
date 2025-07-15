import fs from "fs";
// import path from "path";

/**
 * Configuration options for TSON parsing
 */
export interface TSONParseOptions {
  /** Allow trailing commas in objects and arrays (default: true) */
  allowTrailingCommas?: boolean;
  /** Allow single-line comments starting with // (default: true) */
  allowComments?: boolean;
  /** Throw errors instead of returning null on parse failure (default: false) */
  strict?: boolean;
}

/**
 * TSON Parse Error with additional context
 */
export class TSONParseError extends Error {
  constructor(
    message: string,
    public filePath?: string,
    public line?: number,
    public column?: number
  ) {
    super(message);
    this.name = 'TSONParseError';
  }
}

/**
 * Parse a TSON (TypeScript Object Notation) file
 * TSON is JSON with support for comments and trailing commas
 * 
 * @param filePath Path to the .tson file
 * @param options Parse options
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export function parseTSON(filePath: string, options: TSONParseOptions = {}): any {
  const { allowTrailingCommas = true, allowComments = true, strict = false } = options;

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    const error = new TSONParseError(`File not found: ${filePath}`, filePath);
    if (strict) throw error;
    console.error(`${error.message}`);
    return null;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const error = new TSONParseError(`Failed to read file: ${err.message}`, filePath);
    if (strict) throw error;
    console.error(`${error.message}`);
    return null;
  }

  return parseTSONString(raw, { ...options, filePath });
}

/**
 * Parse a TSON string directly
 * 
 * @param content TSON string content
 * @param options Parse options with optional filePath for error reporting
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export function parseTSONString(
  content: string, 
  options: TSONParseOptions & { filePath?: string } = {}
): any {
  const { allowTrailingCommas = true, allowComments = true, strict = false, filePath } = options;

  let cleaned = content;

  // Remove comments if enabled
  if (allowComments) {
    cleaned = removeComments(cleaned);
  }

  // Add quotes to unquoted object keys
  cleaned = cleaned.replace(/(\w+)\s*:/g, '"$1":');
  
  // Remove trailing commas if enabled
  if (allowTrailingCommas) {
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const errorMessage = `TSON parse error${filePath ? ` in ${filePath}` : ''}: ${err.message}`;
    const error = new TSONParseError(errorMessage, filePath);
    
    if (strict) throw error;
    console.error(`${errorMessage}`);
    return null;
  }
}

/**
 * Remove single-line comments (// ...) while preserving strings
 * Handles escaped quotes properly
 */
function removeComments(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let inString = false;
    let stringChar = '';
    let newLine = '';
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (!inString && (char === '"' || char === "'")) {
        // Start of string
        inString = true;
        stringChar = char;
        newLine += char;
      } else if (inString && char === stringChar) {
        // Check if it's escaped
        let escapeCount = 0;
        let j = i - 1;
        while (j >= 0 && line[j] === '\\') {
          escapeCount++;
          j--;
        }
        
        if (escapeCount % 2 === 0) {
          // Not escaped, end of string
          inString = false;
          stringChar = '';
        }
        newLine += char;
      } else if (!inString && char === '/' && nextChar === '/') {
        // Found comment outside string, ignore rest of line
        break;
      } else {
        newLine += char;
      }
      
      i++;
    }
    
    result.push(newLine.trimEnd()); // Remove trailing whitespace
  }
  
  return result.join('\n');
}

/**
 * Check if a file has valid TSON syntax without fully parsing it
 * 
 * @param filePath Path to the .tson file
 * @returns true if valid, false otherwise
 */
export function validateTSON(filePath: string): boolean {
  try {
    parseTSON(filePath, { strict: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Stringify an object to TSON format with optional comments
 * 
 * @param obj Object to stringify
 * @param options Stringify options
 * @returns TSON string
 */
export function stringifyTSON(
  obj: any, 
  options: { 
    indent?: number | string;
    addComments?: boolean;
    trailingCommas?: boolean;
  } = {}
): string {
  const { indent = 2, addComments = false, trailingCommas = true } = options;
  
  let result = JSON.stringify(obj, null, indent);
  
  // Remove quotes from simple object keys
  result = result.replace(/"(\w+)":/g, '$1:');
  
  // Add trailing commas if requested
  if (trailingCommas) {
    result = result.replace(/([}\]])/g, ',$1');
    result = result.replace(/,([}\]])/g, '$1'); // Remove double commas
    result = result.replace(/([^,\s])(\s*[}\]])/g, '$1,$2'); // Add trailing commas
  }
  
  // Add header comment if requested
  if (addComments) {
    result = '// Generated TSON file\n' + result;
  }
  
  return result;
}

// Type guard for checking if an error is a TSONParseError
export function isTSONParseError(error: any): error is TSONParseError {
  return error instanceof TSONParseError;
}

// Default export for convenience
export default {
  parse: parseTSON,
  parseString: parseTSONString,
  stringify: stringifyTSON,
  validate: validateTSON,
  TSONParseError,
  isTSONParseError
};