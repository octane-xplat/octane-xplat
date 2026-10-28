/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext } from 'octane'
import type { RadioListItemProps } from './props'
import { applyWebProps } from './platformProps.web'
import { RadioListContext } from './option-list-contexts'
import { RadioIndicator, indicatorScope } from './indicators'
import { useIndicator } from './use-indicator'

/** `RadioListItem` — one option row inside a `RadioList` (Astryx child
 *  part). Reads the selected value and commit callback from the group's
 *  context; standalone renders a presentational row. */
export function RadioListItem(props: RadioListItemProps) @{
	const ctx = useContext(RadioListContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly
	const Ind = useIndicator('radio') ?? RadioIndicator

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="radio"
		aria-checked={selected}
		aria-disabled={disabled || undefined}
		aria-readonly={ctx?.isReadOnly || undefined}
		tabIndex={disabled ? undefined : 0}
		className={[
			'vx-radio-row',
			'vx-radiolist-item',
			indicatorScope,
			selected && 'vx-radio--on',
			disabled && 'vx-radio--disabled',
			ctx?.isReadOnly && 'vx-radio--readonly',
			props.className,
		]}
		style={props.style}
		onClick={blocked ? undefined : () => ctx?.select?.(props.value)}
		onKeyDown={(e: any) => {
			if (blocked || !ctx?.select) {
				return
			}

			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault()
				ctx.select(props.value)
			}
		}}
	>
		<Ind
			state={selected ? 'checked' : 'unchecked'}
			size={ctx?.size === 'sm' ? 'sm' : 'md'}
			isDisabled={disabled}
		/>
		<span className="vx-radio-label-col">
			{props.label != null ? <span className="vx-radio-label">{props.label}</span> : null}
			{props.description != null ? (
				<span className="vx-radio-description">{props.description}</span>
			) : null}
		</span>
		{props.endContent != null ? <span className="vx-radio-end">{props.endContent}</span> : null}
	</div>
}
