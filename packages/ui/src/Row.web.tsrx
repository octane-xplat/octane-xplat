import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { glassClassOf, glassStyleOf } from './glass';
import { layoutChildProps } from './layout-child.web';
export function Row(props: RowProps) @{
	<div id={props.id} ref={(e: any) => applyEscapeProps(e, props)} className={['vx-row', glassClassOf(props.glass), props.className]} {...layoutChildProps(props, { ...glassStyleOf(props.glass), ...props.style })}>
		{props.children}
	</div>
}
