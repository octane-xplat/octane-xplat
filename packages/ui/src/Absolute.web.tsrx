import type { AbsoluteProps } from './props';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassStyleOf } from './glass';

export function Absolute(props: AbsoluteProps) @{
	<div id={props.id} className={['vx-absolute', glassClassOf(props.glass), props.className]} style={{ ...glassStyleOf(props.glass), ...props.style }} ref={(el: any) => applyEscapeProps(el, props)}>
		{props.children}
	</div>
}
