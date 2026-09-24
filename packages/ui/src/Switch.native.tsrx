/** @jsxImportSource @nativescript-community/octane */
import type { SwitchProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
export function Switch(props: SwitchProps) @{
	<switch
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		checked={props.checked}
		onCheckedChange={(e: any) => props.onCheckedChange?.(e.value)}
	/>
}
