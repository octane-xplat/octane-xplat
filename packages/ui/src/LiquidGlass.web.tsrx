import type { LiquidGlassProps } from './props';
import { applyEscapeProps } from './escape-props';
import { glassClassOf, glassStyleOf } from './glass';

/** LiquidGlass — web approximation: glass material via backdrop-filter
 *  over a stack-shaped grid (matches the native GridLayout host).
 *  `interactive`/`animateChangeDuration` have no web analog. */
export function LiquidGlass(props: LiquidGlassProps) @{
	<div
		id={props.id}
		className={['vx-stack', glassClassOf({ variant: props.variant ?? 'regular' }), props.className]}
		style={{ ...glassStyleOf({ tint: props.tint }), ...props.style }}
		ref={(el: any) => applyEscapeProps(el, props)}
	>
		{props.children}
	</div>
}
