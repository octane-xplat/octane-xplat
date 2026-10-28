/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane'
import { mergeStyle } from './style-merge'
import type { SegmentedControlItemProps } from './props'
import { applyEscapeProps, nativeAccessibilityState } from './escape-props'
import { SegmentedControlContext } from './option-list-contexts'

/** `SegmentedControlItem` — one segment inside a `SegmentedControl`
 *  (Astryx child part). Reads selected state from the group context. */
export function SegmentedControlItem(props: SegmentedControlItemProps) @{
	const ctx = useContext(SegmentedControlContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-segment',
			selected && 'vx-segment--on',
			disabled && 'vx-segment--disabled',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityLabel={props.isLabelHidden ? props.label : undefined}
		accessibilityState={nativeAccessibilityState({ selected, disabled })}
		onTap={blocked ? undefined : () => ctx?.select?.(props.value)}
	>
		{props.icon != null ? (
			<masonview className="vx-segment-icon" style={{ display: 'flex' }}>
				{props.icon}
			</masonview>
		) : null}
		{!props.isLabelHidden ? (
			<label className="vx-segment-label" text={props.label ?? props.value} />
		) : null}
	</masonview>
}
