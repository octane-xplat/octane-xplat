/** @jsxImportSource @octane-xplat/jsx/dom */
import type { FieldGroupProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import type { JSX } from 'octane/jsx-runtime'

/** FieldGroup — labeled group of related fields. */
export function FieldGroup(props: FieldGroupProps): JSX.Element @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-fieldgroup', props.className]}
		style={props.style}
		role="group"
		aria-label={props.label}
	>
		{props.label != null ? <span className="vx-fieldgroup-label">{props.label}</span> : null}
		{props.children}
	</div>
}
