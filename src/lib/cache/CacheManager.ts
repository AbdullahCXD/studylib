/**
 * @fileoverview Generic file-based cache manager
 * @module CacheManager
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { StudylibError, ErrorCode } from '../errors/StudylibError';
import { Logger } from '../../Logger';

/** Configuration options for the cache manager */
export interface CacheOptions {
    /** Cache directory path. Defaults to ~/.studylib/cache */
    cacheDir?: string;
    /** Time in milliseconds before cache entries expire. Defaults to 24 hours */
    ttl?: number;
    /** Maximum size of cache directory in bytes. Defaults to 100MB */
    maxSize?: number;
}

/**
 * Generic file-based cache manager
 * Handles caching of arbitrary data with TTL and size limits
 * Implements singleton pattern for global access
 */
export class CacheManager {
    private static instance: CacheManager;
    private logger: Logger;
    private readonly cacheDir: string;
    private readonly ttl: number;
    private readonly maxSize: number;

    /**
     * Creates a new CacheManager instance
     * @param options Cache configuration options
     */
    private constructor(options?: CacheOptions) {
        this.logger = Logger.getInstance();
        this.cacheDir = options?.cacheDir || path.join(os.homedir(), '.studylib', 'cache');
        this.ttl = options?.ttl || 24 * 60 * 60 * 1000; // 24 hours
        this.maxSize = options?.maxSize || 100 * 1024 * 1024; // 100MB
        this.initializeCache();
    }

    /**
     * Gets the singleton CacheManager instance
     * @param options Cache configuration options
     * @returns CacheManager instance
     */
    static getInstance(options?: CacheOptions): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(options);
        }
        return CacheManager.instance;
    }

    /**
     * Gets a value from cache
     * @param key Cache key
     * @returns Cached value or null if not found/expired
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const filePath = this.getCacheFilePath(key);
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const data = await fs.promises.readFile(filePath, 'utf-8');
            const cached = JSON.parse(data);

            // Check if cache has expired
            if (Date.now() - cached.timestamp > this.ttl) {
                await this.delete(key);
                return null;
            }

            return cached.value as T;
        } catch (error) {
            this.logger.debug(`Failed to read cache for key "${key}": ${error}`);
            return null;
        }
    }

    /**
     * Sets a value in cache
     * @param key Cache key
     * @param value Value to cache
     */
    async set<T>(key: string, value: T): Promise<void> {
        try {
            await this.ensureCacheSpace();
            const filePath = this.getCacheFilePath(key);
            const data = {
                timestamp: Date.now(),
                value
            };
            await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.debug(`Failed to write cache for key "${key}": ${error}`);
        }
    }

    /**
     * Deletes a value from cache
     * @param key Cache key
     */
    async delete(key: string): Promise<void> {
        try {
            const filePath = this.getCacheFilePath(key);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            this.logger.debug(`Failed to delete cache for key "${key}": ${error}`);
        }
    }

    /**
     * Clears all cache entries
     * @throws {StudylibError} If cache directory cannot be cleared
     */
    async clear(): Promise<void> {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => 
                    fs.promises.unlink(path.join(this.cacheDir, file))
                )
            );
        } catch (error) {
            throw new StudylibError(
                'Failed to clear cache',
                ErrorCode.CONFIG_ERROR,
                error
            );
        }
    }

    /**
     * Gets the total size of the cache directory
     * @returns Total size in bytes
     */
    private async getCacheSize(): Promise<number> {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const sizes = await Promise.all(
                files.map(async file => {
                    const stats = await fs.promises.stat(path.join(this.cacheDir, file));
                    return stats.size;
                })
            );
            return sizes.reduce((total, size) => total + size, 0);
        } catch (error) {
            this.logger.debug(`Failed to get cache size: ${error}`);
            return 0;
        }
    }

    /**
     * Ensures the cache directory exists
     * @throws {StudylibError} If directory cannot be created
     */
    private initializeCache(): void {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
        } catch (error) {
            throw new StudylibError(
                'Failed to initialize cache directory',
                ErrorCode.CONFIG_ERROR,
                error
            );
        }
    }

    /**
     * Ensures there's enough space in the cache directory
     * Removes oldest entries if necessary
     */
    private async ensureCacheSpace(): Promise<void> {
        const currentSize = await this.getCacheSize();
        if (currentSize > this.maxSize) {
            try {
                const files = await fs.promises.readdir(this.cacheDir);
                const fileStats = await Promise.all(
                    files.map(async file => {
                        const filePath = path.join(this.cacheDir, file);
                        const stats = await fs.promises.stat(filePath);
                        return { file, stats };
                    })
                );

                // Sort by last access time, oldest first
                fileStats.sort((a, b) => a.stats.atime.getTime() - b.stats.atime.getTime());

                // Delete files until we're under the limit
                let size = currentSize;
                for (const { file, stats } of fileStats) {
                    if (size <= this.maxSize) break;
                    await fs.promises.unlink(path.join(this.cacheDir, file));
                    size -= stats.size;
                }
            } catch (error) {
                this.logger.debug(`Failed to clean cache: ${error}`);
            }
        }
    }

    /**
     * Gets the cache file path for a key
     * @param key Cache key
     * @returns Safe file path for the cache entry
     */
    private getCacheFilePath(key: string): string {
        // Create a safe filename from the key
        const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
        return path.join(this.cacheDir, `${safeKey}.json`);
    }
} 