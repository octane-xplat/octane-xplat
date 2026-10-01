import { useState } from 'octane';
import type { InputRatingProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** InputRating — row of tappable glyphs reporting a 1..max score. `icon`
 *  names a registered glyph; the default is a ★ text glyph. */
export function InputRating(props: InputRatingProps) @{
	const max = props.max ?? 5;
	const [internal, setInternal] = useState(props.defaultValue ?? 0);
	const controlled = props.value !== undefined;
	const value = controlled ? props.value! : internal;
	const isBlocked = props.isDisabled || props.isReadOnly;

	const setValue = (n: number) => {
		if (isBlocked) return;
		if (!controlled) setInternal(n);
		props.onValueChange?.(n);
	};

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-rating', props.isDisabled ? 'vx-rating--disabled' : undefined, props.isReadOnly ? 'vx-rating--readonly' : undefined, props.isLoading ? 'vx-rating--loading' : undefined, props.status ? `vx-rating--status-${props.status.type}` : undefined, props.size ? `vx-rating--size-${props.size}` : undefined, props.className]}
		style={props.style}
		role="radiogroup"
		aria-label={props.accessibilityLabel ?? props.label}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={props.isRequired && !props.isOptional || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
	>
		{Array.from({ length: max }, (_, i) => {
			const score = i + 1;
			const on = score <= value;
			return (
				<span
					key={i}
					role="radio"
					aria-checked={on}
					aria-readonly={props.isReadOnly || undefined}
					tabIndex={props.isDisabled ? undefined : 0}
					className={['vx-rating-cell', on ? 'vx-rating-cell--on' : undefined]}
					onClick={isBlocked ? undefined : () => setValue(score)}
					onKeyDown={(e: any) => {
						if (isBlocked) return;
						if (e.key === ' ' || e.key === 'Enter') {
							e.preventDefault();
							setValue(score);
						}
					}}
				>
					{props.icon ? <Icon name={props.icon} /> : <span className="vx-rating-glyph">★</span>}
				</span>
			);
		})}
	</div>
}
