import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Guide(props: ViewProps) @{
	<View {...props} style={{ ...(typeof props.style === 'object' ? props.style : null), pointerEvents: 'none' }} />
}
