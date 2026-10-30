/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Guide(props: ViewProps): unknown @{
	<View
		{...props}
		ios={{ isUserInteractionEnabled: false }}
		android={{ isUserInteractionEnabled: false }}
	/>
}
