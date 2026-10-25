/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane'
import { mergeStyle } from './style-merge'
import type { RadioListItemProps } from './props'
import { applyEscapeProps, nativeAccessibilityState } from './escape-props'
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

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-radio-row', 'vx-radiolist-item', indicatorScope, selected && 'vx-radio--on', disabled && 'vx-radio--disabled', props.className]}
		style={mergeStyle({display: "flex"}, props.style)}
		accessibilityState={nativeAccessibilityState({ selected, disabled })}
		onTap={blocked ? undefined : () => ctx?.select?.(props.value)}
	>
		<Ind state={selected ? 'checked' : 'unchecked'} size={ctx?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
		<masonview className="vx-radio-label-col" style={{display: "flex", flexDirection: "column"}}>
			{props.label != null ? <label className="vx-radio-label" text={props.label} /> : null}
			{props.description != null ? <label className="vx-radio-description" text={props.description} /> : null}
		</masonview>
		{props.endContent != null ? <masonview className="vx-radio-end" style={{display: "flex"}}>{props.endContent}</masonview> : null}
	</masonview>
}
