/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { InputRatingProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.native.tsrx';

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

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-rating', props.disabled && 'vx-rating--disabled', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		@for (const score of Array.from({ length: max }, (_, i) => i + 1); key score) {
			<flexboxlayout
				className={cx('vx-rating-cell', score <= value && 'vx-rating-cell--on')}
				onTap={props.disabled ? undefined : () => setValue(score)}
			>
				{props.icon ? <Icon name={props.icon} /> : <label className="vx-rating-glyph" text="★" />}
			</flexboxlayout>
		}
	</flexboxlayout>
}
