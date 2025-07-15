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
export declare class TSONParseError extends Error {
    filePath?: string | undefined;
    line?: number | undefined;
    column?: number | undefined;
    constructor(message: string, filePath?: string | undefined, line?: number | undefined, column?: number | undefined);
}
/**
 * Parse a TSON (TypeScript Object Notation) file
 * TSON is JSON with support for comments and trailing commas
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
}): string;
export declare function isTSONParseError(error: any): error is TSONParseError;
declare const _default: {
    parse: typeof parseTSON;
    parseString: typeof parseTSONString;
    stringify: typeof stringifyTSON;
    validate: typeof validateTSON;
    TSONParseError: typeof TSONParseError;
    isTSONParseError: typeof isTSONParseError;
};
export default _default;
//# sourceMappingURL=tson.d.ts.map