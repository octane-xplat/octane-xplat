/** @jsxImportSource @octane-xplat/jsx */
import type { AnimatedImageProps } from './props'

/** Unsupported placeholder — the Windows host has no animated-image engine
 *  (ui-image ships iOS/Android only). */
export function AnimatedImage(_props: AnimatedImageProps) @{
	<label className="vx-unsupported" text="Animated images are unsupported on the Windows host" />
}
