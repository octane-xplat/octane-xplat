/** @jsxImportSource @xplat/macos/renderer */
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
					flexDirection="row"
					alignItems="center"
					gap={8}
					className={cx('vx-radio-row', selected && 'vx-radio--on', disabled && 'vx-radio--disabled')}
					onTap={disabled ? undefined : () => props.onValueChange?.(opt.value)}
				>
					{/* circle/dot metrics are CSS on web — inline them here
					   (AppKit has no style layer); keep in step with .vx-radio */}
					<flexboxlayout
						className="vx-radio"
						alignItems="center"
						justifyContent="center"
						style={{
							width: 18,
							height: 18,
							borderWidth: 1,
							borderColor: selected ? '#171717' : '#d4d4d4',
							borderRadius: 9,
						}}
					>
						{selected ? <flexboxlayout className="vx-radio-dot" style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#171717' }} /> : null}
					</flexboxlayout>
					{opt.label != null ? <label className="vx-radio-label" text={opt.label} /> : null}
				</flexboxlayout>
			);
		})}
	</flexboxlayout>
}
