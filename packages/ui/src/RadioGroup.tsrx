/** @jsxImportSource @nativescript-community/octane */
import type { RadioGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(props: RadioGroupProps) @{
	const isBlocked = props.isDisabled || props.isReadOnly;
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection={props.horizontal ? 'row' : 'column'}
		className={cx('vx-radio-group', props.horizontal && 'vx-radio-group--row', props.isDisabled && 'vx-radio-group--disabled', props.isReadOnly && 'vx-radio-group--readonly', props.isLoading && 'vx-radio-group--loading', props.status && `vx-radio-group--status-${props.status.type}`, props.size && `vx-radio-group--size-${props.size}`, props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
	>
		{props.options.map((opt: any) => {
			const selected = props.value === opt.value;
			const disabled = props.isDisabled || opt.isDisabled;
			const blocked = disabled || isBlocked;
			return (
				<flexboxlayout
					key={opt.value}
					className={cx('vx-radio-row', selected && 'vx-radio--on', disabled && 'vx-radio--disabled', props.isReadOnly && 'vx-radio--readonly')}
					onTap={blocked ? undefined : () => props.onValueChange?.(opt.value)}
				>
					<flexboxlayout className="vx-radio">
						{selected ? <flexboxlayout className="vx-radio-dot" /> : null}
					</flexboxlayout>
					{opt.label != null ? <label className="vx-radio-label" text={opt.label} /> : null}
				</flexboxlayout>
			);
		})}
	</flexboxlayout>
}
