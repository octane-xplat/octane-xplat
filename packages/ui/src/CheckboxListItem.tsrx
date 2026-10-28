/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { mergeStyle } from './style-merge'
import type { CheckboxListItemProps } from './props'
import { applyEscapeProps, nativeAccessibilityState } from './escape-props'
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

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-checkbox-row',
			'vx-checkboxlist-item',
			indicatorScope,
			state === 'checked' && 'vx-checkbox--on',
			disabled && 'vx-checkbox--disabled',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityState={nativeAccessibilityState({ checked: state === 'checked', disabled })}
		onTap={blocked ? undefined : toggle}
	>
		<Ind state={state as any} size={ctx?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
		<masonview
			className="vx-checkbox-label-col"
			style={{ display: 'flex', flexDirection: 'column' }}
		>
			{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
			{props.description != null ? (
				<label className="vx-checkbox-description" text={props.description} />
			) : null}
		</masonview>
		{props.endContent != null ? (
			<masonview className="vx-checkbox-end" style={{ display: 'flex' }}>
				{props.endContent}
			</masonview>
		) : null}
	</masonview>
}
