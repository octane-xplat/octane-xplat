/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";
// Suffix-resolution probe: on iOS this must win over PlatformBadge.native.tsrx.

export function PlatformBadge(props: PlatformBadgeProps) @{
	console.log('[badge] ios variant evaluated');
	<label className={props.className} text={"ios"} />
}
