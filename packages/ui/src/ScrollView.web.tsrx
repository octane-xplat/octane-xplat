/** Scroll container — a div with overflow scrolling. Native wraps
 *  children in a column container; web divs already stack vertically. */
export function ScrollView(props: {
	className?: any;
	style?: any;
	id?: string;
	horizontal?: boolean;
	children?: any;
}) @{
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
