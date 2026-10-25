/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { RadioGroupProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { useFieldControlProps } from './field-context';

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(inputProps: RadioGroupProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultValue);
	const current = props.value ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const select = (value: string) => {
		if (props.value === undefined) setInternal(value);
		props.onValueChange?.(value);
	};

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-radio-group', props.horizontal && 'vx-radio-group--row', props.isDisabled && 'vx-radio-group--disabled', props.isReadOnly && 'vx-radio-group--readonly', props.isLoading && 'vx-radio-group--loading', props.status && `vx-radio-group--status-${props.status.type}`, props.size && `vx-radio-group--size-${props.size}`, props.className)} style={mergeStyle({flexDirection: props.horizontal ? 'row' : 'column'}, mergeStyle({display: "flex"}, props.style))} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}>
		{(props.options ?? []).map((opt: any) => {
			const selected = current === opt.value;
			const disabled = props.isDisabled || opt.isDisabled;
			const blocked = disabled || isBlocked;
			return (
				<masonview key={opt.value} className={cx('vx-radio-row', selected && 'vx-radio--on', disabled && 'vx-radio--disabled', props.isReadOnly && 'vx-radio--readonly')} accessibilityState={{ selected, disabled, readonly: props.isReadOnly }} onTap={blocked ? undefined : () => select(opt.value)} style={mergeStyle({flexDirection: "row", alignItems: "center", gap: 8}, {display: "flex"})}>
					{/* circle/dot metrics are CSS on web — inline them here
					   (AppKit has no style layer); keep in step with .vx-radio */}
					<masonview className="vx-radio" style={mergeStyle({alignItems: "center", justifyContent: "center"}, mergeStyle({display: "flex"}, {
							width: 18,
							height: 18,
							borderWidth: 1,
							borderColor: selected ? '#171717' : '#d4d4d4',
							borderRadius: 9,
						}))}>
						{selected ? <masonview className="vx-radio-dot" style={mergeStyle({display: "flex"}, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#171717' })}/> : null}
					</masonview>
					{opt.label != null ? <label className="vx-radio-label" text={opt.label} /> : null}
				</masonview>
			);
		})}
	</masonview>
}
