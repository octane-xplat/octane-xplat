// Boundary types for @octane-xplat/ui/web — web-only components. This
// subpath resolves only under the `web` condition; importing it from
// shared `.tsrx` fails the native build on purpose.

import type { UniversalComponent } from 'octane/universal'
import type { HoverableProps, TooltipProps } from './props'

export type { HoverableProps, TooltipProps } from './props'

/** Delayed hover intent with a portaled card — hover has no touch-platform
 *  semantic, so this is web-only by design. */
export declare const Hoverable: UniversalComponent<HoverableProps>

/** Hover-intent + keyboard-focus tooltip anchored through Popover —
 *  `aria-describedby` wiring and Escape/scroll dismissal included. Web-only
 *  (decision #47); on touch targets compose `Pressable` + `Popover`. */
export declare const Tooltip: UniversalComponent<TooltipProps>
