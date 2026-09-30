import type { GridChildPlacement } from './grid-placement.js';
export interface GridCell {
    row: number;
    col: number;
}
export interface GridAutoPlacement {
    cells: GridCell[];
    rowCount: number;
    columnCount: number;
}
/** Match CSS Grid's row-flow placement for NativeScript GridLayout children. */
export declare function autoPlaceGridChildren(items: readonly GridChildPlacement[], rowTracks?: string, columnTracks?: string): GridAutoPlacement;
export declare function ensureGridTracks(spec: string | undefined, requiredCount: number): string;
