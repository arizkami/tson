import fs from "fs";
import path from "path";
/**
 * TSON Parse Error with additional context
 */
export class TSONParseError extends Error {
    filePath;
    line;
    column;
    constructor(message, filePath, line, column) {
        super(message);
        this.filePath = filePath;
        this.line = line;
        this.column = column;
        this.name = 'TSONParseError';
    }
}
/**
 * Helper function to safely get error message from unknown error
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/**
 * Parse a TSON (TypeScript Object Notation) file
 * TSON is JSON with support for comments, trailing commas, const declarations, and imports
 *
 * @param filePath Path to the .tson file
 * @param options Parse options
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export function parseTSON(filePath, options = {}) {
    const { allowTrailingCommas = true, allowComments = true, allowConst = true, allowImports = true, allowTSONImports = true, strict = false, baseDir = process.cwd() } = options;
    // Validate file exists
    if (!fs.existsSync(filePath)) {
        const error = new TSONParseError(`File not found: ${filePath}`, filePath);
        if (strict)
            throw error;
        console.error(`${error.message}`);
        return null;
    }
    let raw;
    try {
        raw = fs.readFileSync(filePath, "utf-8");
    }
    catch (err) {
        const error = new TSONParseError(`Failed to read file: ${getErrorMessage(err)}`, filePath);
        if (strict)
            throw error;
        console.error(`${error.message}`);
        return null;
    }
    return parseTSONString(raw, { ...options, filePath, baseDir: path.dirname(filePath) });
}
/**
 * Parse a TSON string directly
 *
 * @param content TSON string content
 * @param options Parse options with optional filePath for error reporting
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export function parseTSONString(content, options = {}) {
    const { allowTrailingCommas = true, allowComments = true, allowConst = true, allowImports = true, allowTSONImports = true, strict = false, filePath, baseDir = process.cwd() } = options;
    let cleaned = content;
    // Process TSON imports first (before removing regular imports)
    if (allowTSONImports) {
        cleaned = processTSONImports(cleaned, { baseDir, filePath, strict });
    }
    // Remove import statements if enabled
    if (allowImports) {
        cleaned = removeImports(cleaned);
    }
    // Remove comments if enabled
    if (allowComments) {
        cleaned = removeComments(cleaned);
    }
    // Process const declarations if enabled
    if (allowConst) {
        cleaned = processConstDeclarations(cleaned);
    }
    // Add quotes to unquoted object keys
    cleaned = cleaned.replace(/(\w+)\s*:/g, '"$1":');
    // Remove trailing commas if enabled
    if (allowTrailingCommas) {
        cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    }
    try {
        return JSON.parse(cleaned);
    }
    catch (err) {
        const errorMessage = `TSON parse error${filePath ? ` in ${filePath}` : ''}: ${getErrorMessage(err)}`;
        const error = new TSONParseError(errorMessage, filePath);
        if (strict)
            throw error;
        console.error(`${errorMessage}`);
        return null;
    }
}
/**
 * Process TSON imports and merge data
 */
function processTSONImports(text, options) {
    const { baseDir, filePath, strict } = options;
    const lines = text.split('\n');
    const result = [];
    const importedData = {};
    for (const line of lines) {
        const trimmed = line.trim();
        // Match TSON import statements: import tsonData from "./file.tson";
        const tsonImportMatch = trimmed.match(/^import\s+(\w+)\s+from\s+["']([^"']+\.tson)["'];?$/);
        if (tsonImportMatch) {
            const [, varName, importPath] = tsonImportMatch;
            try {
                // Resolve the import path
                const resolvedPath = path.isAbsolute(importPath)
                    ? importPath
                    : path.resolve(baseDir, importPath);
                // Ensure the file exists before trying to parse
                if (!fs.existsSync(resolvedPath)) {
                    const error = new TSONParseError(`TSON import file not found: "${importPath}" (resolved to: ${resolvedPath})`, filePath);
                    if (strict)
                        throw error;
                    console.error(error.message);
                    result.push(''); // Keep line structure
                    continue;
                }
                // Parse the imported TSON file
                const importedContent = parseTSON(resolvedPath, {
                    allowTrailingCommas: true,
                    allowComments: true,
                    allowConst: true,
                    allowImports: true,
                    allowTSONImports: true,
                    strict,
                    baseDir: path.dirname(resolvedPath)
                });
                if (importedContent !== null) {
                    if (varName) {
                        importedData[varName] = importedContent;
                    }
                }
            }
            catch (err) {
                const error = new TSONParseError(`Failed to import TSON file "${importPath}": ${getErrorMessage(err)}`, filePath);
                if (strict)
                    throw error;
                console.error(error.message);
            }
            result.push(''); // Keep line structure
        }
        else {
            // Replace TSON import references with their values
            let processedLine = line;
            for (const [varName, data] of Object.entries(importedData)) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                processedLine = processedLine.replace(regex, JSON.stringify(data));
            }
            result.push(processedLine);
        }
    }
    return result.join('\n');
}
/**
 * Remove import statements while preserving line structure
 */
function removeImports(text) {
    const lines = text.split('\n');
    const result = [];
    for (const line of lines) {
        // Remove import statements (both single and multi-line)
        if (line.trim().startsWith('import ')) {
            result.push(''); // Keep line structure
        }
        else {
            result.push(line);
        }
    }
    return result.join('\n');
}
/**
 * Process const declarations and convert them to object properties
 */
function processConstDeclarations(text) {
    const lines = text.split('\n');
    const result = [];
    const constants = {};
    for (const line of lines) {
        const trimmed = line.trim();
        // Match const declarations: const NAME = VALUE;
        const constMatch = trimmed.match(/^const\s+(\w+)\s*=\s*(.+);?$/);
        if (constMatch) {
            const [, name, value] = constMatch;
            try {
                // Try to parse the value as JSON
                const parsedValue = JSON.parse((value || '').replace(/'/g, '"'));
                if (name)
                    constants[name] = parsedValue;
            }
            catch {
                // If parsing fails, treat as string
                if (name && value)
                    constants[name] = value.replace(/['";]/g, '');
            }
            result.push(''); // Keep line structure
        }
        else {
            // Replace const references with their values
            let processedLine = line;
            for (const [name, value] of Object.entries(constants)) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                processedLine = processedLine.replace(regex, JSON.stringify(value));
            }
            result.push(processedLine);
        }
    }
    return result.join('\n');
}
/**
 * Remove single-line comments (// ...) while preserving strings
 * Handles escaped quotes properly
 */
function removeComments(text) {
    const lines = text.split('\n');
    const result = [];
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        if (!line) {
            result.push('');
            continue;
        }
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
            }
            else if (inString && char === stringChar) {
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
            }
            else if (!inString && char === '/' && nextChar === '/') {
                // Found comment outside string, ignore rest of line
                break;
            }
            else {
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
export function validateTSON(filePath) {
    try {
        parseTSON(filePath, { strict: true });
        return true;
    }
    catch {
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
export function stringifyTSON(obj, options = {}) {
    const { indent = 2, addComments = false, trailingCommas = true, addImports = false, addConsts = false } = options;
    let result = JSON.stringify(obj, null, indent);
    // Remove quotes from simple object keys
    result = result.replace(/"(\w+)":/g, '$1:');
    // Add trailing commas if requested
    if (trailingCommas) {
        result = result.replace(/([}\]])/g, ',$1');
        result = result.replace(/,([}\]])/g, '$1'); // Remove double commas
        result = result.replace(/([^,\s])(\s*[}\]])/g, '$1,$2'); // Add trailing commas
    }
    // Add imports if requested
    if (addImports) {
        result = 'import { readFileSync } from "fs";\nimport path from "path";\n\n' + result;
    }
    // Add const declarations if requested
    if (addConsts) {
        result = 'const API_VERSION = "v1";\nconst DEFAULT_TIMEOUT = 5000;\n\n' + result;
    }
    // Add header comment if requested
    if (addComments) {
        result = '// Generated TSON file\n' + result;
    }
    return result;
}
/**
 * Compile a TSON file to JSON for production
 *
 * @param inputPath Path to the input TSON file
 * @param options Compilation options
 * @returns Path to the compiled JSON file
 */
export function compileTSONToJSON(inputPath, options = {}) {
    const { outputDir = path.dirname(inputPath), minify = false, preserveComments = false, outputExtension = '.json' } = options;
    // Parse the TSON file
    const parsedData = parseTSON(inputPath, { strict: true });
    if (parsedData === null) {
        throw new TSONParseError(`Failed to parse TSON file: ${inputPath}`);
    }
    // Generate output path
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, inputName + outputExtension);
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // Stringify the data
    const jsonContent = minify
        ? JSON.stringify(parsedData)
        : JSON.stringify(parsedData, null, 2);
    // Write the JSON file
    fs.writeFileSync(outputPath, jsonContent, 'utf-8');
    // Preserve comments in a separate meta file if requested
    if (preserveComments) {
        const metaPath = path.join(outputDir, inputName + '.meta.json');
        const originalContent = fs.readFileSync(inputPath, 'utf-8');
        const comments = extractComments(originalContent);
        if (comments.length > 0) {
            const metaData = {
                sourceFile: inputPath,
                compiledAt: new Date().toISOString(),
                comments
            };
            fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), 'utf-8');
        }
    }
    return outputPath;
}
/**
 * Compile multiple TSON files to JSON
 *
 * @param inputPaths Array of input TSON file paths
 * @param options Compilation options
 * @returns Array of output JSON file paths
 */
export function compileTSONFiles(inputPaths, options = {}) {
    return inputPaths.map(inputPath => compileTSONToJSON(inputPath, options));
}
/**
 * Extract comments from TSON content for preservation
 */
function extractComments(content) {
    const lines = content.split('\n');
    const comments = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const commentMatch = line?.match(/\/\/\s*(.*)$/);
        if (commentMatch) {
            comments.push({
                line: i + 1,
                text: commentMatch[1]?.trim() ?? ''
            });
        }
    }
    return comments;
}
/**
 * Watch a TSON file and automatically compile to JSON on changes
 *
 * @param inputPath Path to the TSON file to watch
 * @param options Compilation options
 * @returns Function to stop watching
 */
export function watchTSONFile(inputPath, options = {}) {
    let isCompiling = false;
    const compile = () => {
        if (isCompiling)
            return;
        isCompiling = true;
        try {
            const outputPath = compileTSONToJSON(inputPath, options);
            console.log(`Compiled ${inputPath} -> ${outputPath}`);
        }
        catch (err) {
            console.error(`Failed to compile ${inputPath}:`, getErrorMessage(err));
        }
        finally {
            isCompiling = false;
        }
    };
    // Initial compilation
    compile();
    // Watch for changes
    const watcher = fs.watchFile(inputPath, { interval: 1000 }, compile);
    return () => {
        fs.unwatchFile(inputPath, compile);
    };
}
// Type guard for checking if an error is a TSONParseError
export function isTSONParseError(error) {
    return error instanceof TSONParseError;
}
// Default export for convenience
export default {
    parse: parseTSON,
    parseString: parseTSONString,
    stringify: stringifyTSON,
    validate: validateTSON,
    compile: compileTSONToJSON,
    compileFiles: compileTSONFiles,
    watch: watchTSONFile,
    TSONParseError,
    isTSONParseError
};
//# sourceMappingURL=tson.js.map