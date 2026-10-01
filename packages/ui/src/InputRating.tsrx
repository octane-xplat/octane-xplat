/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { InputRatingProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { Icon } from './Icon.tsrx';
import { useFieldControlProps } from './field-context';

/** InputRating — row of tappable glyphs reporting a 1..max score. `icon`
 *  names a registered glyph; the default is a ★ text glyph. */
export function InputRating(inputProps: InputRatingProps) @{
	const props = useFieldControlProps(inputProps);
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

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-rating', props.isDisabled && 'vx-rating--disabled', props.isReadOnly && 'vx-rating--readonly', props.isLoading && 'vx-rating--loading', props.status && `vx-rating--status-${props.status.type}`, props.size && `vx-rating--size-${props.size}`, props.className)}
		style={props.style}
	accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
	>
		@for (const score of Array.from({ length: max }, (_, i) => i + 1); key score) {
			<flexboxlayout
				className={cx('vx-rating-cell', score <= value && 'vx-rating-cell--on')}
				onTap={isBlocked ? undefined : () => setValue(score)}
			>
				{props.icon ? <Icon name={props.icon} /> : <label className="vx-rating-glyph" text="★" />}
			</flexboxlayout>
		}
	</flexboxlayout>
}
