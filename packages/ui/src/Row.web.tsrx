import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
export function Row(props: RowProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} className={['vx-row', props.className]} style={props.style}>
		{props.children}
	</div>
}
