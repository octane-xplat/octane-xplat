import { useState } from 'octane';
import type { CheckboxGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Checkbox } from './Checkbox.web.tsrx';

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

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="group"
		aria-label={props.accessibilityLabel}
		className={['vx-checkbox-group', props.horizontal ? 'vx-checkbox-group--row' : undefined, props.className]}
		style={props.style}
	>
		{props.options.map((opt: any) => (
			<Checkbox
				key={opt.value}
				checked={selected.includes(opt.value)}
				disabled={props.disabled || opt.disabled}
				label={opt.label}
				onCheckedChange={(on: boolean) => toggle(opt.value, on)}
			/>
		))}
	</div>
}
