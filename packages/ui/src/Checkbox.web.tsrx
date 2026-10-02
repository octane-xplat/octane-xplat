import type { CheckboxProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { useFieldControlProps } from './field-context';
import { useIndicator, CheckboxIndicator, indicatorScope } from './indicators';

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on click, Space, and Enter. The platform look (if wanted) is an
 *  app's own choice — there is no OS checkbox widget in the subpaths. */
export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator;
	const indState = props.indeterminate ? 'indeterminate' : props.checked ? 'checked' : 'unchecked';
	const toggle = () => {
		if (!isBlocked) props.onCheckedChange?.(props.indeterminate ? true : !(props.checked ?? false));
	};

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="checkbox"
		aria-checked={props.indeterminate ? 'mixed' : props.checked ?? false}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={props.isRequired && !props.isOptional || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		aria-label={props.ariaLabel}
		aria-labelledby={props.ariaLabelledBy}
		aria-describedby={props.ariaDescribedBy}
		aria-description={props.accessibilityHint}
		tabIndex={props.isDisabled ? undefined : 0}
		className={['vx-checkbox-row', indicatorScope, props.checked ? 'vx-checkbox--on' : undefined, props.isDisabled ? 'vx-checkbox--disabled' : undefined, props.isReadOnly ? 'vx-checkbox--readonly' : undefined, props.isLoading ? 'vx-checkbox--loading' : undefined, props.status ? `vx-checkbox--status-${props.status.type}` : undefined, props.size ? `vx-checkbox--size-${props.size}` : undefined, props.className]}
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
		<Ind state={indState} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
		{props.label != null ? <span className="vx-checkbox-label">{props.label}</span> : null}
	</div>
}
