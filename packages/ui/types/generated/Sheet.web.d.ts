import type { SheetProps } from './props.js';
/**  In-window bottom sheet — portal layer with a backdrop and a bottom-
 *  anchored panel. Same vocabulary as the native RootLayout sheet.
 *  `detents` adds a self-drawn grabber + drag-to-snap via
 *  sheet-detents.web; the drag-dismiss path reports through `onDismiss`
 *  like a shade tap. */
export declare function Sheet(props: SheetProps): import("octane/jsx-runtime").JSX.Element | null;
