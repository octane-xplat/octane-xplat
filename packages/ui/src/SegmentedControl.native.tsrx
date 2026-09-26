/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { SegmentedControlProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityState } from './escape-props';

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). `value`/`onValueChange` for controlled,
 *  `defaultValue` for uncontrolled. Same classes + geometry as the web
 *  leaf (the platform-authentic widget would be UISegmentedControl /
 *  Material segmented buttons — neither is shared). */
export function SegmentedControl(props: SegmentedControlProps) @{
	const [internal, setInternal] = useState(props.defaultValue);
	const current = props.value ?? internal;
	const select = (value: string) => {
		if (props.value === undefined) setInternal(value);
		props.onValueChange?.(value);
	};

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-segmented', props.disabled && 'vx-segmented--disabled', props.className)}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	>
		{props.options.map((opt: any) => {
			const selected = current === opt.value;
			const disabled = props.disabled || opt.disabled;
			return (
				<flexboxlayout
					key={opt.value}
					className={cx('vx-segment', selected && 'vx-segment--on', disabled && 'vx-segment--disabled')}
					accessibilityState={nativeAccessibilityState({ selected }) as any}
					onTap={disabled ? undefined : () => select(opt.value)}
				>
					<label className="vx-segment-label" text={opt.label ?? opt.value} />
				</flexboxlayout>
			);
		})}
	</flexboxlayout>
}
