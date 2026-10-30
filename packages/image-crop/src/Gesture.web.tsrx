/** @jsxImportSource @octane-xplat/jsx/dom */
import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
import type { JSX } from 'octane/jsx-runtime'
export function Gesture(props: ViewProps): JSX.Element @{
	<View
		{...props}
		style={{
			...(typeof props.style === 'object' ? props.style : null),
			touchAction: 'none',
			userSelect: 'none',
			boxSizing: 'border-box',
		}}
	/>
}
