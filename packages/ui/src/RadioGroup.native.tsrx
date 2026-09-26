/** @jsxImportSource @nativescript-community/octane */
import type { RadioGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Selecting an option calls `onValueChange`. */
export function RadioGroup(props: RadioGroupProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection={props.horizontal ? 'row' : 'column'}
		className={cx('vx-radio-group', props.horizontal && 'vx-radio-group--row', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.options.map((opt: any) => {
			const selected = props.value === opt.value;
			const disabled = props.disabled || opt.disabled;
			return (
				<flexboxlayout
					key={opt.value}
					className={cx('vx-radio-row', selected && 'vx-radio--on', disabled && 'vx-radio--disabled')}
					onTap={disabled ? undefined : () => props.onValueChange?.(opt.value)}
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
