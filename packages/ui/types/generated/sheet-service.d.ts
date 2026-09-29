import { GridLayout } from '@nativescript/core';
import type { ModalOpenResult, OpenSheet } from './props.js';
/** The most recently opened sheet's host view — for harness asserts (view
 *  identity beats tree search; the owning rootlayout may unload/reload). */
export declare function sheetHost(): GridLayout | null;
/** Close the most recently opened sheet (resolve with `result`). */
export declare function closeSheet(result?: ModalOpenResult): void;
/** Imperative in-window sheet: a dedicated Octane root on a bottom-docked
 *  GridLayout host opened on the CURRENT rootlayout (topRootLayout — the
 *  service has no declaring view). Resolves when the sheet closes. */
export declare const openSheet: OpenSheet;
