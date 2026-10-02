import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Gesture(props: ViewProps) @{
	<View {...props} style={{ ...props.style, touchAction: 'none', userSelect: 'none', boxSizing: 'border-box' }} />
}
