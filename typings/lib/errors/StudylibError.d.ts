/**
 * @fileoverview Custom error types for Studylib
 * @module StudylibError
 */
/**
 * Error codes for different types of errors in Studylib
 */
export declare enum ErrorCode {
    /** Configuration-related errors */
    CONFIG_ERROR = "CONFIG_ERROR",
    /** API-related errors (OpenAI, Gemini) */
    API_ERROR = "API_ERROR",
    /** Input validation errors */
    VALIDATION_ERROR = "VALIDATION_ERROR",
    /** Response parsing errors */
    PARSING_ERROR = "PARSING_ERROR",
    /** Library not found errors */
    LIBRARY_NOT_FOUND = "LIBRARY_NOT_FOUND",
    /** Documentation generation errors */
    DOCUMENTATION_ERROR = "DOCUMENTATION_ERROR"
}
/**
 * Custom error class for Studylib
 * Provides structured error information with error codes and details
 */
export declare class StudylibError extends Error {
    readonly code: ErrorCode;
    readonly details?: unknown | undefined;
    /**
     * Creates a new StudylibError
     * @param message Error message
     * @param code Error code from ErrorCode enum
     * @param details Additional error details (optional)
     */
    constructor(message: string, code: ErrorCode, details?: unknown | undefined);
}
//# sourceMappingURL=StudylibError.d.ts.map