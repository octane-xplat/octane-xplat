/** @jsxImportSource @nativescript-community/octane */
import type { SwitchProps } from "../props";
import { cx } from "../cx";
import { applyEscapeProps } from "../escape-props";

/** MaterialSwitch — the platform widget (Material SwitchMaterial via
 *  NativeScript `switch`). OS chrome is the point here; the self-drawn
 *  shared `Switch` lives in the root export. */
export function MaterialSwitch(props: SwitchProps) @{
	<switch
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		checked={props.checked}
		onCheckedChange={(e: any) => props.onCheckedChange?.(e.value)}
	/>
}
