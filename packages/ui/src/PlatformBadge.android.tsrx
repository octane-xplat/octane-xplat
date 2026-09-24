/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";
import { cx } from "./cx";
// Suffix-resolution probe: on Android this must win over
// PlatformBadge.native.tsrx (untested — no Android SDK in this env yet).

export function PlatformBadge(props: PlatformBadgeProps) @{
	console.log('[badge] android variant evaluated');

	<label className={cx(props.className)} text={"android"} />
}
