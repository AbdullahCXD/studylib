/**
 * @fileoverview Generic file-based cache manager
 * @module CacheManager
 */
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
export declare class CacheManager {
    private static instance;
    private logger;
    private readonly cacheDir;
    private readonly ttl;
    private readonly maxSize;
    /**
     * Creates a new CacheManager instance
     * @param options Cache configuration options
     */
    private constructor();
    /**
     * Gets the singleton CacheManager instance
     * @param options Cache configuration options
     * @returns CacheManager instance
     */
    static getInstance(options?: CacheOptions): CacheManager;
    /**
     * Gets a value from cache
     * @param key Cache key
     * @returns Cached value or null if not found/expired
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Sets a value in cache
     * @param key Cache key
     * @param value Value to cache
     */
    set<T>(key: string, value: T): Promise<void>;
    /**
     * Deletes a value from cache
     * @param key Cache key
     */
    delete(key: string): Promise<void>;
    /**
     * Clears all cache entries
     * @throws {StudylibError} If cache directory cannot be cleared
     */
    clear(): Promise<void>;
    /**
     * Gets the total size of the cache directory
     * @returns Total size in bytes
     */
    private getCacheSize;
    /**
     * Ensures the cache directory exists
     * @throws {StudylibError} If directory cannot be created
     */
    private initializeCache;
    /**
     * Ensures there's enough space in the cache directory
     * Removes oldest entries if necessary
     */
    private ensureCacheSpace;
    /**
     * Gets the cache file path for a key
     * @param key Cache key
     * @returns Safe file path for the cache entry
     */
    private getCacheFilePath;
}
//# sourceMappingURL=CacheManager.d.ts.map