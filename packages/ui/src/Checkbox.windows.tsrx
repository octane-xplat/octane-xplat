/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useRef, useState } from 'octane'
import type { View } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import type { CheckboxProps } from './props'
import { applyEscapeProps } from './escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { CheckboxIndicator, indicatorScope } from './indicators'
import { mergeStyle } from './style-merge'
import { useIndicator } from './use-indicator'
import { useMeasure } from './useMeasure'
import './checkbox-control'
import './Checkbox.windows.css'

/** Shared indicator and label, with WinUI owning focus and TogglePattern. */
export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps)
	const inField = useContext(FieldContext) != null
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const [pending, setPending] = useState(false)
	const resolved = props.value ?? internal
	const checked = resolved === true
	const indeterminate = resolved === 'indeterminate'
	const isBlocked = props.isDisabled || props.isReadOnly
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
		if (isBlocked) {
			return
		}

		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
		if (!props.changeAction) {
			return
		}

		const previous = checked
		setPending(true)
		Promise.resolve(props.changeAction(next)).then(
			() => setPending(false),
			() => {
				if (props.value === undefined) {
					setInternal(previous)
				}

				props.onChange?.(previous)
				setPending(false)
			},
		)
	}

	// As in Switch, foreign WinUI input needs finite measured bounds and a local position.
	const row = (
		<masonview
			ref={bindRow}
			id={props.id}
			className={cx(
				'vx-checkbox-row',
				indicatorScope,
				checked && 'vx-checkbox--on',
				props.isDisabled && 'vx-checkbox--disabled',
				props.isReadOnly && 'vx-checkbox--readonly',
				(props.isLoading || pending) && 'vx-checkbox--loading',
				props.status && `vx-checkbox--status-${props.status.type}`,
				props.size && `vx-checkbox--size-${props.size}`,
				props.className,
			)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			<Ind
				state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
				size={props.size === 'sm' ? 'sm' : 'md'}
				isDisabled={props.isDisabled}
			/>
			{(!props.isLabelHidden && props.label != null) || (!inField && props.description != null) ? (
				<masonview style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
					{!props.isLabelHidden && props.label != null ? (
						<label className="vx-checkbox-label" text={props.label} />
					) : null}
					{!inField && props.description != null ? (
						<label className="vx-field-description" text={props.description} />
					) : null}
				</masonview>
			) : null}
			<xplatwindowscheckbox
				className="vx-checkbox-input-windows"
				style={{
					position: 'absolute',
					width: measured.bounds?.width ?? 0,
					height: measured.bounds?.height ?? 0,
				}}
				testID={props.testID ?? ''}
				checked={resolved}
				readOnly={props.isReadOnly ?? false}
				isEnabled={!props.isDisabled}
				accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={props.accessibilityHint}
				requestChange={requestChange}
			/>
		</masonview>
	)

	@if (!inField && props.status?.message != null) {
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			{row}
			<masonview
				className={cx(
					'vx-field-status',
					`vx-field-status--${props.status.type}`,
					'vx-field-status--detached',
				)}
			>
				<label text={props.status.message} />
			</masonview>
		</masonview>
	} @else {
		<>{row}</>
	}
}
