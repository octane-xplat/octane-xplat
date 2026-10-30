/** @jsxImportSource @octane-xplat/jsx/dom */
import type { AlertProps } from '../../props'
import { applyEscapeProps } from './escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Alert — status callout. `tone` picks a class modifier; error gets
 *  role=alert, the rest role=status. */
export function Alert(props: AlertProps): JSX.Element @{
	const tone = props.tone ?? 'info'

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-alert', 'vx-alert--' + tone, props.className]}
		style={props.style}
		role={tone === 'error' ? 'alert' : 'status'}
	>
		{props.icon ? <Icon name={props.icon} className="vx-alert-icon" /> : null}
		<div className="vx-alert-body">
			{props.title != null ? <span className="vx-alert-title">{props.title}</span> : null}
			{props.children}
		</div>
	</div>
}
