/**
 * @fileoverview Cache manager for AI-generated documentation responses
 * @module AIResponseCache
 */

import { CacheManager } from '../lib/cache/CacheManager';
import { AIResponse } from '../lib/StudylibContext';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

/** Cache entry for AI responses */
interface AIResponseCacheEntry {
    /** Generated documentation */
    response: AIResponse;
    /** Metadata about the generation */
    metadata: {
        /** Name of the library */
        libraryName: string;
        /** Version of the library */
        libraryVersion: string;
        /** AI tool used */
        aiTool: string;
        /** Generation timestamp */
        timestamp: number;
        /** Items per page setting */
        itemsPerPage: number;
    };
}

/**
 * Cache manager for AI-generated documentation
 * Implements singleton pattern for global access
 */
export class AIResponseCache {
    private static instance: AIResponseCache;
    private cache: CacheManager;

    /**
     * Creates a new AIResponseCache instance
     * Initializes the cache with appropriate settings
     */
    private constructor() {
        this.cache = CacheManager.getInstance({
            cacheDir: path.join(os.homedir(), '.studylib', 'ai-cache'),
            ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
            maxSize: 500 * 1024 * 1024 // 500MB
        });
    }

    /**
     * Gets the singleton AIResponseCache instance
     * @returns AIResponseCache instance
     */
    static getInstance(): AIResponseCache {
        if (!AIResponseCache.instance) {
            AIResponseCache.instance = new AIResponseCache();
        }
        return AIResponseCache.instance;
    }

    /**
     * Gets a cached AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @returns Cached response or null if not found
     */
    async get(
        libraryName: string,
        libraryVersion: string,
        aiTool: string,
        itemsPerPage: number
    ): Promise<AIResponse | null> {
        const cacheKey = this.generateCacheKey(libraryName, libraryVersion, aiTool, itemsPerPage);
        const cached = await this.cache.get<AIResponseCacheEntry>(cacheKey);
        return cached?.response || null;
    }

    /**
     * Caches an AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @param response Response to cache
     */
    async set(
        libraryName: string,
        libraryVersion: string,
        aiTool: string,
        itemsPerPage: number,
        response: AIResponse
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(libraryName, libraryVersion, aiTool, itemsPerPage);
        const entry: AIResponseCacheEntry = {
            response,
            metadata: {
                libraryName,
                libraryVersion,
                aiTool,
                timestamp: Date.now(),
                itemsPerPage
            }
        };
        await this.cache.set(cacheKey, entry);
    }

    /**
     * Invalidates cache entries for a specific library
     * @param libraryName Name of the library to invalidate
     */
    async invalidate(libraryName: string): Promise<void> {
        // Note: This is a basic implementation.
        // For a more sophisticated approach, we'd need to maintain an index of cache keys by library
        await this.cache.clear();
    }

    /**
     * Generates a unique cache key for the AI response
     * @param libraryName Name of the library
     * @param libraryVersion Version of the library
     * @param aiTool AI tool used
     * @param itemsPerPage Items per page setting
     * @returns SHA-256 hash of the parameters
     */
    private generateCacheKey(
        libraryName: string,
        libraryVersion: string,
        aiTool: string,
        itemsPerPage: number
    ): string {
        const data = `${libraryName}:${libraryVersion}:${aiTool}:${itemsPerPage}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
} 