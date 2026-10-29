/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ScreenProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
export function Screen(props: ScreenProps) @{
	<div
		id={props.id}
		ref={(e: any) => applyEscapeProps(e, props)}
		className={['vx-screen', props.className]}
		style={props.style}
	>
		{props.children}
	</div>
}
