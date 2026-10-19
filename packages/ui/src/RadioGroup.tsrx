/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { RadioGroupProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { RadioIndicator, indicatorScope } from './indicators';
import { useIndicator } from './use-indicator';

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(inputProps: RadioGroupProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultValue);
	const current = props.value ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const Ind = useIndicator('radio') ?? RadioIndicator;
	const select = (value: string) => {
		if (props.value === undefined) setInternal(value);
		props.onValueChange?.(value);
	};

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-radio-group', props.horizontal && 'vx-radio-group--row', props.isDisabled && 'vx-radio-group--disabled', props.isReadOnly && 'vx-radio-group--readonly', props.isLoading && 'vx-radio-group--loading', props.status && `vx-radio-group--status-${props.status.type}`, props.size && `vx-radio-group--size-${props.size}`, props.className)} style={mergeStyle({flexDirection: props.horizontal ? 'row' : 'column'}, mergeStyle({display: "flex"}, props.style))} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}>
		{props.options.map((opt: any) => {
			const selected = current === opt.value;
			const disabled = props.isDisabled || opt.isDisabled;
			const blocked = disabled || isBlocked;
			return (
				<masonview key={opt.value} className={cx('vx-radio-row', indicatorScope, selected && 'vx-radio--on', disabled && 'vx-radio--disabled', props.isReadOnly && 'vx-radio--readonly')} onTap={blocked ? undefined : () => select(opt.value)} style={{display: "flex"}}>
					<Ind state={selected ? 'checked' : 'unchecked'} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
					{opt.label != null ? <label className="vx-radio-label" text={opt.label} /> : null}
				</masonview>
			);
		})}
	</masonview>
}
