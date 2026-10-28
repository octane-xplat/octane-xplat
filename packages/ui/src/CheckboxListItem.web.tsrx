import { useContext } from 'octane'
import type { CheckboxListItemProps } from './props'
import { applyWebProps } from './platformProps.web'
import { CheckboxListContext } from './option-list-contexts'
import { CheckboxIndicator, indicatorScope } from './indicators'
import { useIndicator } from './use-indicator'

/** `CheckboxListItem` — one row inside a `CheckboxList` (Astryx child
 *  part). With `value` it joins the group's checked set; without it,
 *  `isChecked`/`onCheck` drive a standalone item (select-all pattern). */
export function CheckboxListItem(props: CheckboxListItemProps) @{
	const ctx = useContext(CheckboxListContext)
	const groupMode = props.value != null && ctx != null
	const checked = groupMode
		? Array.isArray(ctx!.selected) && (ctx!.selected as string[]).includes(props.value!)
		: (props.isChecked ?? false)

	const state = checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const toggle = () => {
		if (groupMode) {
			ctx!.select?.(props.value!, state !== 'checked')
		} else {
			props.onCheck?.(state !== 'checked')
		}
	}

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="checkbox"
		aria-checked={state === 'indeterminate' ? 'mixed' : state === 'checked'}
		aria-disabled={disabled || undefined}
		aria-readonly={ctx?.isReadOnly || undefined}
		tabIndex={disabled ? undefined : 0}
		className={[
			'vx-checkbox-row',
			'vx-checkboxlist-item',
			indicatorScope,
			state === 'checked' && 'vx-checkbox--on',
			disabled && 'vx-checkbox--disabled',
			ctx?.isReadOnly && 'vx-checkbox--readonly',
			props.className,
		]}
		style={props.style}
		onClick={blocked ? undefined : toggle}
		onKeyDown={(e: any) => {
			if (blocked) {
				return
			}

			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault()
				toggle()
			}
		}}
	>
		<Ind state={state as any} size={ctx?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
		<span className="vx-checkbox-label-col">
			{props.label != null ? <span className="vx-checkbox-label">{props.label}</span> : null}
			{props.description != null ? (
				<span className="vx-checkbox-description">{props.description}</span>
			) : null}
		</span>
		{props.endContent != null ? <span className="vx-checkbox-end">{props.endContent}</span> : null}
	</div>
}
