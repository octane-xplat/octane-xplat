export type { ColorScheme } from '../props.js';
import type { ColorScheme } from '../props.js';
export declare function getColorScheme(): ColorScheme;
export declare function subscribeSystemScheme(cb: () => void): () => void;
export declare function useColorScheme(): ColorScheme;
