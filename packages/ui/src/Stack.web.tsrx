import type { StackProps } from './props';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassStyleOf } from './glass';

export function Stack(props: StackProps) @{
	<div id={props.id} className={['vx-stack', glassClassOf(props.glass), props.className]} style={{ ...glassStyleOf(props.glass), ...props.style }} ref={(el: any) => applyEscapeProps(el, props)}>
		{props.children}
	</div>
}
