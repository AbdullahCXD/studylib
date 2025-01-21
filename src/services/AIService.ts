/**
 * @fileoverview AI service for generating library documentation
 * @module AIService
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponse, AITool } from '../lib/StudylibContext';
import { Config } from '../lib/Config';
import { StudylibError, ErrorCode } from '../lib/errors/StudylibError';
import { AIResponseCache } from './AIResponseCache';

/**
 * Service class for generating documentation using AI models
 * Supports both OpenAI and Google Gemini
 */
export class AIService {
    private openai: OpenAI | null = null;
    private genAI: GoogleGenerativeAI | null = null;
    private config = Config.getInstance();
    private cache = AIResponseCache.getInstance();

    /**
     * Creates a new AIService instance
     * @param aiTool AI tool to use (openai or gemini)
     */
    constructor(private aiTool: AITool) {}

    /**
     * Initializes the appropriate AI client
     * @throws {StudylibError} If initialization fails
     */
    private initializeAI() {
        try {
            if (this.aiTool === 'openai' && !this.openai) {
                this.openai = new OpenAI({ apiKey: this.config.openAIKey });
            } else if (this.aiTool === 'gemini' && !this.genAI) {
                this.genAI = new GoogleGenerativeAI(this.config.geminiKey);
            }
        } catch (error) {
            throw new StudylibError(
                `Failed to initialize ${this.aiTool} client`,
                ErrorCode.API_ERROR,
                error
            );
        }
    }

    /**
     * Generates documentation for a library
     * @param methodName Name of the library/method to document
     * @param exports Library exports to document
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If documentation generation fails
     */
    async generateDocumentation(
        methodName: string,
        exports: any,
        packageInfo: any,
        itemsPerPage: number
    ): Promise<AIResponse> {
        try {
            this.initializeAI();

            // Validate inputs
            if (!exports || typeof exports !== 'object') {
                throw new StudylibError(
                    'Invalid exports data',
                    ErrorCode.VALIDATION_ERROR,
                    { exports }
                );
            }

            if (!packageInfo || typeof packageInfo !== 'object') {
                throw new StudylibError(
                    'Invalid package info',
                    ErrorCode.VALIDATION_ERROR,
                    { packageInfo }
                );
            }

            // Check cache first
            const cachedResponse = await this.cache.get(
                methodName,
                packageInfo.version,
                this.aiTool,
                itemsPerPage
            );

            if (cachedResponse) {
                return cachedResponse;
            }

            // Generate new response
            const response = this.aiTool === 'openai'
                ? await this.generateOpenAIResponse(methodName, exports, packageInfo, itemsPerPage)
                : await this.generateGeminiResponse(methodName, exports, packageInfo, itemsPerPage);

            // Cache the response
            await this.cache.set(
                methodName,
                packageInfo.version,
                this.aiTool,
                itemsPerPage,
                response
            );

            return response;
        } catch (error) {
            if (error instanceof StudylibError) {
                throw error;
            }
            throw new StudylibError(
                `Failed to generate documentation using ${this.aiTool}`,
                ErrorCode.API_ERROR,
                error
            );
        }
    }

    /**
     * Generates documentation using OpenAI
     * @param methodName Name of the library/method
     * @param exports Library exports
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If OpenAI request fails
     */
    private async generateOpenAIResponse(
        methodName: string,
        exports: any,
        packageInfo: any,
        itemsPerPage: number
    ): Promise<AIResponse> {
        if (!this.openai) {
            throw new StudylibError('OpenAI client not initialized', ErrorCode.API_ERROR);
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: this.config.openAIModel,
                messages: [
                    {
                        role: "system",
                        content: `You are a documentation expert. Generate concise and accurate method documentation in JSON format. Focus on clarity and technical accuracy. Limit to ${itemsPerPage} items per response. Do not include any Markdown formatting.`
                    },
                    {
                        role: "user",
                        content: `Generate documentation following this exact JSON structure: { "docs": [{ "methodData": { "name": string, "parameters": string[], "returnType": string, "async": boolean }, "documentation": string }] }

Library: ${methodName}
Version: ${packageInfo.version}
Exports: ${JSON.stringify(exports)}
Package Info: ${JSON.stringify(packageInfo)}`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            });

            const aiResponse = JSON.parse(response.choices[0].message.content || "{}") as AIResponse;
            this.validateResponse(aiResponse);
            return aiResponse;
        } catch (error) {
            throw new StudylibError(
                'Failed to generate OpenAI response',
                ErrorCode.API_ERROR,
                error
            );
        }
    }

    /**
     * Generates documentation using Google Gemini
     * @param methodName Name of the library/method
     * @param exports Library exports
     * @param packageInfo Package information
     * @param itemsPerPage Number of items per page
     * @returns Generated documentation
     * @throws {StudylibError} If Gemini request fails
     */
    private async generateGeminiResponse(
        methodName: string,
        exports: any,
        packageInfo: any,
        itemsPerPage: number
    ): Promise<AIResponse> {
        if (!this.genAI) {
            throw new StudylibError('Gemini client not initialized', ErrorCode.API_ERROR);
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: this.config.geminiModel });
            const prompt = `You are a documentation expert. Generate documentation following this exact JSON structure, with no additional text or formatting:

{
    "docs": [
        {
            "methodData": {
                "name": string,
                "parameters": string[],
                "returnType": string,
                "async": boolean
            },
            "documentation": string
        }
    ]
}

Limit the response to ${itemsPerPage} items.
Do not include any Markdown or code blocks.
Ensure the response is valid JSON.

Library: ${methodName}
Version: ${packageInfo.version}
Exports: ${JSON.stringify(exports)}
Package Info: ${JSON.stringify(packageInfo)}`;
            
            const result = await model.generateContent(prompt);
            const response = result.response;
            const cleanResponse = response.text().replace(/```json|```/g, "").trim();
            
            try {
                const aiResponse = JSON.parse(cleanResponse) as AIResponse;
                this.validateResponse(aiResponse);
                return aiResponse;
            } catch (error) {
                throw new StudylibError(
                    'Failed to parse Gemini response',
                    ErrorCode.PARSING_ERROR,
                    { response: cleanResponse, error }
                );
            }
        } catch (error) {
            throw new StudylibError(
                'Failed to generate Gemini response',
                ErrorCode.API_ERROR,
                error
            );
        }
    }

    /**
     * Validates an AI response
     * @param response Response to validate
     * @throws {StudylibError} If response is invalid
     */
    private validateResponse(response: AIResponse): void {
        if (!response || typeof response !== 'object') {
            throw new StudylibError(
                'Invalid AI response format',
                ErrorCode.VALIDATION_ERROR,
                { response }
            );
        }

        if (!Array.isArray(response.docs)) {
            throw new StudylibError(
                'Invalid docs array in AI response',
                ErrorCode.VALIDATION_ERROR,
                { docs: response.docs }
            );
        }

        if (response.docs.length === 0) {
            throw new StudylibError(
                'Empty documentation received',
                ErrorCode.DOCUMENTATION_ERROR
            );
        }

        response.docs.forEach((doc, index) => {
            if (!doc.methodData || typeof doc.methodData !== 'object') {
                throw new StudylibError(
                    'Invalid method data in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, doc }
                );
            }

            const { name, parameters, returnType, async } = doc.methodData;
            
            if (typeof name !== 'string' || name.trim() === '') {
                throw new StudylibError(
                    'Invalid method name in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, name }
                );
            }

            if (!Array.isArray(parameters)) {
                throw new StudylibError(
                    'Invalid parameters in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, parameters }
                );
            }

            if (typeof returnType !== 'string') {
                throw new StudylibError(
                    'Invalid return type in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, returnType }
                );
            }

            if (typeof async !== 'boolean') {
                throw new StudylibError(
                    'Invalid async flag in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, async }
                );
            }

            if (typeof doc.documentation !== 'string' || doc.documentation.trim() === '') {
                throw new StudylibError(
                    'Invalid documentation in AI response',
                    ErrorCode.VALIDATION_ERROR,
                    { index, documentation: doc.documentation }
                );
            }
        });
    }
} 