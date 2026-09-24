/** @jsxImportSource @nativescript-community/octane */
import type { SwitchProps } from "./props";
import { cx } from "./cx";
export function Switch(props: SwitchProps) @{
	<switch
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		checked={props.checked}
		onCheckedChange={(e: any) => props.onCheckedChange?.(e.value)}
	/>
}
