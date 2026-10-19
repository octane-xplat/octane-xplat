/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState } from 'octane';
import type { SegmentedControlProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityState } from './escape-props';
import { useFieldControlProps } from './field-context';

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). `value`/`onValueChange` for controlled,
 *  `defaultValue` for uncontrolled. Same classes + geometry as the web
 *  leaf (the platform-authentic widget would be UISegmentedControl /
 *  Material segmented buttons — neither is shared). */
export function SegmentedControl(inputProps: SegmentedControlProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultValue);
	const current = props.value ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const select = (value: string) => {
		if (isBlocked) return;
		if (props.value === undefined) setInternal(value);
		props.onValueChange?.(value);
	};

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-segmented', props.isDisabled && 'vx-segmented--disabled', props.isReadOnly && 'vx-segmented--readonly', props.isLoading && 'vx-segmented--loading', props.status && `vx-segmented--status-${props.status.type}`, props.size && `vx-segmented--size-${props.size}`, props.className)} style={mergeStyle({flexDirection: "row"}, mergeStyle({display: "flex"}, props.style as any))} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}>
		{props.options.map((opt: any) => {
			const selected = current === opt.value;
			const disabled = props.isDisabled || opt.isDisabled;
			return (
				<masonview key={opt.value} className={cx('vx-segment', selected && 'vx-segment--on', disabled && 'vx-segment--disabled')} accessibilityState={nativeAccessibilityState({ selected, disabled }) as any} onTap={disabled ? undefined : () => select(opt.value)} style={{display: "flex"}}>
					<label className="vx-segment-label" text={opt.label ?? opt.value} />
				</masonview>
			);
		})}
	</masonview>
}
