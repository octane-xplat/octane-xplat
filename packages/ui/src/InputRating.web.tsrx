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

	const setValue = (n: number) => {
		if (props.disabled) return;
		if (!controlled) setInternal(n);
		props.onValueChange?.(n);
	};

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-rating', props.disabled ? 'vx-rating--disabled' : undefined, props.className]}
		style={props.style}
		role="radiogroup"
		aria-label={props.accessibilityLabel}
	>
		{Array.from({ length: max }, (_, i) => {
			const score = i + 1;
			const on = score <= value;
			return (
				<span
					key={i}
					role="radio"
					aria-checked={on}
					tabIndex={props.disabled ? undefined : 0}
					className={['vx-rating-cell', on ? 'vx-rating-cell--on' : undefined]}
					onClick={props.disabled ? undefined : () => setValue(score)}
					onKeyDown={(e: any) => {
						if (props.disabled) return;
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
