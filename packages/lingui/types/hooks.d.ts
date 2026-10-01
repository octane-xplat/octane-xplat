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
