import { type I18n } from '@lingui/core';
/** Subscribe the calling component to locale changes and return the locale. */
export declare function useLocale(): string;
/**
 * Subscribe the calling component to locale changes and return the Lingui
 * i18n instance. Call this in components that render localized text so they
 * re-render when setLocale switches catalogs — the core macros read the i18n
 * singleton, but nothing re-invokes the render without this subscription.
 */
export declare function useLingui(): I18n;
/**
 * Locale-aware string comparison, bound to the active catalog locale.
 * Mirrors Astryx's useCollator: a memoized Intl.Collator that re-derives
 * when setLocale switches. Falls back to 'en' before initLingui resolves.
 */
export declare function useCollator(options?: Intl.CollatorOptions): Intl.Collator;
/**
 * Locale-aware list formatting (Intl.ListFormat), bound to the active
 * catalog locale. React Aria useListFormatter counterpart.
 */
export declare function useListFormatter(options?: Intl.ListFormatOptions): Intl.ListFormat;
export interface FilterMatch {
    contains: (string: string, substring: string) => boolean;
    startsWith: (string: string, substring: string) => boolean;
    endsWith: (string: string, substring: string) => boolean;
}
/**
 * Build contains/startsWith/endsWith matchers over a collator — the pure
 * half of useFilter. Matching compares equal-length NFC-normalized windows
 * with collator.compare so case/diacritic rules follow the locale rather
 * than code-unit equality. Windows are code-unit slices, so a needle or
 * haystack ending mid-surrogate-pair is an approximation, same as React
 * Aria's non-segmented path.
 */
export declare function createFilter(collator: Intl.Collator): FilterMatch;
/**
 * Locale-aware substring matching for filtering lists — React Aria's
 * useFilter. Options are Intl.CollatorOptions (usage defaults to 'search'),
 * so sensitivity: 'base' gives case- and diacritic-insensitive matching.
 */
export declare function useFilter(options?: Intl.CollatorOptions): FilterMatch;
