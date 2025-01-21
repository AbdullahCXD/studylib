/**
 * @fileoverview AI service for generating library documentation
 * @module AIService
 */
import { AIResponse, AITool } from '../lib/StudylibContext';
/**
 * Service class for generating documentation using AI models
 * Supports both OpenAI and Google Gemini
 */
export declare class AIService {
    private aiTool;
    private openai;
    private genAI;
    private config;
    private cache;
    /**
     * Creates a new AIService instance
     * @param aiTool AI tool to use (openai or gemini)
     */
    constructor(aiTool: AITool);
    /**
     * Initializes the appropriate AI client
     * @throws {StudylibError} If initialization fails
     */
    private initializeAI;
    /**
     * Generates documentation for a library
     * @param methodName Name of the library/method to document
     * @param exports Library exports to document
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If documentation generation fails
     */
    generateDocumentation(methodName: string, exports: any, packageInfo: any, itemsPerPage: number): Promise<AIResponse>;
    /**
     * Generates documentation using OpenAI
     * @param methodName Name of the library/method
     * @param exports Library exports
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If OpenAI request fails
     */
    private generateOpenAIResponse;
    /**
     * Generates documentation using Google Gemini
     * @param methodName Name of the library/method
     * @param exports Library exports
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If Gemini request fails
     */
    private generateGeminiResponse;
    /**
     * Validates an AI response
     * @param response Response to validate
     * @throws {StudylibError} If response is invalid
     */
    private validateResponse;
}
//# sourceMappingURL=AIService.d.ts.map