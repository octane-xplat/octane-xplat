import type { RowProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
export function Row(props: RowProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} className={['vx-row', props.className]} {...layoutChildProps(props)}>
		{props.children}
	</div>
}
