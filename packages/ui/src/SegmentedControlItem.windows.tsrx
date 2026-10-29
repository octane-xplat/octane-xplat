/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useRef } from 'octane'
import type { View } from '@nativescript/core'
import { WindowsRadioContext } from './radio-context.windows'
import { useMeasure } from './useMeasure'
import './radio-control.windows'
import './RadioGroup.windows.css'
import { mergeStyle } from './style-merge'
import type { SegmentedControlItemProps } from './props'
import { applyEscapeProps } from './escape-props'
import { SegmentedControlContext } from './option-list-contexts'

/** `SegmentedControlItem` — one segment inside a `SegmentedControl`
 *  (Astryx child part). Reads selected state from the group context;
 *  standalone renders a presentational segment. */
export function SegmentedControlItem(props: SegmentedControlItemProps) @{
	const ctx = useContext(SegmentedControlContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const group = useContext(WindowsRadioContext)
	const measured = useMeasure()
	const segment = useRef<View | null>(null)
	const bindSegment = useCallback(
		(view: View | null) => {
			segment.current = view
			measured.ref(view)
		},
		[measured.ref],
	)

	useEffect(() => applyEscapeProps(segment.current, props), [props])
	useEffect(() => group?.restore(), [group, selected, disabled, props.value])

	<masonview
		ref={bindSegment}
		id={props.id}
		className={[
			'vx-segment',
			selected && 'vx-segment--on',
			disabled && 'vx-segment--disabled',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.icon != null ? (
			<masonview className="vx-segment-icon" style={{ display: 'flex' }}>
				{props.icon}
			</masonview>
		) : null}
		{!props.isLabelHidden ? (
			<label className="vx-segment-label" text={props.label ?? props.value} />
		) : null}
		{group ? (
			<xplatwindowsradio
				className="vx-radio-input-windows"
				style={{
					position: 'absolute',
					width: measured.bounds?.width ?? 0,
					height: measured.bounds?.height ?? 0,
				}}
				settings={{ group, value: props.value }}
				isEnabled={!disabled}
				accessibilityLabel={props.label ?? props.value}
			/>
		) : null}
	</masonview>
}
