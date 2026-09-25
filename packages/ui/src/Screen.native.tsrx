/** @jsxImportSource @nativescript-community/octane */
import type { ScreenProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
// The screen shell is a RootLayout so getRootLayout().open() can layer
// overlays over it (decision #22).
export function Screen(props: ScreenProps) @{
	<rootlayout id={props.id} ref={(v: any) => applyEscapeProps(v, props)} className={cx(props.className)} style={props.style}>
		{props.children}
	</rootlayout>
}
