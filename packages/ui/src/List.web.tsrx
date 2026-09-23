import type { ListProps } from "./props";
export function List(props: ListProps) @{
	<div id={props.id} className={['vx-list', props.className]} style={props.style}>
		@for (const item of props.items; key item.id) {
			<>{props.renderItem(item)}</>
		} @empty {
			<>{props.renderEmpty?.()}</>
		}
	</div>
}
