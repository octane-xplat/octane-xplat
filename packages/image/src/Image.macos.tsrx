/** @jsxImportSource @octane-xplat/jsx */
import { Image as CoreImage } from '@octane-xplat/ui'
import type { ImageProps } from './props'
import { withAppKitImageRequest } from './cache-bridge.macos'

/** AppKit currently uses the core native image host. Keep source grammar,
 * placeholders, classes and layout identical while engine-specific
 * headers, decode bounds and transitions remain gaps. Owned load/error events
 * use a private handoff through the same core native host. */
export function Image(props: ImageProps) @{
	<CoreImage {...withAppKitImageRequest(props, CoreImage)} />
}
