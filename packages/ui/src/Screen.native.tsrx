/** @jsxImportSource @nativescript-community/octane */
import type { ScreenProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { registerRootLayout, unregisterRootLayout } from "./root-layout.native";
// The screen shell is a RootLayout so RootLayout.open() can layer overlays
// over it (decision #22). Self-registers on loaded/unloaded — overlay and
// sheet services mount on the most recently mounted shell (topRootLayout).
export function Screen(props: ScreenProps) @{
	<rootlayout
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		className={cx(props.className)}
		style={props.style}
		onLoaded={(e: any) => registerRootLayout(e.object)}
		onUnloaded={(e: any) => unregisterRootLayout(e.object)}
	>
		{props.children}
	</rootlayout>
}
