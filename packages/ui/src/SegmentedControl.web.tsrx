import { useState } from 'octane';
import type { SegmentedControlProps } from './props';
import { applyWebProps } from './platformProps.web';

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). Radiogroup semantics like RadioGroup: Space/Enter
 *  selects. `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled. Same classes + geometry as the native leaf. */
export function SegmentedControl(props: SegmentedControlProps) @{
	const [internal, setInternal] = useState(props.defaultValue);
	const current = props.value ?? internal;
	const select = (value: string) => {
		if (props.value === undefined) setInternal(value);
		props.onValueChange?.(value);
	};

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="radiogroup"
		aria-label={props.accessibilityLabel}
		aria-disabled={props.disabled || undefined}
		className={['vx-segmented', props.disabled ? 'vx-segmented--disabled' : undefined, props.className]}
		style={props.style}
	>
		{props.options.map((opt: any) => {
			const selected = current === opt.value;
			const disabled = props.disabled || opt.disabled;
			return (
				<div
					key={opt.value}
					role="radio"
					aria-checked={selected}
					aria-disabled={disabled || undefined}
					tabIndex={disabled ? undefined : 0}
					className={['vx-segment', selected ? 'vx-segment--on' : undefined, disabled ? 'vx-segment--disabled' : undefined]}
					onClick={disabled ? undefined : () => select(opt.value)}
					onKeyDown={(e: any) => {
						if (disabled) return;
						if (e.key === ' ' || e.key === 'Enter') {
							e.preventDefault();
							select(opt.value);
						}
					}}
				>
					<span className="vx-segment-label">{opt.label ?? opt.value}</span>
				</div>
			);
		})}
	</div>
}
