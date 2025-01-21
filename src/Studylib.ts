import { StudyLibContext, StudyLibOptions } from './lib/StudylibContext';

export * from './lib/StudylibContext';
export * from './lib/Config';
export * from './lib/errors/StudylibError';
export * from './lib/RequireLibraryContext';
export * from './services/AIResponseCache';
export * from './services/AIService';
export * from "./lib/errors/StudylibError";
export * from "./lib/cache/CacheManager";
export * from './Logger';

export async function studylib(library: string, options: StudyLibOptions) {
    const context = new StudyLibContext(options);
    const result = await context.study(library);
    return result;
}

export default studylib;