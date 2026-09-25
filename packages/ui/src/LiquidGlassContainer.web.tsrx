import type { LiquidGlassContainerProps } from './props';
import { applyEscapeProps } from './escape-props';

/** LiquidGlassContainer — merged-glass region. Web has no glass-merge
 *  primitive; renders as the Absolute-equivalent container (`vx-absolute`),
 *  children positioned via left/top. `spacing` is native-only. */
export function LiquidGlassContainer(props: LiquidGlassContainerProps) @{
	<div
		id={props.id}
		className={['vx-absolute', 'vx-glass-container', props.className]}
		style={props.style}
		ref={(el: any) => applyEscapeProps(el, props)}
	>
		{props.children}
	</div>
}
