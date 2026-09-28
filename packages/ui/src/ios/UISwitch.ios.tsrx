/** @jsxImportSource @nativescript-community/octane */
import type { PlatformWidgetProps, SwitchProps } from "../props";
import { cx } from "../cx";
import { applyEscapeProps } from "../escape-props";

/** UISwitch — the platform widget (UIKit UISwitch via NativeScript `switch`).
 *  OS chrome is the point here; the self-drawn shared `Switch` lives in the
 *  root export. */
export function UISwitch(props: PlatformWidgetProps<SwitchProps>) @{
	<switch
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		checked={props.checked}
		onCheckedChange={(e: any) => props.onCheckedChange?.(e.value)}
	/>
}
