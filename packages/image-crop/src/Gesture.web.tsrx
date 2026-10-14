import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Gesture(props: ViewProps) @{
	<View {...props} style={{ ...(typeof props.style === 'object' ? props.style : null), touchAction: 'none', userSelect: 'none', boxSizing: 'border-box' }} />
}
