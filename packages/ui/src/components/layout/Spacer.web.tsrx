/** @jsxImportSource @octane-xplat/jsx/dom */
import type { SpacerProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import type { JSX } from 'octane/jsx-runtime'

export function Spacer(props: SpacerProps): JSX.Element @{
	<div
		id={props.id}
		className={['vx-spacer', props.className]}
		style={props.style}
		ref={(el: any) => applyEscapeProps(el, props)}
	/>
}
