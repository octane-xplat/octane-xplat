/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { CheckboxGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Checkbox } from './Checkbox.native.tsrx';

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
		className={cx('vx-checkbox-group', props.horizontal && 'vx-checkbox-group--row', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		@for (const opt of props.options; key opt.value) {
			<Checkbox
				checked={selected.includes(opt.value)}
				disabled={props.disabled || opt.disabled}
				label={opt.label}
				onCheckedChange={(on: boolean) => toggle(opt.value, on)}
			/>
		}
	</flexboxlayout>
}
