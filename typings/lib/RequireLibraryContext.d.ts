interface LibraryExports {
    [key: string]: any;
}
interface Repository {
    type: string;
    url: string;
}
type Dependency = `^${string}`;
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
export declare class RequireLibraryContext {
    private logger;
    private memoryCache;
    private fileCache;
    private readonly memoryCacheTimeout;
    private readonly maxMemoryCacheSize;
    constructor();
    /**
     * Gets the exports context for a given library/dependency
     * @param libraryName Name of the library to get context for
     * @returns Object containing the library's exports
     * @throws {StudylibError} If library cannot be loaded
     */
    context(libraryName: string): Promise<LibraryExports>;
    /**
     * Checks if a library has a default export
     * @param libraryName Name of the library to check
     * @returns boolean indicating if library has a default export
     */
    hasDefaultExport(libraryName: string): Promise<boolean>;
    /**
     * Gets all named exports of a library
     * @param libraryName Name of the library
     * @returns Array of named export keys
     */
    getNamedExports(libraryName: string): Promise<string[]>;
    /**
     * Checks if a library is installed and available
     * @param libraryName Name of the library to check
     * @returns boolean indicating if library is available
     */
    isAvailable(libraryName: string): boolean;
    /**
     * Gets the package.json of a library if available
     * @param libraryName Name of the library
     * @returns Package.json contents or null if not found
     * @throws {StudylibError} If package.json is invalid
     */
    getPackageInfo(libraryName: string): Promise<PackageInfo | null>;
    /**
     * Gets the TypeScript types information for a library
     * @param libraryName Name of the library
     * @returns Path to type definitions or null if not found
     */
    getTypesInfo(libraryName: string): Promise<string | null>;
    /**
     * Gets all dependencies of a library
     * @param libraryName Name of the library
     * @returns Object containing all dependencies
     */
    getAllDependencies(libraryName: string): Promise<Dependencies>;
    /**
     * Cleans up old entries from the memory cache
     */
    private cleanMemoryCache;
    private getFromMemoryCache;
    private setInMemoryCache;
    private validateLibraryName;
    private isValidPackageInfo;
    private checkDefaultExport;
    /**
     * Calculates a hash of a file's contents
     */
    private getFileHash;
}
export {};
//# sourceMappingURL=RequireLibraryContext.d.ts.map