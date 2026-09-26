import type { RadioGroupProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(props: RadioGroupProps) @{
	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="radiogroup"
		aria-label={props.accessibilityLabel}
		className={['vx-radio-group', props.horizontal ? 'vx-radio-group--row' : undefined, props.className]}
		style={props.style}
	>
		{props.options.map((opt: any) => {
			const selected = props.value === opt.value;
			const disabled = props.disabled || opt.disabled;
			return (
				<div
					key={opt.value}
					role="radio"
					aria-checked={selected}
					aria-disabled={disabled || undefined}
					tabIndex={disabled ? undefined : 0}
					className={['vx-radio-row', selected ? 'vx-radio--on' : undefined, disabled ? 'vx-radio--disabled' : undefined]}
					onClick={disabled ? undefined : () => props.onValueChange?.(opt.value)}
					onKeyDown={(e: any) => {
						if (disabled) return;
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
