/**
 * @fileoverview Configuration manager for Studylib
 * @module Config
 */

import { config } from 'dotenv';
import { AITool } from './StudylibContext';
import { StudylibError, ErrorCode } from './errors/StudylibError';

/**
 * Configuration manager class
 * Handles environment variables and application settings
 * Implements singleton pattern for global access
 */
export class Config {
    private static instance: Config;
    
    /**
     * Creates a new Config instance
     * Loads environment variables and validates configuration
     */
    private constructor() {
        config();
        this.validateEnvironment();
    }

    /**
     * Gets the singleton Config instance
     * @returns Config instance
     */
    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    /**
     * Validates environment variables and configuration
     * @throws {StudylibError} If required variables are missing or invalid
     */
    private validateEnvironment(): void {
        const requiredVars = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new StudylibError(
                `Missing required environment variables: ${missingVars.join(', ')}`,
                ErrorCode.CONFIG_ERROR
            );
        }

        const aiTool = process.env.DEFAULT_AI_TOOL as AITool;
        if (aiTool && !['openai', 'gemini'].includes(aiTool)) {
            throw new StudylibError(
                'DEFAULT_AI_TOOL must be either "openai" or "gemini"',
                ErrorCode.CONFIG_ERROR
            );
        }

        const itemsPerPage = parseInt(process.env.DEFAULT_ITEMS_PER_PAGE || '', 10);
        if (process.env.DEFAULT_ITEMS_PER_PAGE && (isNaN(itemsPerPage) || itemsPerPage < 1)) {
            throw new StudylibError(
                'DEFAULT_ITEMS_PER_PAGE must be a positive number',
                ErrorCode.CONFIG_ERROR
            );
        }
    }

    /**
     * Gets the OpenAI API key
     * @returns OpenAI API key
     * @throws {StudylibError} If API key is not set
     */
    get openAIKey(): string {
        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            throw new StudylibError(
                'OPENAI_API_KEY is not set in environment variables',
                ErrorCode.CONFIG_ERROR
            );
        }
        return key;
    }

    /**
     * Gets the Google Gemini API key
     * @returns Gemini API key
     * @throws {StudylibError} If API key is not set
     */
    get geminiKey(): string {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            throw new StudylibError(
                'GEMINI_API_KEY is not set in environment variables',
                ErrorCode.CONFIG_ERROR
            );
        }
        return key;
    }

    /**
     * Gets the default AI tool to use
     * @returns Default AI tool (openai or gemini)
     */
    get defaultAITool(): AITool {
        const tool = process.env.DEFAULT_AI_TOOL as AITool;
        return tool || 'openai';
    }

    /**
     * Gets the default number of items to show per page
     * @returns Default items per page
     */
    get defaultItemsPerPage(): number {
        const items = parseInt(process.env.DEFAULT_ITEMS_PER_PAGE || '', 10);
        return !isNaN(items) && items > 0 ? items : 20;
    }

    /**
     * Gets the OpenAI model to use
     * @returns OpenAI model name
     */
    get openAIModel(): string {
        return process.env.OPENAI_MODEL || 'gpt-4';
    }

    /**
     * Gets the Gemini model to use
     * @returns Gemini model name
     */
    get geminiModel(): string {
        return process.env.GEMINI_MODEL || 'gemini-pro';
    }

    /**
     * Gets whether debug mode is enabled
     * @returns Debug mode status
     */
    get debugMode(): boolean {
        return process.env.DEBUG === 'true';
    }
} 