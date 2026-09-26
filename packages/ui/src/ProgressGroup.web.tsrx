import type { ProgressGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Meter } from './Meter.web.tsrx';

/** ProgressGroup — stacked labeled Meter rows. */
export function ProgressGroup(props: ProgressGroupProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-progressgroup', props.className]} style={props.style} role="group">
		{props.items.map((item: any) => (
			<div key={item.key} className="vx-progressgroup-row">
				<Meter value={item.value} max={item.max} accessibilityLabel={item.label} />
				{item.label != null ? <span className="vx-progressgroup-label">{item.label}</span> : null}
			</div>
		))}
	</div>
}
