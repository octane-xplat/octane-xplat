import { useState } from 'octane';
import type { CheckboxGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Checkbox } from './Checkbox.web.tsrx';
import { useFieldControlProps } from './field-context';

/** CheckboxGroup — multi-select list of self-drawn checkboxes. */
export function CheckboxGroup(inputProps: CheckboxGroupProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? []);
	const controlled = props.value !== undefined;
	const selected = controlled ? props.value! : internal;

	const setSelected = (next: string[]) => {
		if (!controlled) setInternal(next);
		props.onValueChange?.(next);
	};

	const toggle = (v: string, on: boolean) =>
		setSelected(on ? [...selected, v] : selected.filter((x) => x !== v));
	const isReadOnly = props.isReadOnly;

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="group"
		aria-label={props.ariaLabel}
		aria-labelledby={props.ariaLabelledBy}
		aria-describedby={props.ariaDescribedBy}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		className={['vx-checkbox-group', props.horizontal ? 'vx-checkbox-group--row' : undefined, props.isDisabled ? 'vx-checkbox-group--disabled' : undefined, isReadOnly ? 'vx-checkbox-group--readonly' : undefined, props.isLoading ? 'vx-checkbox-group--loading' : undefined, props.status ? `vx-checkbox-group--status-${props.status.type}` : undefined, props.size ? `vx-checkbox-group--size-${props.size}` : undefined, props.className]}
		style={props.style}
	>
		{props.options.map((opt: any) => (
			<Checkbox
				key={opt.value}
				checked={selected.includes(opt.value)}
				isDisabled={props.isDisabled || opt.isDisabled}
				isReadOnly={isReadOnly}
				label={opt.label}
				onCheckedChange={(on: boolean) => toggle(opt.value, on)}
			/>
		))}
	</div>
}
