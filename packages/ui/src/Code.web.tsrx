import type { CodeProps } from './props';
import { applyEscapeProps } from './escape-props';

/** Code — inline monospace run. `size="inherit"` drops the fixed font-size so
 *  the run adopts its surrounding text metrics; `color` picks the primary,
 *  secondary, or inherited text color. */
export function Code(props: CodeProps) @{
	<code
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-code',
			props.color === 'secondary' && 'vx-color-secondary',
			props.color === 'inherit' && 'vx-code--inherit',
			props.size === 'inherit' && 'vx-code--size-inherit',
			props.className,
		]}
		style={props.style}
	>
		{props.children}
	</code>
}
