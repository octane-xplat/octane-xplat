/** @jsxImportSource @octane-xplat/jsx/dom */
import { useRef, useState } from 'octane'
import type { PanEvent, SliderProps } from '../../props'
import { useMeasure } from '../layout/useMeasure.web.tsrx'
import { usePan } from '../layout/pan.web.tsrx'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { useFieldControlProps } from './field-context'
import { FormField } from './FormField.web.tsrx'
import { useId } from 'octane'
import type { JSX } from 'octane/jsx-runtime'

/** Self-drawn slider — track + fill + thumb(s) in a relative host.
 *  `value` accepts a single number or a `[low, high]` range (two thumbs,
 *  drag adjusts the nearest). `marks` draw labeled stops; `formatValue`
 *  renders the readout when `valueDisplay` asks for it. Drag anywhere on
 *  the widget adjusts by delta. */
export function Slider(inputProps: SliderProps): JSX.Element @{
	const props = useFieldControlProps(inputProps)
	const host = useRef<HTMLElement | null>(null)
	const measure = useMeasure()
	const drag = useRef<{ lo0: number; hi0: number; which: 'lo' | 'hi' } | null>(null)
	const [dragValue, setDragValue] = useState<number | [number, number] | null>(null)
	const generatedId = useId()
	const controlId = props.id ?? generatedId

	const min = props.min ?? props.minValue ?? 0
	const max = props.max ?? props.maxValue ?? 100
	const isRange = Array.isArray(props.value ?? props.defaultValue)
	const raw = dragValue ?? props.value ?? (isRange ? ([min, max] as [number, number]) : min)
	const lo = Array.isArray(raw)
		? Math.min(max, Math.max(min, raw[0]))
		: Math.min(max, Math.max(min, raw))

	const hi = Array.isArray(raw) ? Math.min(max, Math.max(min, raw[1])) : lo
	const disabled = Boolean(props.disabled || props.isDisabled || props.isReadOnly)
	const width = measure.bounds?.width ?? 0
	const step = props.step ?? 0
	const snap = (n: number) => (step > 0 ? Math.round(n / step) * step : n)
	const ratio = (n: number) => (max === min ? 0 : (n - min) / (max - min))
	const fmt = (n: number) => (props.formatValue ? props.formatValue(n) : String(n))
	const readout = isRange ? `${fmt(lo)} – ${fmt(hi)}` : fmt(lo)

	const emit = (next: number | [number, number]) => props.onValueChange?.(next)
	const move = (which: 'lo' | 'hi', next: number) => {
		if (isRange) {
			const clamped = Math.min(max, Math.max(min, snap(next)))
			const pair: [number, number] =
				which === 'lo' ? [Math.min(clamped, hi), hi] : [lo, Math.max(clamped, lo)]

			if (pair[0] !== lo || pair[1] !== hi) {
				emit(pair)
			}

			return pair
		}

		const clamped = Math.min(max, Math.max(min, snap(next)))
		if (clamped !== hi) {
			emit(clamped)
		}

		return clamped
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (disabled || event.defaultPrevented) {
			return
		}

		const current = hi
		const delta = step > 0 ? step : (max - min) / 100
		let next: number | undefined
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = current + delta
				break
			case 'ArrowLeft':
			case 'ArrowDown':
				next = current - delta
				break
			case 'Home':
				next = min
				break
			case 'End':
				next = max
				break
			default:
				return
		}

		event.preventDefault()
		move('hi', next)
	}

	usePan(host, (e: PanEvent) => {
		if (disabled) {
			return
		}

		if (e.state === 'began') {
			const frac = width > 0 ? e.x / width : 0
			const at = min + frac * (max - min)
			const which = isRange && Math.abs(at - lo) <= Math.abs(at - hi) ? 'lo' : 'hi'
			drag.current = { lo0: lo, hi0: hi, which }
			return
		}

		if (!drag.current || !width) {
			return
		}

		if (e.state === 'moved') {
			const base = drag.current.which === 'lo' ? drag.current.lo0 : drag.current.hi0
			const next = base + (e.dx / width) * (max - min)
			setDragValue(move(drag.current.which, next))
		} else {
			drag.current = null
			setDragValue(null)
		}
	})

	const needsChrome =
		props.label != null ||
		props.description != null ||
		props.status != null ||
		props.isRequired ||
		props.isOptional

	const sliderEl = (
		<div
			id={controlId}
			role="slider"
			tabIndex={disabled ? -1 : 0}
			onKeyDown={onKeyDown}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={lo}
			aria-valuetext={readout}
			aria-disabled={disabled || undefined}
			aria-label={props.ariaLabel}
			aria-labelledby={props.ariaLabelledBy}
			className={[
				'vx-slider',
				isRange && 'vx-slider--range',
				disabled && 'vx-slider--disabled',
				props.size && `vx-slider--size-${props.size}`,
				props.className,
			]}
			style={props.style}
			ref={(el: any) => {
				host.current = el
				measure.ref(el)
				applyWebProps(el, props.web)
			}}
		>
			<div className="vx-slider-track" aria-hidden="true" />
			<div
				className="vx-slider-fill"
				style={{
					left: isRange ? ratio(lo) * width : 0,
					width: (ratio(hi) - (isRange ? ratio(lo) : 0)) * width,
				}}
				aria-hidden="true"
			/>
			<div className="vx-slider-thumb" style={{ left: ratio(hi) * width }} aria-hidden="true" />
			{isRange ? (
				<div
					className="vx-slider-thumb vx-slider-thumb--lo"
					style={{ left: ratio(lo) * width }}
					aria-hidden="true"
				/>
			) : null}
			{(props.marks ?? []).map((m) => (
				<div
					key={m.value}
					className="vx-slider-mark"
					style={{ left: ratio(m.value) * width }}
					aria-hidden="true"
				>
					{m.label != null ? <span className="vx-slider-mark-label">{m.label}</span> : null}
				</div>
			))}
			{props.valueDisplay === 'text' ? <span className="vx-slider-value">{readout}</span> : null}
		</div>
	)

	if (!needsChrome) {
		return sliderEl
	}

	return (
		<FormField
			inputID={controlId}
			label={props.label}
			description={props.description}
			status={props.status}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled}
			disabledMessage={props.disabledMessage}
			width={props.width}
		>
			{sliderEl}
		</FormField>
	)
}
