/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";
// Suffix-resolution probe: on Android this must win over
// PlatformBadge.native.tsrx (untested — no Android SDK in this env yet).

export function PlatformBadge(props: PlatformBadgeProps) @{
	console.log('[badge] android variant evaluated');
	<label className={props.className} text={"android"} />
}
