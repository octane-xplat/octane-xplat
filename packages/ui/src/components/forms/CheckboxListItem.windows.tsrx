/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useRef } from 'octane'
import type { View } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import type { CheckboxListItemProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { CheckboxListContext } from './option-list-contexts'
import { CheckboxIndicator, indicatorScope } from '../feedback/indicators'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useIndicator } from '../feedback/use-indicator'
import { useMeasure } from '../layout/useMeasure'
import './checkbox-control'
import './Checkbox.windows.css'

/** Shared list-item chrome with the same native input as CheckboxInput. */
export function CheckboxListItem(props: CheckboxListItemProps) @{
	const ctx = useContext(CheckboxListContext)
	const groupMode = props.value != null && ctx != null
	const selected = ctx?.selected
	const checked = groupMode
		? Array.isArray(selected) && selected.includes(props.value!)
		: (props.isChecked ?? false)

	const state = checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const disabled = Boolean(ctx?.isDisabled || props.isDisabled)
	const readOnly = Boolean(ctx?.isReadOnly)
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const measured = useMeasure()
	const rowView = useRef<View | null>(null)
	const bindRow = useCallback(
		(view: View | null) => {
			rowView.current = view
			measured.ref(view)
		},
		[measured.ref],
	)

	useEffect(() => applyEscapeProps(rowView.current, props), [props])

	const requestChange = (next: boolean) => {
		if (disabled || readOnly) {
			return
		}

		if (groupMode) {
			ctx?.select?.(props.value!, next)
		} else {
			props.onCheck?.(next)
		}
	}

	<masonview
		ref={bindRow}
		id={props.id}
		className={cx(
			'vx-checkbox-row',
			'vx-checkboxlist-item',
			indicatorScope,
			state === 'checked' && 'vx-checkbox--on',
			disabled && 'vx-checkbox--disabled',
			readOnly && 'vx-checkbox--readonly',
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<Ind state={state} size={ctx?.size === 'sm' ? 'sm' : 'md'} isDisabled={disabled} />
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
		<xplatwindowscheckbox
			className="vx-checkbox-input-windows"
			style={{
				position: 'absolute',
				width: measured.bounds?.width ?? 0,
				height: measured.bounds?.height ?? 0,
			}}
			checked={checked}
			readOnly={readOnly}
			isEnabled={!disabled}
			accessibilityLabel={props.label ?? props.value}
			accessibilityHint={props.description}
			requestChange={requestChange}
		/>
	</masonview>
}
