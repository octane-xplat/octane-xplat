import type { ScrollViewProps } from "./props";
/** Scroll container — a div with overflow scrolling. Native wraps
 *  children in a column container; web divs already stack vertically. */
export function ScrollView(props: ScrollViewProps) @{
	<div
		id={props.id}
		className={['vx-scroll', props.className]}
		style={{
			...(props.horizontal ? { overflowX: 'auto' } : { overflowY: 'auto' }),
			...props.style,
		}}
	>
		{props.children}
	</div>
}
