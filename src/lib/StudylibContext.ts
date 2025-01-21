/**
 * @fileoverview Main context for the Studylib library, handling library analysis and documentation generation
 * @module StudylibContext
 */

import { RequireLibraryContext } from "./RequireLibraryContext";
import { Logger } from "../Logger";
import cliui from "cliui";
import clc from "cli-color";
import { Listr, ListrContext } from "listr2";
import { Config } from "./Config";
import { AIService } from "../services/AIService";
import { StudylibError, ErrorCode } from "./errors/StudylibError";

/** Type of AI service to use for documentation generation */
export type AITool = "gemini" | "openai";

/** Configuration options for StudyLib */
export interface StudyLibOptions {
    /** AI tool to use for documentation generation */
    aiTool?: AITool;
    /** Number of items to show per page */
    itemsPerPage?: number;
    /** Current page number */
    page?: number;
}

/** Method metadata information */
export type MethodData = {
    /** Name of the method */
    name: string;
    /** Array of parameter descriptions */
    parameters: string[];
    /** Return type of the method */
    returnType: string;
    /** Whether the method is async */
    async: boolean;
}

/** Documentation for a library method */
export type LibraryDocumentation = {
    /** Method metadata */
    methodData: MethodData;
    /** Method documentation */
    documentation: string;
}

/** AI-generated documentation response */
export interface AIResponse {
    /** Array of documented methods */
    docs: LibraryDocumentation[];
}

/**
 * Main context class for Studylib
 * Handles library analysis, documentation generation, and display
 */
export class StudyLibContext {
    private libraryContext: RequireLibraryContext = new RequireLibraryContext();
    private ui = cliui({ width: process.stdout.columns });
    private aiTool: AITool;
    private itemsPerPage: number;
    private currentPage: number;
    private logger: Logger = Logger.getInstance();
    private config = Config.getInstance();
    private aiService: AIService;
    
    /** TypeScript and JavaScript type keywords for syntax highlighting */
    private typeKeywords = [
        // JavaScript primitive types
        'string', 'number', 'boolean', 'null', 'undefined', 'symbol', 'bigint',
        // JavaScript reference types
        'object', 'function', 'array',
        // TypeScript specific types
        'void', 'any', 'unknown', 'never', 'Promise', 'Array', 
        // TypeScript utility types
        'Partial', 'Required', 'Readonly', 'Record', 'Pick', 'Omit',
        'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ReturnType',
        'InstanceType', 'ThisType', 'Uppercase', 'Lowercase', 'Capitalize',
        'Uncapitalize'
    ];

    /**
     * Creates a new StudyLibContext instance
     * @param options Configuration options
     */
    constructor(options?: StudyLibOptions) {
        this.aiTool = options?.aiTool || this.config.defaultAITool;
        this.itemsPerPage = options?.itemsPerPage || this.config.defaultItemsPerPage;
        this.currentPage = options?.page || 1;
        this.aiService = new AIService(this.aiTool);
    }

    /**
     * Studies a library and generates documentation
     * @param methodName Name of the library/method to study
     * @returns Generated documentation
     * @throws {StudylibError} If documentation generation fails
     */
    async study(methodName: string): Promise<AIResponse> {
        try {
            if (!methodName) {
                throw new StudylibError(
                    'Method name is required',
                    ErrorCode.VALIDATION_ERROR
                );
            }

            const packageInfo = this.libraryContext.getPackageInfo(methodName);
            const exports = this.libraryContext.context(methodName);

            let aiResponse: AIResponse | undefined;

            const tasks = new Listr<ListrContext>([
                {
                    title: clc.cyan(`📚 Analyzing ${methodName}`),
                    task: async (ctx, task) => {
                        task.output = 'Initializing documentation study...';
                        
                        task.title = this.aiTool === 'openai'
                            ? clc.green('🤖 OpenAI') + ' - Generating documentation'
                            : clc.blue('🧠 Gemini') + ' - Generating documentation';
                        
                        ctx.aiResponse = await this.aiService.generateDocumentation(
                            methodName,
                            exports,
                            packageInfo,
                            this.itemsPerPage
                        );
                        
                        task.output = `Successfully analyzed ${ctx.aiResponse?.docs.length || 0} methods`;
                        aiResponse = ctx.aiResponse;
                    },
                    rendererOptions: { persistentOutput: true }
                },
                {
                    title: clc.yellow(`📄 Processing page ${this.currentPage}`),
                    task: async (ctx, task) => {
                        if (!ctx.aiResponse?.docs) {
                            throw new StudylibError(
                                'No documentation generated',
                                ErrorCode.DOCUMENTATION_ERROR
                            );
                        }

                        const totalPages = Math.ceil(ctx.aiResponse.docs.length / this.itemsPerPage);
                        task.output = `Page ${this.currentPage} of ${totalPages}`;

                        const startIdx = (this.currentPage - 1) * this.itemsPerPage;
                        const endIdx = startIdx + this.itemsPerPage;
                        const paginatedDocs = ctx.aiResponse.docs.slice(startIdx, endIdx);
                        
                        console.log('\n'); // Add spacing before documentation
                        await this.displayDocumentation(paginatedDocs);
                        
                        task.title = clc.green('✨ Documentation generated successfully');
                    },
                    rendererOptions: { persistentOutput: true }
                }
            ], {
                concurrent: false,
                rendererOptions: { 
                    showSubtasks: true,
                    collapseSubtasks: false,
                    clearOutput: false
                }
            });

            await tasks.run();

            if (!aiResponse?.docs) {
                throw new StudylibError(
                    'No documentation was generated',
                    ErrorCode.DOCUMENTATION_ERROR
                );
            }

            const startIdx = (this.currentPage - 1) * this.itemsPerPage;
            const endIdx = startIdx + this.itemsPerPage;
            return { docs: aiResponse.docs.slice(startIdx, endIdx) };
        } catch (error) {
            if (error instanceof StudylibError) {
                throw error;
            }
            throw new StudylibError(
                'An unexpected error occurred',
                ErrorCode.DOCUMENTATION_ERROR,
                error
            );
        }
    }

    /**
     * Displays the generated documentation with syntax highlighting
     * @param docs Array of library documentation to display
     */
    private async displayDocumentation(docs: LibraryDocumentation[]): Promise<void> {
        docs.forEach((doc, index) => {
            const { methodData, documentation } = doc;
            
            // Build method signature with colors
            let signature = `${methodData.async ? clc.magenta('async') + ' ' : ''}${clc.yellow(methodData.name)}(`;
            
            // Format parameters
            const coloredParams = methodData.parameters.map(param => {
                return this.typeKeywords.reduce((acc, keyword) => {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                    return acc.replace(regex, clc.cyan(keyword));
                }, param);
            });
            
            signature += coloredParams.join(', ') + ')';
            
            // Add return type
            const coloredReturnType = this.typeKeywords.reduce((acc, keyword) => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                return acc.replace(regex, clc.cyan(keyword));
            }, methodData.returnType);
            
            signature += `: ${coloredReturnType}`;

            // Format documentation
            const cleanDocumentation = documentation.replace(/`([^`]+)`/g, (_, word) => clc.cyan(word));

            // Build the output
            this.ui.div({
                text: `${clc.white(`${index + 1}. `)}${signature}`,
                padding: [1, 1, 0, 2]
            });
            
            this.ui.div({
                text: cleanDocumentation,
                padding: [0, 1, 1, 4]
            });
            
            // Add separator between methods
            if (index < docs.length - 1) {
                this.ui.div({
                    text: clc.blackBright('─'.repeat(process.stdout.columns - 4)),
                    padding: [0, 1, 0, 2]
                });
            }
        });

        console.log(this.ui.toString());
        this.ui.resetOutput();
    }
}