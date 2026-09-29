/** @jsxImportSource @nativescript-community/octane */
import type { HoverableProps } from './props';
import { cx } from './cx';
import { View } from './View.tsrx';

/** Touch-target leaf: renders the children unchanged and never mounts the
 *  hover card — pointer intent has no touch semantic. A long-press stand-in
 *  is deliberately not provided (the fake-parity trap from decision #44).
 *  Keep essential information out of `card`; the pointer platforms (web,
 *  macOS) carry the real hover surface. */
export function Hoverable(props: HoverableProps) @{
	<View
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		ios={props.ios}
		android={props.android}
	>
		{props.children}
	</View>
}
