// Boundary types for @octane-xplat/ui/web — web-only components. This
// subpath resolves only under the `web` condition; importing it from
// shared `.tsrx` fails the native build on purpose.

import type { UniversalComponent } from 'octane/universal'
import type { HoverableProps } from './props'

export type { HoverableProps } from './props'

/** Delayed hover intent with a portaled card — hover has no touch-platform
 *  semantic, so this is web-only by design. */
export declare const Hoverable: UniversalComponent<HoverableProps>
