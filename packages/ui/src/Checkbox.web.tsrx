import type { CheckboxProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { useFieldControlProps } from './field-context';

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on click, Space, and Enter. The platform look (if wanted) is an
 *  app's own choice — there is no OS checkbox widget in the subpaths. */
export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const toggle = () => {
		if (!isBlocked) props.onCheckedChange?.(!(props.checked ?? false));
	};

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="checkbox"
		aria-checked={props.checked ?? false}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={props.isRequired && !props.isOptional || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		aria-label={props.ariaLabel}
		aria-labelledby={props.ariaLabelledBy}
		aria-describedby={props.ariaDescribedBy}
		tabIndex={props.isDisabled ? undefined : 0}
		className={['vx-checkbox-row', props.checked ? 'vx-checkbox--on' : undefined, props.isDisabled ? 'vx-checkbox--disabled' : undefined, props.isReadOnly ? 'vx-checkbox--readonly' : undefined, props.isLoading ? 'vx-checkbox--loading' : undefined, props.status ? `vx-checkbox--status-${props.status.type}` : undefined, props.size ? `vx-checkbox--size-${props.size}` : undefined, props.className]}
		style={props.style}
		onClick={isBlocked ? undefined : toggle}
		onKeyDown={(e: any) => {
			if (isBlocked) return;
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				toggle();
			}
		}}
	>
		<div className="vx-checkbox" aria-hidden="true">
			{props.checked ? <span className="vx-checkbox-check">✓</span> : null}
		</div>
		{props.label != null ? <span className="vx-checkbox-label">{props.label}</span> : null}
	</div>
}
