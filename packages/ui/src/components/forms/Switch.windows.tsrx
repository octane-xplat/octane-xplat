/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useRef, useState } from 'octane'
import type { View } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import type { SwitchProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMeasure } from '../layout/useMeasure'
import './switch-control'
import './Switch.windows.css'

/** Shared track and thumb, with WinUI owning keyboard input and TogglePattern. */
export function Switch(inputProps: SwitchProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const inField = useContext(FieldContext) != null
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const [pending, setPending] = useState(false)
	const measured = useMeasure()
	const trackView = useRef<View | null>(null)
	const bindTrack = useCallback(
		(view: View | null) => {
			trackView.current = view
			measured.ref(view)
		},
		[measured.ref],
	)

	useEffect(() => applyEscapeProps(trackView.current, props), [props])
	const checked = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const needsChrome =
		!inField && (props.label != null || props.description != null || props.status != null)

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

	// Auto/stretch left this foreign native input with empty WinUI bounds.
	// Use measured dimensions and a local position, which the renderer's default would override in CSS.
	const track = (
		<masonview
			ref={bindTrack}
			id={props.id}
			className={cx(
				'vx-switch',
				checked && 'vx-switch--on',
				props.isDisabled && 'vx-switch--disabled',
				props.isReadOnly && 'vx-switch--readonly',
				(props.isLoading || pending) && 'vx-switch--loading',
				props.status && `vx-switch--status-${props.status.type}`,
				props.size && `vx-switch--size-${props.size}`,
				props.className,
			)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			<masonview className="vx-switch-thumb" style={{ display: 'flex' }} />
			<xplatwindowstoggle
				className="vx-switch-input-windows"
				style={{
					position: 'absolute',
					width: measured.bounds?.width ?? 0,
					height: measured.bounds?.height ?? 0,
				}}
				testID={props.testID ?? ''}
				checked={checked}
				readOnly={props.isReadOnly ?? false}
				isEnabled={!props.isDisabled}
				accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={props.accessibilityHint}
				requestChange={requestChange}
			/>
		</masonview>
	)

	const labelCol =
		props.label != null || props.description != null ? (
			<masonview
				style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
				onTap={isBlocked ? undefined : () => requestChange(!checked)}
			>
				{props.label != null ? <label className="vx-field-label" text={props.label} /> : null}
				{props.description != null ? (
					<label className="vx-field-description" text={props.description} />
				) : null}
			</masonview>
		) : null

	const labelFirst = props.labelPosition === 'start'

	@if (needsChrome) {
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<masonview
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8,
					justifyContent: props.labelSpacing === 'spread' ? 'space-between' : 'flex-start',
				}}
			>
				{labelFirst ? labelCol : null}
				{track}
				{!labelFirst ? labelCol : null}
			</masonview>
			{props.status?.message != null ? (
				<masonview
					className={cx(
						'vx-field-status',
						`vx-field-status--${props.status.type}`,
						'vx-field-status--detached',
					)}
				>
					<label text={props.status.message} />
				</masonview>
			) : null}
		</masonview>
	} @else {
		<>{track}</>
	}
}
