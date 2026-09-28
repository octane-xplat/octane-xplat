/** @jsxImportSource @nativescript-community/octane */
import type { SeparatorProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Separator — hairline rule. `orientation` picks which axis it spans;
 *  thickness/color come from the app's `vx-separator` styling. */
export function Separator(props: SeparatorProps) @{
	const vertical = props.orientation === 'vertical';

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-separator', vertical ? 'vx-separator--v' : 'vx-separator--h', props.className)}
		style={props.style}
	/>
}
