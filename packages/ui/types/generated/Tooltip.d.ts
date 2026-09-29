import type { TooltipProps } from './props.js';
/**  Native-default leaf — the implementation, not a stub. On macOS the
 *  `__xplatAppKit` bridge supplies real pointer intent: an NSTrackingArea on
 *  the anchor feeds the same open/close delays as web, and the panel is an
 *  anchored NSPopover mounted as its own Octane root. iOS/Android take the
 *  `.mobile` passthrough; bridge-absent targets (Windows) render the
 *  trigger only. The content renders once at open (the popup root is a
 *  separate tree — no shared context). */
export declare function Tooltip(props: TooltipProps): unknown;
