import type { ActivityIndicatorProps } from './props';
import { applyWebProps } from './platformProps.web';

export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) return null;

	<div
		id={props.id}
		className={['vx-spinner', props.className]}
		style={props.style}
		role="progressbar"
		ref={(el: any) => applyWebProps(el, props.web)}
	/>
}
