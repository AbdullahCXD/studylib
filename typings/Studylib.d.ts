import { StudyLibOptions } from './lib/StudylibContext';
export * from './lib/StudylibContext';
export * from './lib/Config';
export * from './lib/errors/StudylibError';
export * from './lib/RequireLibraryContext';
export * from './services/AIResponseCache';
export * from './services/AIService';
export * from "./lib/errors/StudylibError";
export * from "./lib/cache/CacheManager";
export * from './Logger';
export declare function studylib(library: string, options: StudyLibOptions): Promise<import("./lib/StudylibContext").AIResponse>;
export default studylib;
//# sourceMappingURL=Studylib.d.ts.map