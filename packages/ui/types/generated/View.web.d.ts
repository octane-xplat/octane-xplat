import type { ViewProps } from './props.js';
/**  Neutral flex-column container — the RN-shaped default block.
 *  onPan is pointer plumbing: pointerdown/move/up on the element.
 *  pointermove isn't in octane's delegated-event set, so the leaf attaches
 *  raw listeners via a ref — that's why `bind` exists. Payloads normalize
 *  to the shared shape {x,y,dx,dy,vx,vy,state,target}. */
export declare function View(props: ViewProps): import("octane/jsx-runtime").JSX.Element;
