/** @jsxImportSource @nativescript-community/octane */
import type { CheckboxProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { useIndicator, CheckboxIndicator, indicatorScope } from './indicators';

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on tap. */
export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator;
	const indState = props.indeterminate ? 'indeterminate' : props.checked ? 'checked' : 'unchecked';

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-checkbox-row', indicatorScope, props.checked && 'vx-checkbox--on', props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly', props.isLoading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`, props.size && `vx-checkbox--size-${props.size}`, props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('checkbox') as any}
	accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
	accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.indeterminate ? 'Partially selected' : undefined}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled, checked: props.indeterminate ? undefined : props.checked ?? false }) as any}
		onTap={isBlocked ? undefined : () => props.onCheckedChange?.(props.indeterminate ? true : !(props.checked ?? false))}
	>
		<Ind state={indState} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
		{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
	</flexboxlayout>
}
