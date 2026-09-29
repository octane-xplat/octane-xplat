import type { HoverableProps } from './props.js';
/**  Native-default leaf — the implementation, not a stub. On macOS the
 *  `__xplatAppKit` bridge supplies real pointer intent: an NSTrackingArea
 *  drives the same open/close delays as web and the card is an anchored
 *  NSPopover that stays open while the pointer crosses to the panel (the
 *  panel gets its own tracking area), matching the web leaf's pointer
 *  bridge. iOS/Android take the `.mobile` passthrough; bridge-absent
 *  targets (Windows) render the children only. The card renders once at
 *  open in a separate Octane root — no shared context. */
export declare function Hoverable(props: HoverableProps): unknown;
