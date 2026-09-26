import type { ScrollViewProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { layoutChildProps } from './layout-child.web';
/** Scroll container — a div with overflow scrolling. Native wraps
 *  children in a column container; web divs already stack vertically. */
export function ScrollView(props: ScrollViewProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-scroll', props.className]}
		{...layoutChildProps(props, {
			...(props.horizontal ? { overflowX: 'auto' } : { overflowY: 'auto' }),
			...props.style,
		})}
	>
		{props.children}
	</div>
}
