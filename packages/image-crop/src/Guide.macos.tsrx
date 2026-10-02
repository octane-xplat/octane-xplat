/** @jsxImportSource @octane-xplat/macos-renderer */
import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Guide(props: ViewProps) @{
	<View {...props} style={{ ...props.style, pointerEvents: 'none' }} />
}
