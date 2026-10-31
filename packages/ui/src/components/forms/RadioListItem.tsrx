/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { RadioListItemProps } from '../../props'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { RadioListContext } from './option-list-contexts'
import { RadioIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'

/** `RadioListItem` — one option row inside a `RadioList` (Astryx child
 *  part). Reads the selected value and commit callback from the group's
 *  context; standalone renders a presentational row. */
export function RadioListItem(props: RadioListItemProps): unknown @{
	const ctx = useContext(RadioListContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const blocked = disabled || ctx?.isReadOnly
	const Ind = useIndicator('radio') ?? RadioIndicator

	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={[
			'vx-radio-row',
			'vx-radiolist-item',
			indicatorScope,
			selected && 'vx-radio--on',
			disabled && 'vx-radio--disabled',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!disabled}
		accessibilityRole={ctx ? nativeAccessibilityRole('radio') : undefined}
		accessibilityLabel={props.label ?? props.value}
		accessibilityHint={props.description}
		accessibilityState={ctx ? nativeAccessibilityState({ checked: selected, disabled, readOnly: ctx.isReadOnly }) : undefined}
		onTap={!ctx || blocked ? undefined : () => ctx.select?.(props.value)}
	>
		<Ind
			state={selected ? 'checked' : 'unchecked'}
			size={ctx?.size === 'sm' ? 'sm' : 'md'}
			isDisabled={disabled}
		/>
		<masonview className="vx-radio-label-col" style={{ display: 'flex' }}>
			{props.label != null ? <label className="vx-radio-label" text={props.label} textWrap /> : null}
			{props.description != null ? (
				<label className="vx-radio-description" text={props.description} textWrap />
			) : null}
		</masonview>
		{props.endContent != null ? (
			<masonview className="vx-radio-end" style={{ display: 'flex' }}>
				{props.endContent}
			</masonview>
		) : null}
	</masonview>
}
