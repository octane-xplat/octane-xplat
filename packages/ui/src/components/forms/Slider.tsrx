/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useContext, useEffect, useRef, useState } from 'octane'
import type { PanEvent, SliderProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useMeasure } from '../layout/useMeasure'
import { useTooltip } from '../overlays/use-tooltip'
import { usePan } from '../layout/pan'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { applySliderAccessibility } from './slider-accessibility'
import { NativeToggleField } from './NativeToggleField'

/** One retained field owns scalar/range state and the drawn track. */
function SliderControl(inputProps: SliderProps) @{
	const props = useFieldControlProps(inputProps)
	const min = props.min ?? props.minValue ?? 0
	const max = props.max ?? props.maxValue ?? 100
	const [internal, setInternal] = useState(props.defaultValue ?? min)
	const raw = props.value ?? internal
	const isRange = Array.isArray(raw)
	const clamp = (value: number) => Math.min(max, Math.max(min, value))
	const lo = clamp(Array.isArray(raw) ? raw[0] : raw)
	const hi = Array.isArray(raw) ? Math.max(lo, clamp(raw[1])) : lo
	const ratio = (value: number) => max === min ? 0 : (value - min) / (max - min)
	const isDisabled = Boolean(props.disabled || props.isDisabled)
	const blocked = isDisabled || props.isReadOnly
	const measure = useMeasure()
	const width = measure.bounds?.width ?? 0
	const tooltip = useTooltip({ isEnabled: props.valueDisplay === 'tooltip' && !isDisabled, delay: 0 })
	const host = useRef<any>(null)
	const adjustRef = useRef<(direction: number, action?: string) => void>(() => {})
	const detach = useRef<() => void>(() => {})
	const bindHost = useCallback((view: any) => {
		detach.current()
		host.current = view
		measure.ref(view)
		tooltip.interactionRef(view)
		if (!view) return
		const increment = (event: any) => adjustRef.current(1, event?.action)
		const decrement = (event: any) => adjustRef.current(-1, event?.action)
		view.on?.('accessibilityIncrement', increment)
		view.on?.('accessibilityDecrement', decrement)
		detach.current = () => {
			view.off?.('accessibilityIncrement', increment)
			view.off?.('accessibilityDecrement', decrement)
		}
	}, [])
	useEffect(() => applyEscapeProps(host.current, props))
	const press = useRef(0)
	const drag = useRef<{ lo: number; hi: number; which: 'lo' | 'hi' | null } | null>(null)
	const format = (value: number) => props.formatValue ? props.formatValue(value) : String(Math.round(value))
	const readout = isRange ? format(lo) + ' – ' + format(hi) : format(lo)
	const step = props.step ?? 0
	const move = (which: 'lo' | 'hi', value: number) => {
		if (blocked) return
		const snapped = value <= min ? min : value >= max ? max
			: step > 0 ? min + Math.round((value - min) / step) * step : value
		const next = clamp(snapped)
		const result: number | [number, number] = isRange
			? which === 'lo' ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)]
			: next
		const changed = Array.isArray(result) ? result[0] !== lo || result[1] !== hi : result !== lo
		if (!changed) return
		if (props.value === undefined) setInternal(result)
		props.onValueChange?.(result)
	}
	adjustRef.current = (direction, action) => {
		const delta = step > 0 ? step : (max - min) / 100
		move('hi', action === 'minimum' ? min : action === 'maximum' ? max : hi + direction * delta)
	}
	useEffect(() => applySliderAccessibility(host.current, { min, max, value: hi, text: readout }))
	const onPan = usePan((event: PanEvent) => {
		if (blocked) return
		if (event.state === 'began') {
			// GTK can send pan begin before touch down. Choose on first movement,
			// after both callbacks have observed the current press.
			drag.current = { lo, hi, which: null }
		} else if (event.state === 'moved') {
			if (!drag.current || !width) return
			if (drag.current.which === null) {
				const at = min + press.current / width * (max - min)
				drag.current.which = isRange && Math.abs(at - drag.current.lo) <= Math.abs(at - drag.current.hi) ? 'lo' : 'hi'
			}
			const base = drag.current.which === 'lo' ? drag.current.lo : drag.current.hi
			move(drag.current.which, base + event.dx / width * (max - min))
		} else {
			drag.current = null
		}
	})
	const thumbLeft = (value: number) => Math.min(Math.max(ratio(value) * width - 10, 0), Math.max(width - 20, 0))
	const showsValue = props.valueDisplay === 'text'
	const hasMarks = (props.marks?.length ?? 0) > 0
	const markTop = showsValue ? 44 : 28
	<masonview
		id={props.id}
		ref={bindHost}
		className={cx('vx-slider', 'vx-slider--native', isRange && 'vx-slider--range',
			isDisabled && 'vx-slider--disabled', props.isReadOnly && 'vx-slider--readonly',
			props.isLoading && 'vx-slider--loading', props.size && `vx-slider--size-${props.size}`,
			props.status && `vx-slider--status-${props.status.type}`, props.className)}
		style={mergeStyle({ display: 'flex', height: hasMarks ? markTop + 20 : showsValue ? 48 : 28 }, props.style)}
		accessibilityRole={nativeAccessibilityRole('adjustable')}
		accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: isDisabled, readOnly: props.isReadOnly,
			required: props.isRequired, busy: props.isLoading, invalid: props.status?.type === 'error' })}
		isEnabled={!isDisabled}
		onTouch={(event: any) => { if (event.action === 'down') press.current = event.getX?.() ?? event.x ?? 0 }}
		onPan={onPan}
	>
		<masonview className="vx-slider-track" accessible={false}
			style={{ display: 'flex', position: 'absolute', left: 0, top: 12, width }} />
		<masonview className="vx-slider-fill" accessible={false}
			style={{ display: 'flex', position: 'absolute', top: 12,
				left: isRange ? ratio(lo) * width : 0,
				width: (ratio(hi) - (isRange ? ratio(lo) : 0)) * width }} />
		<masonview key="high" className="vx-slider-thumb" ref={tooltip.positionRef} accessible={false}
			style={{ display: 'flex', position: 'absolute', left: thumbLeft(hi), top: 4 }} />
		@if (isRange) {
			<masonview key="low" className="vx-slider-thumb vx-slider-thumb--lo" accessible={false}
				style={{ display: 'flex', position: 'absolute', left: thumbLeft(lo), top: 4 }} />
		}
		@for (const mark of props.marks ?? []; key mark.value) {
			<masonview className="vx-slider-mark" accessible={false}
				style={{ display: 'flex', position: 'absolute', width: 40, height: 20,
					left: Math.min(Math.max(ratio(mark.value) * width - 20, 0), Math.max(width - 40, 0)), top: markTop }}>
				@if (mark.label != null) { <label className="vx-slider-mark-label" text={mark.label} /> }
			</masonview>
		}
		{tooltip.renderTooltip(readout)}
		@if (showsValue) {
			<label className="vx-slider-value" text={readout} accessible={false}
				style={{ position: 'absolute', left: 0, top: 28 }} />
		}
	</masonview>
}

export function Slider(props: SliderProps) @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<SliderControl {...props} />
	} @else {
		<NativeToggleField {...props} isDisabled={Boolean(props.isDisabled || props.disabled)} inlineLabel={false}>
			<SliderControl {...props} />
		</NativeToggleField>
	}
}
