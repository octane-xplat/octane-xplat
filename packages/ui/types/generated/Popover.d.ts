import type { PopoverProps } from './props.js';
/**  Positions popover content in a layer on the current page's RootLayout —
 *  the universal driver has no createPortal, so this is imperative like
 *  Overlay: a transparent host opened on the RootLayout enclosing the
 *  anchor, with PopoverLayer positioning itself over the anchor's rect. */
export declare function Popover(props: PopoverProps): unknown;
