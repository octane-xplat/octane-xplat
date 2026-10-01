/** @jsxImportSource @nativescript-community/octane */
import type { CheckboxProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on tap. */
export function Checkbox(props: CheckboxProps) @{
	const isBlocked = props.isDisabled || props.isReadOnly;
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-checkbox-row', props.checked && 'vx-checkbox--on', props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly', props.isLoading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`, props.size && `vx-checkbox--size-${props.size}`, props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('checkbox') as any}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled, checked: props.checked ?? false }) as any}
		onTap={isBlocked ? undefined : () => props.onCheckedChange?.(!(props.checked ?? false))}
	>
		<flexboxlayout className="vx-checkbox">
			{props.checked ? <label className="vx-checkbox-check" text="✓" /> : null}
		</flexboxlayout>
		{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
	</flexboxlayout>
}
