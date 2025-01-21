/**
 * @fileoverview Cache manager for AI-generated documentation responses
 * @module AIResponseCache
 */
import { AIResponse } from '../lib/StudylibContext';
/**
 * Cache manager for AI-generated documentation
 * Implements singleton pattern for global access
 */
export declare class AIResponseCache {
    private static instance;
    private cache;
    /**
     * Creates a new AIResponseCache instance
     * Initializes the cache with appropriate settings
     */
    private constructor();
    /**
     * Gets the singleton AIResponseCache instance
     * @returns AIResponseCache instance
     */
    static getInstance(): AIResponseCache;
    /**
     * Gets a cached AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @returns Cached response or null if not found
     */
    get(libraryName: string, libraryVersion: string, aiTool: string, itemsPerPage: number): Promise<AIResponse | null>;
    /**
     * Caches an AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @param response Response to cache
     */
    set(libraryName: string, libraryVersion: string, aiTool: string, itemsPerPage: number, response: AIResponse): Promise<void>;
    /**
     * Invalidates cache entries for a specific library
     * @param libraryName Name of the library to invalidate
     */
    invalidate(libraryName: string): Promise<void>;
    /**
     * Generates a unique cache key for the AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @returns SHA-256 hash of the parameters
     */
    private generateCacheKey;
}
//# sourceMappingURL=AIResponseCache.d.ts.map