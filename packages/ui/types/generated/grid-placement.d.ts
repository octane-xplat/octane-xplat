import type { LayoutChildProps } from './props.js';
export type GridChildPlacement = Pick<LayoutChildProps, 'row' | 'col' | 'rowSpan' | 'colSpan'>;
/** Keep the authored Grid placement next to its mounted NativeScript view. */
export declare function rememberGridChildPlacement(view: unknown, props: GridChildPlacement): void;
export declare function gridChildPlacement(view: unknown): GridChildPlacement;
