/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { CheckboxProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { CheckboxIndicator, indicatorScope } from './indicators';
import { useIndicator } from './use-indicator';

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on tap. */
export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultChecked ?? false);
	const checked = props.checked ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator;
	const indState = props.indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
	const toggle = () => {
		const next = props.indeterminate ? true : !checked;
		if (props.checked === undefined) setInternal(next);
		props.onCheckedChange?.(next);
	};

	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-checkbox-row', indicatorScope, checked && 'vx-checkbox--on', props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly', props.isLoading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`, props.size && `vx-checkbox--size-${props.size}`, props.className)} style={props.style as any} accessibilityRole={nativeAccessibilityRole('checkbox') as any} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityValue={props.indeterminate ? 'Partially selected' : undefined} accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled, checked: props.indeterminate ? undefined : checked }) as any} onTap={isBlocked ? undefined : toggle}>
		<Ind state={indState} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
		{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
	</masonview>
}
