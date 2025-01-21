/**
 * @fileoverview Configuration manager for Studylib
 * @module Config
 */
import { AITool } from './StudylibContext';
/**
 * Configuration manager class
 * Handles environment variables and application settings
 * Implements singleton pattern for global access
 */
export declare class Config {
    private static instance;
    /**
     * Creates a new Config instance
     * Loads environment variables and validates configuration
     */
    private constructor();
    /**
     * Gets the singleton Config instance
     * @returns Config instance
     */
    static getInstance(): Config;
    /**
     * Validates environment variables and configuration
     * @throws {StudylibError} If required variables are missing or invalid
     */
    private validateEnvironment;
    /**
     * Gets the OpenAI API key
     * @returns OpenAI API key
     * @throws {StudylibError} If API key is not set
     */
    get openAIKey(): string;
    /**
     * Gets the Google Gemini API key
     * @returns Gemini API key
     * @throws {StudylibError} If API key is not set
     */
    get geminiKey(): string;
    /**
     * Gets the default AI tool to use
     * @returns Default AI tool (openai or gemini)
     */
    get defaultAITool(): AITool;
    /**
     * Gets the default number of items to show per page
     * @returns Default items per page
     */
    get defaultItemsPerPage(): number;
    /**
     * Gets the OpenAI model to use
     * @returns OpenAI model name
     */
    get openAIModel(): string;
    /**
     * Gets the Gemini model to use
     * @returns Gemini model name
     */
    get geminiModel(): string;
    /**
     * Gets whether debug mode is enabled
     * @returns Debug mode status
     */
    get debugMode(): boolean;
}
//# sourceMappingURL=Config.d.ts.map