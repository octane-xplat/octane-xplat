/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState } from 'octane'
import type { SegmentedControlProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { useFieldControlProps } from './field-context'
import { SegmentedControlProvider } from './option-list-contexts'

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). Options come from `options` or `SegmentedControlItem`
 *  children; `layout="fill"` stretches segments to the full width. */
export function SegmentedControl(inputProps: SegmentedControlProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const select = (value: string) => {
		if (isBlocked) {
			return
		}

		if (props.value === undefined) {
			setInternal(value)
		}

		props.onValueChange?.(value)
	}

	const ctx = {
		selected: current as string | undefined,
		select,
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-segmented',
			props.layout === 'fill' && 'vx-segmented--fill',
			props.isDisabled && 'vx-segmented--disabled',
			props.isReadOnly && 'vx-segmented--readonly',
			props.isLoading && 'vx-segmented--loading',
			props.status && `vx-segmented--status-${props.status.type}`,
			props.size && `vx-segmented--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
	>
		{(props.options ?? []).map((opt: any) => {
			const selected = current === opt.value
			const disabled = props.isDisabled || opt.isDisabled
			return (
				<masonview
					key={opt.value}
					className={cx(
						'vx-segment',
						selected && 'vx-segment--on',
						disabled && 'vx-segment--disabled',
					)}
					accessibilityState={nativeAccessibilityState({ selected, disabled })}
					onTap={disabled ? undefined : () => select(opt.value)}
					style={{ display: 'flex' }}
				>
					<label className="vx-segment-label" text={opt.label ?? opt.value} />
				</masonview>
			)
		})}
		{props.children != null ? (
			<SegmentedControlProvider value={ctx}>{props.children}</SegmentedControlProvider>
		) : null}
	</masonview>
}
