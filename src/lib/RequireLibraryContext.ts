import { Logger } from '../Logger';
import { StudylibError, ErrorCode } from './errors/StudylibError';
import { CacheManager } from './cache/CacheManager';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';

interface LibraryExports {
  [key: string]: any;
}

interface Repository {
  type: string;
  url: string;
}

type Dependency = `^${string}`

interface Dependencies {
  [packageName: string]: Dependency;
}

interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  main?: string;
  types?: string;
  author?: string;
  license?: string;
  repository?: Repository;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  [key: string]: any;
}

interface LibraryCache {
  exports: LibraryExports;
  packageInfo: PackageInfo | null;
  lastAccessed: number;
  hasDefaultExport: boolean;
  fileHash: string;
}

export class RequireLibraryContext {
  private logger: Logger;
  private memoryCache: Map<string, LibraryCache>;
  private fileCache: CacheManager;
  private readonly memoryCacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  private readonly maxMemoryCacheSize: number = 50;

  constructor() {
    this.logger = Logger.getInstance();
    this.memoryCache = new Map();
    this.fileCache = CacheManager.getInstance({
      cacheDir: path.join(os.homedir(), '.studylib', 'library-cache'),
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  /**
   * Gets the exports context for a given library/dependency
   * @param libraryName Name of the library to get context for
   * @returns Object containing the library's exports
   * @throws {StudylibError} If library cannot be loaded
   */
  public async context(libraryName: string): Promise<LibraryExports> {
    this.validateLibraryName(libraryName);

    // Check memory cache first
    const memCached = this.getFromMemoryCache(libraryName);
    if (memCached?.exports) {
      return memCached.exports;
    }

    try {
      // Try to resolve the library path first
      const libraryPath = require.resolve(libraryName);
      
      // Check if the library exists
      if (!fs.existsSync(libraryPath)) {
        throw new StudylibError(
          `Library "${libraryName}" not found at path: ${libraryPath}`,
          ErrorCode.LIBRARY_NOT_FOUND
        );
      }

      // Calculate file hash
      const fileHash = await this.getFileHash(libraryPath);

      // Check file cache
      const cacheKey = `${libraryName}:${fileHash}`;
      const fileCached = await this.fileCache.get<LibraryCache>(cacheKey);
      if (fileCached) {
        // Update memory cache and return
        this.setInMemoryCache(libraryName, fileCached);
        return fileCached.exports;
      }

      // Dynamically require the library
      const library = require(libraryPath);
      
      // Handle default exports
      const hasDefaultExport = this.checkDefaultExport(library);
      const exports = hasDefaultExport ? { default: library, ...library } : library;
      
      // Create cache entry
      const cacheEntry: LibraryCache = {
        exports,
        packageInfo: await this.getPackageInfo(libraryName),
        lastAccessed: Date.now(),
        hasDefaultExport,
        fileHash
      };

      // Update both caches
      await this.fileCache.set(cacheKey, cacheEntry);
      this.setInMemoryCache(libraryName, cacheEntry);

      return exports;
    } catch (error) {
      if (error instanceof StudylibError) {
        throw error;
      }
      throw new StudylibError(
        `Failed to load library "${libraryName}"`,
        ErrorCode.LIBRARY_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Checks if a library has a default export
   * @param libraryName Name of the library to check
   * @returns boolean indicating if library has a default export
   */
  public async hasDefaultExport(libraryName: string): Promise<boolean> {
    const cached = this.getFromMemoryCache(libraryName);
    if (cached) {
      return cached.hasDefaultExport;
    }

    try {
      const exports = await this.context(libraryName);
      const cached = this.memoryCache.get(libraryName);
      return cached?.hasDefaultExport || false;
    } catch {
      return false;
    }
  }

  /**
   * Gets all named exports of a library
   * @param libraryName Name of the library
   * @returns Array of named export keys
   */
  public async getNamedExports(libraryName: string): Promise<string[]> {
    try {
      const exports = await this.context(libraryName);
      const hasDefault = await this.hasDefaultExport(libraryName);
      return Object.keys(exports).filter(key => !hasDefault || key !== 'default');
    } catch {
      return [];
    }
  }

  /**
   * Checks if a library is installed and available
   * @param libraryName Name of the library to check
   * @returns boolean indicating if library is available
   */
  public isAvailable(libraryName: string): boolean {
    try {
      this.validateLibraryName(libraryName);
      require.resolve(libraryName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the package.json of a library if available
   * @param libraryName Name of the library
   * @returns Package.json contents or null if not found
   * @throws {StudylibError} If package.json is invalid
   */
  public async getPackageInfo(libraryName: string): Promise<PackageInfo | null> {
    this.validateLibraryName(libraryName);

    // Check memory cache first
    const memCached = this.getFromMemoryCache(libraryName);
    if (memCached?.packageInfo) {
      return memCached.packageInfo;
    }

    try {
      const packagePath = require.resolve(`${libraryName}/package.json`);
      const fileHash = await this.getFileHash(packagePath);
      const cacheKey = `${libraryName}:package:${fileHash}`;

      // Check file cache
      const fileCached = await this.fileCache.get<PackageInfo>(cacheKey);
      if (fileCached) {
        return fileCached;
      }

      const packageInfo = require(packagePath) as PackageInfo;

      // Validate package info
      if (!this.isValidPackageInfo(packageInfo)) {
        throw new StudylibError(
          `Invalid package.json for "${libraryName}"`,
          ErrorCode.VALIDATION_ERROR,
          { packageInfo }
        );
      }

      // Cache the result
      await this.fileCache.set(cacheKey, packageInfo);
      return packageInfo;
    } catch (error) {
      if (error instanceof StudylibError) {
        throw error;
      }
      this.logger.debug(`Could not load package.json for "${libraryName}": ${error}`);
      return null;
    }
  }

  /**
   * Gets the TypeScript types information for a library
   * @param libraryName Name of the library
   * @returns Path to type definitions or null if not found
   */
  public async getTypesInfo(libraryName: string): Promise<string | null> {
    const packageInfo = await this.getPackageInfo(libraryName);
    if (!packageInfo) return null;

    // Check for explicit types field
    if (packageInfo.types) {
      return packageInfo.types;
    }

    // Check for @types package
    try {
      const typesPackage = `@types/${libraryName}`;
      if (this.isAvailable(typesPackage)) {
        const typesInfo = await this.getPackageInfo(typesPackage);
        return typesInfo?.types || null;
      }
    } catch {
      // Ignore errors when checking @types package
    }

    return null;
  }

  /**
   * Gets all dependencies of a library
   * @param libraryName Name of the library
   * @returns Object containing all dependencies
   */
  public async getAllDependencies(libraryName: string): Promise<Dependencies> {
    const packageInfo = await this.getPackageInfo(libraryName);
    if (!packageInfo) return {};

    return {
      ...(packageInfo.dependencies || {}),
      ...(packageInfo.devDependencies || {}),
      ...(packageInfo.peerDependencies || {})
    };
  }

  /**
   * Cleans up old entries from the memory cache
   */
  private cleanMemoryCache(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.lastAccessed > this.memoryCacheTimeout) {
        this.memoryCache.delete(key);
      }
    }

    // If still too many entries, remove oldest
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      while (this.memoryCache.size > this.maxMemoryCacheSize) {
        const [key] = entries.shift()!;
        this.memoryCache.delete(key);
      }
    }
  }

  private getFromMemoryCache(libraryName: string): LibraryCache | undefined {
    const cached = this.memoryCache.get(libraryName);
    if (cached) {
      cached.lastAccessed = Date.now();
      this.memoryCache.set(libraryName, cached);
    }
    return cached;
  }

  private setInMemoryCache(libraryName: string, cache: LibraryCache): void {
    this.cleanMemoryCache();
    this.memoryCache.set(libraryName, cache);
  }

  private validateLibraryName(libraryName: string): void {
    if (!libraryName || typeof libraryName !== 'string') {
      throw new StudylibError(
        'Library name must be a non-empty string',
        ErrorCode.VALIDATION_ERROR,
        { libraryName }
      );
    }

    // Check for potentially dangerous paths
    const normalizedPath = path.normalize(libraryName);
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      throw new StudylibError(
        'Invalid library name: must not contain path traversal or absolute paths',
        ErrorCode.VALIDATION_ERROR,
        { libraryName, normalizedPath }
      );
    }
  }

  private isValidPackageInfo(packageInfo: any): packageInfo is PackageInfo {
    return (
      packageInfo &&
      typeof packageInfo === 'object' &&
      typeof packageInfo.name === 'string' &&
      typeof packageInfo.version === 'string'
    );
  }

  private checkDefaultExport(library: any): boolean {
    // Check if the library itself is a function or class (common for default exports)
    if (typeof library === 'function') {
      return true;
    }

    // Check if it's an ES module with a default export
    if (library && typeof library === 'object') {
      const descriptors = Object.getOwnPropertyDescriptors(library);
      if (descriptors.__esModule?.value === true && 'default' in library) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculates a hash of a file's contents
   */
  private async getFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }
}
