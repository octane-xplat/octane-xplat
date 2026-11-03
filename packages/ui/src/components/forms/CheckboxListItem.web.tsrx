/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext, useId } from 'octane'
import type { CheckboxListItemProps } from '../../props'
import { CheckboxListContext } from './option-list-contexts'
import { FieldProvider } from './field-context'
import { ListItem } from '../collections/ListItem.web.tsrx'
import { Checkbox } from './Checkbox.web.tsrx'
import { useTranslator } from '../../internal/platform/internationalization'
import type { JSX } from 'octane/jsx-runtime'

/** `CheckboxListItem` — one row inside a `CheckboxList` (Astryx child
 *  part). With `value` it joins the group's checked set; without it,
 *  `isChecked`/`onCheck` drive a standalone item (select-all pattern).
 *  A string `label` names the checkbox through its hidden `<label>`; rich
 *  content names it from the visible label element via `aria-labelledby`,
 *  the hidden label then carries the generic word "Checkbox". The row is
 *  a `ListItem` whose surface clicks delegate to the checkbox — the sole
 *  focusable control. */
export function CheckboxListItem(props: CheckboxListItemProps): JSX.Element @{
	const ctx = useContext(CheckboxListContext)
	const groupMode = props.value != null && ctx != null
	const checked = groupMode
		? Array.isArray(ctx!.selected) && (ctx!.selected as string[]).includes(props.value!)
		: (props.isChecked ?? false)

	const state = checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly
	const t = useTranslator()
	const labelID = useId()
	const inputId = useId()

	const isRichLabel = props.label != null && typeof props.label !== 'string'
	const namesFromVisibleLabel = isRichLabel && props.accessibilityLabel == null
	const checkboxLabel =
		props.accessibilityLabel ??
		(isRichLabel ? t('@astryx.checkboxList.item.checkbox') : (props.label as string))

	const toggle = () => {
		if (blocked) {
			return
		}

		if (groupMode) {
			ctx!.select?.(props.value!, state !== 'checked')
		} else {
			props.onCheck?.(state !== 'checked')
		}
	}

	<ListItem
		id={props.id}
		className={['vx-checkboxlist-item', props.className]}
		style={props.style}
		web={props.web}
		label={
			namesFromVisibleLabel ? <span id={labelID}>{props.label as any}</span> : (props.label as any)
		}
		description={props.description}
		endContent={props.endContent}
		isDisabled={disabled}
		delegateRef={
			blocked
				? undefined
				: {
						current: {
							click: () => (document.getElementById(inputId) as any)?.click(),
							focus: () => (document.getElementById(inputId) as any)?.focus(),
						},
					}
		}
		startContent={
			// Detach the group's Field context: the item checkbox owns its own
			// hidden label (Astryx CheckboxInput renders `label`+`isLabelHidden`
			// even inside CheckboxList's Field).
			<FieldProvider value={null}>
				<Checkbox
					id={inputId}
					value={state === 'indeterminate' ? 'indeterminate' : state === 'checked'}
					label={checkboxLabel}
					isLabelHidden
					isDisabled={disabled}
					isReadOnly={ctx?.isReadOnly}
					size={ctx?.size === 'sm' ? 'sm' : 'md'}
					web={namesFromVisibleLabel ? { 'aria-labelledby': labelID } : undefined}
					onChange={() => toggle()}
				/>
			</FieldProvider>
		}
	/>
}
