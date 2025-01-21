/**
 * @fileoverview Logger utility for consistent logging across the application
 * @module Logger
 */
/** Available log levels */
type LogLevel = 'info' | 'debug' | 'warn' | 'error';
/** Logger configuration options */
interface LoggerSettings {
    /** Enable debug logging */
    debug?: boolean;
    /** Show timestamps in logs */
    timestamps?: boolean;
    /** Enable colored output */
    colors?: boolean;
    /** Minimum log level to display */
    logLevel?: LogLevel;
}
/**
 * Logger class providing consistent logging functionality
 * Implements singleton pattern for global access
 */
export declare class Logger {
    #private;
    private static instance;
    /**
     * Creates a new Logger instance
     * @param settings Logger configuration options
     */
    constructor(settings?: LoggerSettings);
    /**
     * Gets the singleton Logger instance
     * @param settings Optional settings to configure the logger
     * @returns Logger instance
     */
    static getInstance(settings?: LoggerSettings): Logger;
    /**
     * Logs an informational message
     * @param message Message to log
     */
    info: (message: string) => void;
    /**
     * Logs a success message
     * @param message Message to log
     */
    success: (message: string) => void;
    /**
     * Logs a warning message
     * @param message Message to log
     */
    warning: (message: string, error?: Error) => void;
    /**
     * Logs an error message
     * @param message Message to log
     */
    error: (message: string, error?: Error) => void;
    /**
     * Logs a debug message
     * Only shown if debug mode is enabled
     * @param message Message to log
     */
    debug: (message: string, error?: Error) => void;
}
export {};
//# sourceMappingURL=Logger.d.ts.map