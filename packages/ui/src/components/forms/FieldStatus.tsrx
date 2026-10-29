/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { FieldStatusComponentProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'

/** `FieldStatus` — standalone status message (Astryx part): severity text
 *  with a tone class. */
export function FieldStatus(props: FieldStatusComponentProps) @{
	const variant = props.variant ?? 'detached'

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-fieldstatus',
			`vx-fieldstatus--${props.type}`,
			`vx-fieldstatus--${variant}`,
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.message != null ? <label className="vx-fieldstatus-text" text={props.message} /> : null}
	</masonview>
}
