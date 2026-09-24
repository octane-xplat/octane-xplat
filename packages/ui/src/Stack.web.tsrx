import type { StackProps } from './props';
import { applyEscapeProps } from './escape-props';

export function Stack(props: StackProps) @{
	<div className={['vx-stack', props.className]} style={props.style} ref={(el: any) => applyEscapeProps(el, props)}>
		{props.children}
	</div>
}
