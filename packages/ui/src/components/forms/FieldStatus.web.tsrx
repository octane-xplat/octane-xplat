/** @jsxImportSource @octane-xplat/jsx/dom */
import type { FieldStatusComponentProps } from '../../props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { STATUS_ICON_PATHS } from '../../theme/status-icons'

/** `FieldStatus` — standalone status message (Astryx part): severity glyph
 *  plus message, used where a field owns its chrome. */
export function FieldStatus(props: FieldStatusComponentProps) @{
	const variant = props.variant ?? 'detached'

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="status"
		className={[
			'vx-fieldstatus',
			`vx-fieldstatus--${props.type}`,
			`vx-fieldstatus--${variant}`,
			props.className,
		]}
		style={props.style}
	>
		<span className="vx-fieldstatus-icon" aria-hidden="true">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				width="1em"
				height="1em"
				aria-hidden="true"
			>
				<path fillRule="evenodd" clipRule="evenodd" d={STATUS_ICON_PATHS[props.type]} />
			</svg>
		</span>
		{props.message != null ? <span className="vx-fieldstatus-text">{props.message}</span> : null}
	</div>
}
