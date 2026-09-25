import type { AbsoluteProps } from './props';
import { applyEscapeProps } from './escape-props';

export function Absolute(props: AbsoluteProps) @{
	<div id={props.id} className={['vx-absolute', props.className]} style={props.style} ref={(el: any) => applyEscapeProps(el, props)}>
		{props.children}
	</div>
}
