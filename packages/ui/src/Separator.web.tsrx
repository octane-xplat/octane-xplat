import type { SeparatorProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Separator — hairline rule. `orientation` picks which axis it spans;
 *  thickness/color come from the app's `vx-separator` styling. */
export function Separator(props: SeparatorProps) @{
	const vertical = props.orientation === 'vertical';

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="separator"
		aria-orientation={vertical ? 'vertical' : 'horizontal'}
		className={['vx-separator', vertical ? 'vx-separator--v' : 'vx-separator--h', props.className]}
		style={props.style}
	/>
}
