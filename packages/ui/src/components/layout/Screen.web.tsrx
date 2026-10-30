/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ScreenProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import type { JSX } from 'octane/jsx-runtime'
export function Screen(props: ScreenProps): JSX.Element @{
	<div
		id={props.id}
		ref={(e: any) => applyEscapeProps(e, props)}
		className={['vx-screen', props.className]}
		style={props.style}
	>
		{props.children}
	</div>
}
