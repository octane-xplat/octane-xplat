/** @jsxImportSource @octane-xplat/macos-renderer */
import type { VideoProps } from './props'

/** Explicit placeholder until the AppKit host has a video surface. */
export function Video(_props: VideoProps) @{
	<label className="vx-unsupported">Video playback is unsupported by the AppKit host</label>
}
