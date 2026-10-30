/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useContext, useEffect, useRef } from 'octane'
import type { SegmentedControlItemProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import { AppKitSegmentedContext } from '../actions/segmented-control-context.macos'

/** Self-drawn AppKit segment with selection and scoped keyboard registration. */
export function SegmentedControlItem(props: SegmentedControlItemProps) @{
	const ctx = useContext(AppKitSegmentedContext)
	const selected = ctx?.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly
	const view = useRef<NSView | null>(null)
	const live = useRef({ props, ctx, blocked })
	live.current = { props, ctx, blocked }
	useEffect(() => {
		const segment = view.current
		if (!segment || !ctx) {
			return
		}

		ctx.segments.set(segment, () => ({
			view: segment,
			value: live.current.props.value,
			disabled: Boolean(live.current.blocked),
			select: () => live.current.ctx?.select?.(live.current.props.value),
		}))

		return () => {
			ctx.segments.delete(segment)
		}
	}, [ctx?.segments])

	<masonview
		ref={(element: NSView | null) => {
			view.current = element
		}}
		id={props.id}
		className={cx(
			'vx-segment',
			selected && 'vx-segment--on',
			disabled && 'vx-segment--disabled',
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityRole="radio"
		accessibilityLabel={props.label ?? props.value}
		accessibilityState={{ checked: selected, selected, disabled }}
		onTap={blocked ? undefined : () => ctx?.select?.(props.value)}
	>
		@if (props.icon != null) {
			<masonview className="vx-segment-icon" style={{ display: 'flex' }}>
				{props.icon}
			</masonview>
		}
		@if (!props.isLabelHidden) {
			<label className="vx-segment-label" text={props.label ?? props.value} />
		}
	</masonview>
}
