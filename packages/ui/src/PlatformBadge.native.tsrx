/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";
import { cx } from "./cx";

export function PlatformBadge(props: PlatformBadgeProps) @{
	<label className={cx(props.className)} text={"ios|android"} />
}
