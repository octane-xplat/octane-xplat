import { useContext } from 'octane'
import type { SegmentedControlItemProps } from './props'
import { applyWebProps } from './platformProps.web'
import { SegmentedControlContext } from './option-list-contexts'

/** `SegmentedControlItem` — one segment inside a `SegmentedControl`
 *  (Astryx child part). Reads selected state from the group context. */
export function SegmentedControlItem(props: SegmentedControlItemProps) @{
	const ctx = useContext(SegmentedControlContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="radio"
		aria-checked={selected}
		aria-disabled={disabled || undefined}
		aria-label={props.isLabelHidden ? props.label : undefined}
		tabIndex={disabled ? undefined : 0}
		className={['vx-segment', selected && 'vx-segment--on', disabled && 'vx-segment--disabled', props.isLabelHidden && 'vx-segment--icon-only', props.className]}
		style={props.style}
		onClick={blocked ? undefined : () => ctx?.select?.(props.value)}
		onKeyDown={(e: any) => {
			if (blocked || !ctx?.select) return
			if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ctx.select(props.value) }
		}}
	>
		{props.icon != null ? <span className="vx-segment-icon" aria-hidden="true">{props.icon}</span> : null}
		{!props.isLabelHidden ? <span className="vx-segment-label">{props.label ?? props.value}</span> : null}
	</div>
}
