/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useRef } from 'octane'
import type { View } from '@nativescript/core'
import { WindowsRadioContext } from './radio-context.windows'
import { useMeasure } from '../layout/useMeasure'
import './radio-control.windows'
import './RadioGroup.windows.css'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { RadioListItemProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { RadioListContext } from './option-list-contexts'
import { RadioIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'

/** `RadioListItem` — one option row inside a `RadioList` (Astryx child
 *  part). Reads the selected value and commit callback from the group's
 *  context; standalone renders a presentational row. */
export function RadioListItem(props: RadioListItemProps) @{
	const ctx = useContext(RadioListContext)
	const selected = typeof ctx?.selected === 'string' && ctx.selected === props.value
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const group = useContext(WindowsRadioContext)
	const measured = useMeasure()
	const row = useRef<View | null>(null)
	const bindRow = useCallback(
		(view: View | null) => {
			row.current = view
			measured.ref(view)
		},
		[measured.ref],
	)

	useEffect(() => applyEscapeProps(row.current, props), [props])
	useEffect(() => group?.restore(), [group, selected, disabled, props.value])
	const Ind = useIndicator('radio') ?? RadioIndicator

	<masonview
		ref={bindRow}
		id={props.id}
		className={[
			'vx-radio-row',
			'vx-radiolist-item',
			indicatorScope,
			selected && 'vx-radio--on',
			disabled && 'vx-radio--disabled',
			ctx?.isReadOnly && 'vx-radio--readonly',
			props.className,
		]}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<Ind
			state={selected ? 'checked' : 'unchecked'}
			size={ctx?.size === 'sm' ? 'sm' : 'md'}
			isDisabled={disabled}
		/>
		<masonview className="vx-radio-label-col" style={{ display: 'flex', flexDirection: 'column' }}>
			{props.label != null ? <label className="vx-radio-label" text={props.label} /> : null}
			{props.description != null ? (
				<label className="vx-radio-description" text={props.description} />
			) : null}
		</masonview>
		{props.endContent != null ? (
			<masonview className="vx-radio-end" style={{ display: 'flex' }}>
				{props.endContent}
			</masonview>
		) : null}
		{group ? (
			<xplatwindowsradio
				className="vx-radio-input-windows"
				style={{
					position: 'absolute',
					width: measured.bounds?.width ?? 0,
					height: measured.bounds?.height ?? 0,
				}}
				settings={{ group, value: props.value }}
				isEnabled={!disabled}
				accessibilityLabel={props.label ?? props.value}
				accessibilityHint={props.description}
			/>
		) : null}
	</masonview>
}
