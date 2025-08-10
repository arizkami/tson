/**
 * Configuration options for TSON parsing
 */
export interface TSONParseOptions {
    /** Allow trailing commas in objects and arrays (default: true) */
    allowTrailingCommas?: boolean;
    /** Allow single-line comments starting with // (default: true) */
    allowComments?: boolean;
    /** Allow const declarations (default: true) */
    allowConst?: boolean;
    /** Allow import statements (default: true) */
    allowImports?: boolean;
    /** Allow TSON file imports for data combination (default: true) */
    allowTSONImports?: boolean;
    /** Throw errors instead of returning null on parse failure (default: false) */
    strict?: boolean;
    /** Base directory for resolving relative imports (default: process.cwd()) */
    baseDir?: string;
}
/**
 * Compilation options for TSON to JSON
 */
export interface TSONCompileOptions {
    /** Output directory for compiled JSON files */
    outputDir?: string;
    /** Whether to minify the output JSON (default: false) */
    minify?: boolean;
    /** Whether to preserve comments in a separate .meta.json file (default: false) */
    preserveComments?: boolean;
    /** File extension for output files (default: '.json') */
    outputExtension?: string;
}
/**
 * TSON Parse Error with additional context
 */
export declare class TSONParseError extends Error {
    filePath?: string | undefined;
    line?: number | undefined;
    column?: number | undefined;
    constructor(message: string, filePath?: string | undefined, line?: number | undefined, column?: number | undefined);
}
/**
 * Parse a TSON (TypeScript Object Notation) file
 * TSON is JSON with support for comments, trailing commas, const declarations, and imports
 *
 * @param filePath Path to the .tson file
 * @param options Parse options
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export declare function parseTSON(filePath: string, options?: TSONParseOptions): any;
/**
 * Parse a TSON string directly
 *
 * @param content TSON string content
 * @param options Parse options with optional filePath for error reporting
 * @returns Parsed object or null if parsing fails (in non-strict mode)
 */
export declare function parseTSONString(content: string, options?: TSONParseOptions & {
    filePath?: string;
}): any;
/**
 * Check if a file has valid TSON syntax without fully parsing it
 *
 * @param filePath Path to the .tson file
 * @returns true if valid, false otherwise
 */
export declare function validateTSON(filePath: string): boolean;
/**
 * Stringify an object to TSON format with optional comments
 *
 * @param obj Object to stringify
 * @param options Stringify options
 * @returns TSON string
 */
export declare function stringifyTSON(obj: any, options?: {
    indent?: number | string;
    addComments?: boolean;
    trailingCommas?: boolean;
    addImports?: boolean;
    addConsts?: boolean;
}): string;
/**
 * Compile a TSON file to JSON for production
 *
 * @param inputPath Path to the input TSON file
 * @param options Compilation options
 * @returns Path to the compiled JSON file
 */
export declare function compileTSONToJSON(inputPath: string, options?: TSONCompileOptions): string;
/**
 * Compile multiple TSON files to JSON
 *
 * @param inputPaths Array of input TSON file paths
 * @param options Compilation options
 * @returns Array of output JSON file paths
 */
export declare function compileTSONFiles(inputPaths: string[], options?: TSONCompileOptions): string[];
/**
 * Watch a TSON file and automatically compile to JSON on changes
 *
 * @param inputPath Path to the TSON file to watch
 * @param options Compilation options
 * @returns Function to stop watching
 */
export declare function watchTSONFile(inputPath: string, options?: TSONCompileOptions): () => void;
export declare function isTSONParseError(error: any): error is TSONParseError;
declare const _default: {
    parse: typeof parseTSON;
    parseString: typeof parseTSONString;
    stringify: typeof stringifyTSON;
    validate: typeof validateTSON;
    compile: typeof compileTSONToJSON;
    compileFiles: typeof compileTSONFiles;
    watch: typeof watchTSONFile;
    TSONParseError: typeof TSONParseError;
    isTSONParseError: typeof isTSONParseError;
};
export default _default;
//# sourceMappingURL=tson.d.ts.map