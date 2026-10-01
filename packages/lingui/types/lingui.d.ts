import { i18n } from '@lingui/core';
export { i18n };
import type { CatalogLoader, LinguiSetup } from './types';
export declare function subscribeLocale(notify: () => void): () => void;
/** Registered locales, i.e. the catalog keys the app passed in. */
export declare function supportedLocales(): string[];
/** The active locale — '' before initLingui resolves. */
export declare function getLocale(): string;
/**
 * Map a raw locale candidate ('en-US', 'pt_BR', …) onto the app's supported
 * list: exact match, then base-language match, then the fallback.
 */
export declare function matchLocale(candidate: string | undefined, supported: readonly string[], fallbackLocale: string): string;
/**
 * Resolve the active locale: the given candidate (route param, stored
 * preference, …) or the platform's system locale, normalized onto the
 * registered catalogs.
 */
export declare function detectLocale(candidate?: string): string;
/**
 * Register per-locale catalog loaders. Call once at startup through
 * initLingui, or again later to add locales — later calls merge.
 */
export declare function defineCatalogs(next: Record<string, CatalogLoader>): void;
/**
 * Adapt `import.meta.glob` output to defineCatalogs. The locale is read from
 * the parent directory of each matched file — this assumes the catalog layout
 * `locales/<locale>/<name>` (the layout the localization recipe scaffolds).
 */
export declare function catalogsFromGlob(record: Record<string, CatalogLoader>): Record<string, CatalogLoader>;
/** Load + activate a locale, notify subscribers, and persist the choice. */
export declare function setLocale(locale: string): Promise<void>;
/**
 * One-call startup: registers catalogs, resolves the initial locale
 * (explicit `locale` → persisted → system → fallback), and activates it.
 * Returns the activated locale.
 */
export declare function initLingui(setup: LinguiSetup): Promise<string>;
