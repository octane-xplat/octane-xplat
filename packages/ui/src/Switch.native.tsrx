/** @jsxImportSource @nativescript-community/octane */
import type { SwitchProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole } from "./escape-props";

/** Self-drawn switch — flexbox track + thumb view, identical pixels across
 *  targets. The `.vx-switch--on` state class flips justify-content, which
 *  slides the thumb. The platform widget (UISwitch/MaterialSwitch) lives
 *  in `ui/ios` + `ui/android`. */
export function Switch(props: SwitchProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-switch', props.checked ? 'vx-switch--on' : undefined, props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('switch') as any}
		onTap={() => props.onCheckedChange?.(!(props.checked ?? false))}
	>
		<flexboxlayout className="vx-switch-thumb" />
	</flexboxlayout>
}
