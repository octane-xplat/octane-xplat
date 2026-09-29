export type { ColorScheme } from '../props.js';
import type { ColorScheme } from '../props.js';
export declare function getColorScheme(): ColorScheme;
export declare function subscribeSystemScheme(cb: () => void): () => void;
/** Reactive system appearance — 'light' | 'dark', re-renders on OS change. */
export declare function useColorScheme(): ColorScheme;
