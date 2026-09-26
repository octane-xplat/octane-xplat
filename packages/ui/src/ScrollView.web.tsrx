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
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		{props.children}
	</div>
}
