/**
 * @fileoverview Custom error types for Studylib
 * @module StudylibError
 */

/**
 * Error codes for different types of errors in Studylib
 */
export enum ErrorCode {
    /** Configuration-related errors */
    CONFIG_ERROR = 'CONFIG_ERROR',
    /** API-related errors (OpenAI, Gemini) */
    API_ERROR = 'API_ERROR',
    /** Input validation errors */
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    /** Response parsing errors */
    PARSING_ERROR = 'PARSING_ERROR',
    /** Library not found errors */
    LIBRARY_NOT_FOUND = 'LIBRARY_NOT_FOUND',
    /** Documentation generation errors */
    DOCUMENTATION_ERROR = 'DOCUMENTATION_ERROR'
}

/**
 * Custom error class for Studylib
 * Provides structured error information with error codes and details
 */
export class StudylibError extends Error {
    /**
     * Creates a new StudylibError
     * @param message Error message
     * @param code Error code from ErrorCode enum
     * @param details Additional error details (optional)
     */
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'StudylibError';
    }
} 