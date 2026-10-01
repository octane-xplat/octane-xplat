import type { RadioGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(props: RadioGroupProps) @{
	const isBlocked = props.isDisabled || props.isReadOnly;
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="radiogroup"
		aria-label={props.accessibilityLabel ?? props.label}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={props.isRequired && !props.isOptional || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		className={['vx-radio-group', props.horizontal ? 'vx-radio-group--row' : undefined, props.isDisabled ? 'vx-radio-group--disabled' : undefined, props.isReadOnly ? 'vx-radio-group--readonly' : undefined, props.isLoading ? 'vx-radio-group--loading' : undefined, props.status ? `vx-radio-group--status-${props.status.type}` : undefined, props.size ? `vx-radio-group--size-${props.size}` : undefined, props.className]}
		style={props.style}
	>
		{props.options.map((opt: any) => {
			const selected = props.value === opt.value;
			const disabled = props.isDisabled || opt.isDisabled;
			const blocked = disabled || isBlocked;
			return (
				<div
					key={opt.value}
					role="radio"
					aria-checked={selected}
					aria-disabled={disabled || undefined}
					aria-readonly={props.isReadOnly || undefined}
					tabIndex={disabled ? undefined : 0}
					className={['vx-radio-row', selected ? 'vx-radio--on' : undefined, disabled ? 'vx-radio--disabled' : undefined, props.isReadOnly ? 'vx-radio--readonly' : undefined]}
					onClick={blocked ? undefined : () => props.onValueChange?.(opt.value)}
					onKeyDown={(e: any) => {
						if (blocked) return;
						if (e.key === ' ' || e.key === 'Enter') {
							e.preventDefault();
							props.onValueChange?.(opt.value);
						}
					}}
				>
					<div className="vx-radio" aria-hidden="true">
						{selected ? <div className="vx-radio-dot" /> : null}
					</div>
					{opt.label != null ? <span className="vx-radio-label">{opt.label}</span> : null}
				</div>
			);
		})}
	</div>
}
