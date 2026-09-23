/** @jsxImportSource @nativescript-community/octane */
import type { PlatformBadgeProps } from "./props";

export function PlatformBadge(props: PlatformBadgeProps) @{
	<label className={props.className} text={"ios|android"} />
}
