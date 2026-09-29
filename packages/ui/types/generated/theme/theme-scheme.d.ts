export type ThemePreference = 'light' | 'dark' | 'system';
/** App-level theme override. 'system' clears the override and follows the OS. */
export declare function setThemePreference(p: ThemePreference): void;
export declare function getThemePreference(): ThemePreference;
/** The effective scheme: explicit override if set, else system appearance. */
export declare function getThemeScheme(): 'light' | 'dark';
/** Reactive effective scheme — re-renders on override or OS change. */
export declare function useThemeScheme(): 'light' | 'dark';
/** Class string to stamp on independently-mounted roots (portal hosts,
 *  overlay/sheet/modal/toast containers): 'ns-dark dark' when effective
 *  dark, '' otherwise. Both names because tokens.css publishes both
 *  selectors and hosts may render either vocabulary. */
export declare function themeSchemeClasses(): string;
/** Subscribe imperative hosts to effective-scheme changes; returns an
 *  unsubscribe. Use for hosts that live outside any render cycle. */
export declare function onThemeSchemeChange(cb: () => void): () => void;
/** Stamp `base + themeSchemeClasses()` onto an imperative host (NS view or
 *  DOM element) and keep it live — returns an unsubscribe to call when the
 *  host closes. Works on both leaves since both honor `.className`. */
export declare function applyThemeClasses(view: any, base: string): () => void;
