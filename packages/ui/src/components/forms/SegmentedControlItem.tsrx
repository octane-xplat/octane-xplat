/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SegmentedControlItemProps } from '../../props'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { SegmentedControlContext } from './option-list-contexts'

/** `SegmentedControlItem` — one segment inside a `SegmentedControl`
 *  (Astryx child part). Reads selected state from the group context. */
export function SegmentedControlItem(props: SegmentedControlItemProps): unknown @{
	const ctx = useContext(SegmentedControlContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-segment',
			'vx-segment--native',
			props.isLabelHidden && 'vx-segment--icon-only',
			ctx?.isReadOnly && 'vx-segment--readonly',
			selected && 'vx-segment--on',
			disabled && 'vx-segment--disabled',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!disabled}
		accessibilityRole={ctx ? nativeAccessibilityRole('radio') : undefined}
		accessibilityLabel={props.label ?? props.value}
		accessibilityState={ctx ? nativeAccessibilityState({ checked: selected, disabled, readOnly: ctx.isReadOnly }) : undefined}
		onTap={!ctx || blocked ? undefined : () => ctx.select?.(props.value)}
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
