/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ProgressGroupProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Meter } from './Meter.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** ProgressGroup — stacked labeled Meter rows. */
export function ProgressGroup(props: ProgressGroupProps): JSX.Element @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-progressgroup', props.className]}
		style={props.style}
		role="group"
	>
		{props.items.map((item: any) => (
			<div key={item.key} className="vx-progressgroup-row">
				<Meter value={item.value} max={item.max} accessibilityLabel={item.label} />
				{item.label != null ? <span className="vx-progressgroup-label">{item.label}</span> : null}
			</div>
		))}
	</div>
}
