import type { PopoverPlacement } from './props.js';
export interface PopoverRect {
    left: number;
    top: number;
    width: number;
    height: number;
}
export interface PopoverPosition {
    left: number;
    top: number;
    placement: PopoverPlacement;
}
/** Place beside the anchor, flip once when the requested side overflows, then clamp. */
export declare function positionPopover(anchor: PopoverRect, panel: Pick<PopoverRect, 'width' | 'height'>, viewport: PopoverRect, requested?: PopoverPlacement, gap?: number): PopoverPosition;
