/**
 * @fileoverview Main context for the Studylib library, handling library analysis and documentation generation
 * @module StudylibContext
 */
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
};
/** Documentation for a library method */
export type LibraryDocumentation = {
    /** Method metadata */
    methodData: MethodData;
    /** Method documentation */
    documentation: string;
};
/** AI-generated documentation response */
export interface AIResponse {
    /** Array of documented methods */
    docs: LibraryDocumentation[];
}
/**
 * Main context class for Studylib
 * Handles library analysis, documentation generation, and display
 */
export declare class StudyLibContext {
    private libraryContext;
    private ui;
    private aiTool;
    private itemsPerPage;
    private currentPage;
    private logger;
    private config;
    private aiService;
    /** TypeScript and JavaScript type keywords for syntax highlighting */
    private typeKeywords;
    /**
     * Creates a new StudyLibContext instance
     * @param options Configuration options
     */
    constructor(options?: StudyLibOptions);
    /**
     * Studies a library and generates documentation
     * @param methodName Name of the library/method to study
     * @returns Generated documentation
     * @throws {StudylibError} If documentation generation fails
     */
    study(methodName: string): Promise<AIResponse>;
    /**
     * Displays the generated documentation with syntax highlighting
     * @param docs Array of library documentation to display
     */
    private displayDocumentation;
}
//# sourceMappingURL=StudylibContext.d.ts.map