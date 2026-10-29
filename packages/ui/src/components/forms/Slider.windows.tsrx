/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { View } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import type { SliderProps } from '../../props'
import { useFieldControl } from './field-context'
import { FormField } from './FormField'
import { applyEscapeProps } from '../overlays/escape-props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMeasure } from '../layout/useMeasure'
import { usePan } from '../layout/pan'
import {
	moveSliderThumb,
	normalizeSliderValue,
	sameSliderValue,
	sliderBounds,
	sliderTouch,
} from './slider-model.windows'

import type { SliderThumb, SliderValue } from './slider-model.windows'
import { focusSliderInput, queueSliderInputFocus } from './slider-control'
import './Slider.windows.css'

/** Shared drawing and delta-based pan; transparent WinUI peers own keyboard and RangeValue. */
export function Slider(inputProps: SliderProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const bounds = sliderBounds(props)
	const { min, max, step } = bounds
	const [internal, setInternal] = useState<SliderValue>(
		normalizeSliderValue(props.defaultValue, min, max),
	)

	const value = normalizeSliderValue(props.value ?? internal, min, max)
	const range = Array.isArray(value)
	const lower = Array.isArray(value) ? value[0] : min
	const upper = Array.isArray(value) ? value[1] : value
	const disabled = Boolean(props.disabled || props.isDisabled)
	const blocked = disabled || Boolean(props.isReadOnly)
	const measured = useMeasure()
	const width = measured.bounds?.width ?? 0
	const host = useRef<View | null>(null)
	const lowerPeer = useRef<View | null>(null)
	const upperPeer = useRef<View | null>(null)
	const pressedPeer = useRef<View | null>(null)
	const cancelQueuedFocus = useRef<(() => void) | null>(null)
	const drag = useRef<{ thumb: SliderThumb; origin: number } | null>(null)
	const contact = useRef(false)
	const bindHost = useCallback(
		(view: View | null) => {
			host.current = view
			measured.ref(view)
		},
		[measured.ref],
	)

	useEffect(() => applyEscapeProps(host.current, props), [props])
	useEffect(() => {
		drag.current = null
		contact.current = false
		pressedPeer.current = null
		cancelQueuedFocus.current?.()
		cancelQueuedFocus.current = null
		return () => {
			cancelQueuedFocus.current?.()
			cancelQueuedFocus.current = null
			pressedPeer.current = null
		}
	}, [min, max, step, range, blocked])

	const ratio = (n: number) => (max === min ? 0 : (n - min) / (max - min))
	const thumbLeft = (n: number) =>
		Math.max(0, Math.min(Math.max(0, width - 20), ratio(n) * width - 10))

	const format = (n: number) => (props.formatValue ? props.formatValue(n) : String(Math.round(n)))
	const readout = range ? `${format(lower)} – ${format(upper)}` : format(upper)
	const increment = step > 0 ? step : (max - min) / 100 || 1
	const page = Math.max(increment, (max - min) / 10)
	const marks = (props.marks ?? []).filter(
		(mark) => Number.isFinite(mark.value) && mark.value >= min && mark.value <= max,
	)

	const name = props.ariaLabel ?? props.fieldLabel ?? props.label
	const request = (thumb: SliderThumb, next: number) => {
		if (blocked) {
			return
		}

		const changed = moveSliderThumb(value, thumb, next, bounds)
		if (sameSliderValue(value, changed)) {
			return
		}

		if (props.value === undefined) {
			setInternal(changed)
		}

		props.onValueChange?.(changed)
	}

	const onTouch = (event: unknown) => {
		const touch = sliderTouch(event)
		if (!touch) {
			return
		}

		if (touch.action === 'down' && !disabled) {
			cancelQueuedFocus.current?.()
			cancelQueuedFocus.current = null
			contact.current = true
			const at = touch.x != null && width > 0 ? min + (touch.x / width) * (max - min) : upper
			const thumb = range && Math.abs(at - lower) <= Math.abs(at - upper) ? 'lower' : 'upper'
			drag.current = { thumb, origin: thumb === 'lower' ? lower : upper }
			pressedPeer.current = thumb === 'lower' ? lowerPeer.current : upperPeer.current
			focusSliderInput(pressedPeer.current)
		} else if (touch.action === 'up' || touch.action === 'cancel') {
			contact.current = false
			cancelQueuedFocus.current?.()
			cancelQueuedFocus.current =
				touch.action === 'up' ? queueSliderInputFocus(pressedPeer.current) : null

			pressedPeer.current = null
			if (touch.action === 'cancel') {
				drag.current = null
			}
		}
	}

	const onPan = usePan((event) => {
		if (event.state === 'ended' || event.state === 'cancelled' || blocked) {
			drag.current = null
			return
		}

		if (event.state === 'began') {
			// Touch may be delivered before or after pan-began by the shared pointer owner.
			if (!contact.current) {
				drag.current = { thumb: 'upper', origin: upper }
			}
		} else if (drag.current && width > 0) {
			request(drag.current.thumb, drag.current.origin + (event.dx / width) * (max - min))
		}
	})

	const body = (
		<masonview
			id={props.id}
			className={cx('vx-slider-body-windows', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			{props.valueDisplay === 'tooltip' ? (
				<masonview className="vx-slider-marks-windows">
					{range ? (
						<label
							className="vx-slider-tooltip-windows"
							text={format(lower)}
							style={{ position: 'absolute', translateX: thumbLeft(lower) }}
						/>
					) : null}
					<label
						className="vx-slider-tooltip-windows"
						text={format(upper)}
						style={{ position: 'absolute', translateX: thumbLeft(upper) }}
					/>
				</masonview>
			) : null}
			<masonview className="vx-slider-row-windows">
				<masonview
					ref={bindHost}
					className={cx(
						'vx-slider',
						'vx-slider-track-windows',
						range && 'vx-slider--range',
						disabled && 'vx-slider--disabled',
						props.isReadOnly && 'vx-slider--readonly',
						props.size && `vx-slider--size-${props.size}`,
					)}
					isEnabled={!disabled}
					onPan={onPan}
					onTouch={onTouch}
				>
					<masonview
						className="vx-slider-track"
						style={{ display: 'flex', position: 'absolute', width, translateY: 12 }}
					/>
					<masonview
						className="vx-slider-fill"
						style={{
							display: 'flex',
							position: 'absolute',
							width: (ratio(upper) - (range ? ratio(lower) : 0)) * width,
							translateX: range ? ratio(lower) * width : 0,
							translateY: 12,
						}}
					/>
					{range ? (
						<masonview
							className="vx-slider-thumb"
							style={{
								display: 'flex',
								position: 'absolute',
								translateX: thumbLeft(lower),
								translateY: 4,
							}}
						/>
					) : null}
					<masonview
						className="vx-slider-thumb"
						style={{
							display: 'flex',
							position: 'absolute',
							translateX: thumbLeft(upper),
							translateY: 4,
						}}
					/>
					{marks.map((mark) => (
						<masonview
							key={mark.value}
							className="vx-slider-mark-tick-windows"
							style={{ translateX: ratio(mark.value) * width, translateY: 10 }}
						/>
					))}
					{range ? (
						<xplatwindowsslider
							ref={lowerPeer}
							className="vx-slider-input-windows"
							style={{ position: 'absolute', width, height: measured.bounds?.height ?? 0 }}
							settings={{
								value: lower,
								min,
								max: upper,
								increment,
								page,
								readOnly: Boolean(props.isReadOnly),
							}}
							isEnabled={!disabled}
							accessibilityLabel={name ? `${name}, lower value` : 'Lower value'}
							accessibilityHint={props.accessibilityHint}
							requestChange={(next) => request('lower', next)}
						/>
					) : null}
					<xplatwindowsslider
						ref={upperPeer}
						className="vx-slider-input-windows"
						style={{ position: 'absolute', width, height: measured.bounds?.height ?? 0 }}
						settings={{
							value: upper,
							min: range ? lower : min,
							max,
							increment,
							page,
							readOnly: Boolean(props.isReadOnly),
						}}
						isEnabled={!disabled}
						accessibilityLabel={range ? (name ? `${name}, upper value` : 'Upper value') : name}
						accessibilityHint={props.accessibilityHint}
						requestChange={(next) => request('upper', next)}
					/>
				</masonview>
				{props.valueDisplay === 'text' ? (
					<label className="vx-slider-value" text={readout} />
				) : null}
			</masonview>
			{marks.length ? (
				<masonview className="vx-slider-marks-windows" style={{ width }}>
					{marks.map((mark) => (
						<label
							key={mark.value}
							className="vx-slider-tooltip-windows"
							text={mark.label ?? String(mark.value)}
							style={{ position: 'absolute', translateX: thumbLeft(mark.value) }}
						/>
					))}
				</masonview>
			) : null}
		</masonview>
	)

	@if (
		!inField &&
		(props.label != null ||
			props.description != null ||
			props.status != null ||
			props.isRequired ||
			props.isOptional)
	) {
		<FormField
			inputID={props.id}
			label={props.label}
			description={props.description}
			status={props.status}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden}
			isDisabled={disabled}
			isReadOnly={props.isReadOnly}
			disabledMessage={props.disabledMessage}
			width={props.width}
		>
			{body}
		</FormField>
	} @else {
		<>{body}</>
	}
}
