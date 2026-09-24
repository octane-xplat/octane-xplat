/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";
import { cx } from "./cx";
// Suffix-resolution probe: on iOS this must win over PlatformBadge.native.tsrx.

export function PlatformBadge(props: PlatformBadgeProps) @{
	console.log('[badge] ios variant evaluated');

	<label className={cx(props.className)} text={"ios"} />
}
