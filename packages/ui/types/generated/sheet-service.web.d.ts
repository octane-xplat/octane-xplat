import type { ModalOpenResult, OpenSheet } from './props.js';
/** Close the most recently opened sheet (resolve with `result`). */
export declare function closeSheet(result?: ModalOpenResult): void;
/** Imperative in-window sheet: portal layer at document root, bottom-
 *  anchored panel, dedicated Octane root. Resolves when the sheet closes. */
export declare const openSheet: OpenSheet;
