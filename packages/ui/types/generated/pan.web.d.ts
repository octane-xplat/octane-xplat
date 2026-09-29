import type { PanEvent } from './props.js';
/**  Shared pan plumbing for web leaves — pointerdown/move/up/cancel with
 *  pointer capture, normalized to the shared gesture shape
 *  {x,y,dx,dy,vx,vy,state,target}. `pointermove` isn't in octane's
 *  delegated-event set, so listeners attach to the element directly —
 *  that's why callers pass the bound-element ref. */
export declare function usePan(el: {
    current: HTMLElement | null;
}, cb?: (e: PanEvent) => void): void;
