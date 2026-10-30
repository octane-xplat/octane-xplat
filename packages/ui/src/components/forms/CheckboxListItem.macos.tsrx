/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { CheckboxListItemProps } from '../../props'
import { CheckboxListContext } from './option-list-contexts'
import { CheckboxIndicator } from './CheckboxIndicator.macos.tsrx'
import { indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'

/** Group members and standalone/select-all rows keep separate value owners. */
export function CheckboxListItem(props: CheckboxListItemProps) @{
	const group = useContext(CheckboxListContext)
	const member = group != null && props.value != null
	const checked = member
		? Array.isArray(group.selected) && group.selected.includes(props.value!)
		: (props.isChecked ?? false)

	const state = checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const disabled = Boolean(group?.isDisabled || props.isDisabled)
	const blocked = disabled || group?.isReadOnly
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const toggle = () => {
		if (blocked) {
			return
		}

		const next = state !== 'checked'
		if (member) {
			group.select?.(props.value!, next)
		} else {
			props.onCheck?.(next)
		}
	}

	<masonview
		id={props.id}
		className={cx(
			'vx-checkbox-row',
			'vx-checkboxlist-item',
			'vx-checkboxlist-row--appkit',
			indicatorScope,
			state === 'checked' && 'vx-checkbox--on',
			disabled && 'vx-checkbox--disabled',
			group?.isReadOnly && 'vx-checkbox--readonly',
			props.className,
		)}
		style={props.style}
		accessibilityRole="checkbox"
		accessibilityLabel={props.label ?? props.value ?? 'Checkbox'}
		accessibilityHint={props.description}
		accessibilityState={{
			checked: state === 'indeterminate' ? 'mixed' : state === 'checked',
			disabled,
			readonly: group?.isReadOnly,
		}}
		onTap={blocked ? undefined : toggle}
	>
		<Ind state={state} size={group?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
		<masonview className="vx-checkboxlist-label--appkit">
			{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
			{props.description != null ? (
				<label className="vx-checkbox-description" text={props.description} />
			) : null}
		</masonview>
		{props.endContent != null ? (
			<masonview className="vx-checkboxlist-end--appkit">{props.endContent}</masonview>
		) : null}
	</masonview>
}
