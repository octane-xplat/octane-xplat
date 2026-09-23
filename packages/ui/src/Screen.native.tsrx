/** @jsxImportSource @nativescript-community/octane */
import type { ScreenProps } from "./props";
// The screen shell is a RootLayout so getRootLayout().open() can layer
// overlays over it (decision #22).
export function Screen(props: ScreenProps) @{
	<rootlayout className={props.className} style={props.style}>
		{props.children}
	</rootlayout>
}
