import type { IconGlyph } from './props.js';
export type { IconGlyph } from './props.js';
export declare function registerIcon(name: string, glyph: IconGlyph): void;
export declare function registerIcons(record: Record<string, IconGlyph>): void;
export declare function getIcon(name: string): IconGlyph | undefined;
