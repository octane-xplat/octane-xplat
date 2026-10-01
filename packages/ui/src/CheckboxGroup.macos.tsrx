/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane';
import type { CheckboxGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Checkbox } from './controls.macos.tsrx';

/** CheckboxGroup — multi-select list of self-drawn checkboxes. */
export function CheckboxGroup(props: CheckboxGroupProps) @{
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? []);
	const controlled = props.value !== undefined;
	const selected = controlled ? props.value! : internal;

	const setSelected = (next: string[]) => {
		if (!controlled) setInternal(next);
		props.onValueChange?.(next);
	};

	const toggle = (v: string, on: boolean) =>
		setSelected(on ? [...selected, v] : selected.filter((x) => x !== v));

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection={props.horizontal ? 'row' : 'column'}
		className={cx('vx-checkbox-group', props.horizontal && 'vx-checkbox-group--row', props.isDisabled && 'vx-checkbox-group--disabled', props.isReadOnly && 'vx-checkbox-group--readonly', props.isLoading && 'vx-checkbox-group--loading', props.status && `vx-checkbox-group--status-${props.status.type}`, props.size && `vx-checkbox-group--size-${props.size}`, props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}
	>
		@for (const opt of props.options; key opt.value) {
			<Checkbox
				checked={selected.includes(opt.value)}
				isDisabled={props.isDisabled || opt.isDisabled}
				isReadOnly={props.isReadOnly}
				isLoading={props.isLoading}
				label={opt.label}
				onCheckedChange={(on: boolean) => toggle(opt.value, on)}
			/>
		}
	</flexboxlayout>
}
