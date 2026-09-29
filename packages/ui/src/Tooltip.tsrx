/** @jsxImportSource @nativescript-community/octane */
import type { TooltipProps } from './props';
import { cx } from './cx';
import { View } from './View.tsrx';

/** Touch-target leaf: renders the trigger unchanged and never mounts the
 *  hint layer — hover/focus intent has no touch semantic (decision #47,
 *  revised). Keep essential information out of `content`; the pointer
 *  platforms (web, macOS) carry the real hover surface. */
export function Tooltip(props: TooltipProps) @{
	<View
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		ios={props.ios}
		android={props.android}
	>
		{props.trigger}
	</View>
}
