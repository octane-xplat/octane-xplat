/** @jsxImportSource @xplat/macos/renderer */
import type { AnimatedImageProps } from './props'

/** Show an explicit placeholder until the AppKit host has an animation view. */
export function AnimatedImage(_props: AnimatedImageProps) @{
	<label className="vx-unsupported">Animated images are unsupported by the AppKit host</label>
}
