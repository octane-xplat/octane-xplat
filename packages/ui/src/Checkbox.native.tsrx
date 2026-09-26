/** @jsxImportSource @nativescript-community/octane */
import type { CheckboxProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole } from "./escape-props";

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on tap. */
export function Checkbox(props: CheckboxProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-checkbox-row', props.checked && 'vx-checkbox--on', props.disabled && 'vx-checkbox--disabled', props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('checkbox') as any}
		accessibilityLabel={props.accessibilityLabel}
		onTap={props.disabled ? undefined : () => props.onCheckedChange?.(!(props.checked ?? false))}
	>
		<flexboxlayout className="vx-checkbox">
			{props.checked ? <label className="vx-checkbox-check" text="✓" /> : null}
		</flexboxlayout>
		{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
	</flexboxlayout>
}
