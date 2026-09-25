/** @jsxImportSource @nativescript-community/octane */
import type { ScreenProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { registerRootLayout, unregisterRootLayout } from "./root-layout.native";
// The screen shell is a RootLayout so RootLayout.open() can layer overlays
// over it (decision #22). Self-registers on loaded/unloaded — overlay and
// sheet services mount on the most recently mounted shell (topRootLayout).
// Children go in a single inner column flexbox: RootLayout gives EVERY
// direct child the full root bounds — siblings stack in document order and
// a later sibling's invisible area eats taps meant for earlier ones
// (measured: pushed demo pages' header Row got the full 670pt root height,
// dead under the content View's overlap). One inner child = one bounds slot.
export function Screen(props: ScreenProps) @{
	<rootlayout
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		onLoaded={(e: any) => registerRootLayout(e.object)}
		onUnloaded={(e: any) => unregisterRootLayout(e.object)}
	>
		<flexboxlayout
			flexDirection="column"
			className={cx(props.className)}
			style={props.style}
		>
			{props.children}
		</flexboxlayout>
	</rootlayout>
}
