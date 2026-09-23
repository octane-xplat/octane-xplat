import type { RowProps } from "./props";
export function Row(props: RowProps) @{
	<div className={['vx-row', props.className]} style={props.style}>
		{props.children}
	</div>
}
