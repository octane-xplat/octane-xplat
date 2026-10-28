/** @jsxImportSource @octane-xplat/jsx */
import { Image as CoreImage } from '@octane-xplat/ui'
import type { ImageProps } from './props'
import { withAppKitImagePolicy } from './cache-bridge.macos'

/** AppKit currently uses the core native image host. Keep source grammar,
 * placeholders, classes and layout identical while engine-specific
 * headers, decode bounds, transitions and load/error callbacks remain gaps. */
export function Image(props: ImageProps) @{
	<CoreImage {...withAppKitImagePolicy(props, CoreImage)} />
}
