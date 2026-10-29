/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useCallback, useContext, useEffect, useId, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { PanEvent, SliderProps } from '../../props'
import { usePan } from '../layout/pan.macos.tsrx'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { controlColors } from '../../internal/platform/control-colors.macos'
import { useThemeScheme } from '../../theme/theme-scheme.macos'
import { moveSlider, sameSliderValue, sliderKey, sliderLimits, sliderRatio, sliderValue, type SliderValue } from './slider-values.macos'

function SliderThumb(props: {
	id: string; lower: boolean; value: number; min: number; max: number; ratio: number
	label?: string; hint?: string; formatted: string; tooltip: boolean; disabled: boolean; blocked: boolean
	state: Record<string, boolean | undefined>; color: string; step: number
	bind(view: NSView | null): void; move(value: number): void
}) @{
	const view = useRef<NSView | null>(null)
	const latest = useRef(props); latest.current = props
	const latestBind = useRef(props.bind)
	latestBind.current = props.bind
	const bind = useCallback((target: NSView | null) => { view.current = target; latestBind.current(target) }, [])
	const { keyboardProps } = useKeyboard({ onKeyDown: (event) => {
		const current = latest.current
		if (!view.current || current.blocked || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
		const next = sliderKey(event.key, current.value, { min: current.min, max: current.max, step: current.step })
		if (next === undefined) return
		event.preventDefault()
		current.move(next)
	} })
	const adjust = (direction: 1 | -1) => {
		const current = latest.current
		if (!view.current || current.blocked) return
		current.move(current.value + direction * (current.step || (current.max - current.min) / 100))
	}
	useEffect(() => {
		const target = view.current
		if (!target) return
		target.toolTip = props.tooltip ? props.formatted : ''
		return () => { target.toolTip = '' }
	}, [props.tooltip, props.formatted])
	<masonview
		id={props.id}
		ref={bind}
		className={cx('vx-slider-thumb', props.lower && 'vx-slider-thumb--lo')}
		disabled={props.disabled}
		{...keyboardProps}
		onTap={() => { const target = view.current; if (target && !latest.current.disabled) target.window?.makeFirstResponder(target) }}
		accessibilityRole="adjustable" accessibilityLabel={props.label} accessibilityHint={props.hint}
		accessibilityValue={String(props.value)} accessibilityMinValue={props.min} accessibilityMaxValue={props.max}
		accessibilityState={props.state}
		onAccessibilityIncrement={props.blocked ? undefined : () => adjust(1)}
		onAccessibilityDecrement={props.blocked ? undefined : () => adjust(-1)}
		style={{ backgroundColor: props.color, left: `${props.ratio * 100}%` }}
	/>
}

interface SliderDrag {
	key: string; which: 0 | 1; start: SliderValue; width: number
	controlled: boolean; source: SliderValue; requested?: SliderValue
}

function SliderControl(inputProps: SliderProps & { controlID: string }) @{
	const props = useFieldControlProps(inputProps)
	const limits = sliderLimits(props)
	const [internal, setInternal] = useState<SliderValue>(props.defaultValue ?? limits.min)
	const controlled = props.value !== undefined
	const source = controlled ? props.value! : internal
	const range = Array.isArray(source)
	const disabled = Boolean(props.disabled || props.isDisabled), blocked = disabled || Boolean(props.isReadOnly)
	const key = `${limits.min}:${limits.max}:${limits.step}:${range}`
	const latest = useRef({ props, limits, controlled, key, blocked }); latest.current = { props, limits, controlled, key, blocked }
	const changing = useRef(false)
	const drag = useRef<SliderDrag | null>(null)
	const [preview, setPreview] = useState<{ owner: SliderDrag; value: SliderValue } | null>(null)
	const base = sliderValue(source, limits), session = drag.current
	// Matching controlled feedback belongs to this drag. A different parent
	// value or control contract retires it before preview can mask that update.
	if (session && (blocked || session.key !== key || session.controlled !== controlled ||
		controlled && !sameSliderValue(base, session.source) && (session.requested === undefined || !sameSliderValue(base, session.requested)))) drag.current = null
	const value = preview && drag.current === preview.owner ? preview.value : base
	const live = useRef(value)
	live.current = value
	const thumbs = useRef<(NSView | null)[]>([])
	const track = useRef<NSView | null>(null)
	const lo = Array.isArray(value) ? value[0] : value, hi = Array.isArray(value) ? value[1] : value
	const colors = controlColors(useThemeScheme() === 'dark')
	const format = (number: number) => props.formatValue ? props.formatValue(number) : String(number)
	const move = (which: 0 | 1, proposed: number, dragging = false) => {
		const current = latest.current
		if (!track.current || current.blocked || changing.current) return
		const owner = drag.current
		if (dragging && (!owner || owner.key !== current.key || owner.controlled !== current.controlled)) return
		const next = moveSlider(live.current, which, proposed, current.limits)
		if (sameSliderValue(next, live.current)) return
		// Claim before state writes or app callbacks can reenter another adjustment.
		changing.current = true
		try {
			if (dragging && owner) owner.requested = next
			else if (owner) { drag.current = null; setPreview(null) }
			if (!current.controlled) setInternal(next)
			if (dragging && owner) setPreview({ owner, value: next })
			if (!current.controlled || dragging) live.current = next
			current.props.onValueChange?.(next)
		} finally { changing.current = false }
	}
	const onPan = usePan(blocked ? undefined : (event: PanEvent) => {
		if (!track.current || changing.current) return
		if (event.state === 'began') {
			const location = event.locationX
			if (typeof location !== 'number' || !Number.isFinite(location)) return
			const target = event.target as NSView
			const line = track.current
			const rect = typeof line?.convertRectToView === 'function' ? line.convertRectToView(line.bounds, target) : null
			const width = Number(rect?.size?.width ?? Number(target?.bounds?.size?.width ?? target?.frame?.size?.width ?? 0) - 20)
			const origin = Number(rect?.origin?.x ?? 10) - Number(target?.bounds?.origin?.x ?? 0)
			if (!Number.isFinite(width) || width <= 0) return
			const at = limits.min + (location - event.dx - origin) / width * (limits.max - limits.min)
			const lowDistance = Math.abs(at - lo), highDistance = Math.abs(at - hi)
			const which: 0 | 1 = range && (lowDistance < highDistance || lowDistance === highDistance && event.dx < 0) ? 0 : 1
			drag.current = { key, which, start: live.current, width, controlled, source: base }
			const thumb = thumbs.current[which]
			thumb?.window?.makeFirstResponder(thumb)
			return
		}
		const session = drag.current
		if (!session || session.key !== key) return
		if (event.state === 'moved' || event.state === 'ended') {
			const start = Array.isArray(session.start) ? session.start[session.which] : session.start
			move(session.which, start + event.dx / session.width * (limits.max - limits.min), true)
		}
		if ((event.state === 'ended' || event.state === 'cancelled') && drag.current === session) { drag.current = null; setPreview(null) }
	})
	const name = props.ariaLabel ?? props.fieldLabel ?? props.label
	const state = { disabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }
	<masonview id={props.controlID} className={cx('vx-slider-block', props.className)} style={props.style}>
		{props.valueDisplay === 'text' ? <label className="vx-slider-value" text={range ? `${format(lo)} – ${format(hi)}` : format(hi)} /> : null}
		<masonview id={`${props.controlID}-trackbox`} className={cx('vx-slider', 'vx-slider--appkit', range && 'vx-slider--range', disabled && 'vx-slider--disabled')}
			onPan={onPan} accessibilityRole={range ? 'group' : undefined} accessibilityLabel={range ? name : undefined}>
			<masonview ref={track} className="vx-slider-track" style={{ backgroundColor: colors.border }} />
			<masonview className="vx-slider-fill" style={{ backgroundColor: colors.primary,
				left: `${range ? sliderRatio(lo, limits) * 100 : 0}%`, width: `${(sliderRatio(hi, limits) - (range ? sliderRatio(lo, limits) : 0)) * 100}%` }} />
			{(range ? [0, 1] as const : [1] as const).map((which) => <SliderThumb key={which}
				id={`${props.controlID}-${range ? which === 0 ? 'lower' : 'upper' : 'thumb'}`} lower={which === 0}
				value={which === 0 ? lo : hi} min={range && which === 1 ? lo : limits.min} max={range && which === 0 ? hi : limits.max}
				ratio={sliderRatio(which === 0 ? lo : hi, limits)} step={limits.step || (limits.max - limits.min) / 100}
				label={range ? `${name ?? 'Range'} ${which === 0 ? 'lower' : 'upper'} value` : name} hint={props.accessibilityHint}
				formatted={format(which === 0 ? lo : hi)} tooltip={props.valueDisplay === 'tooltip'} disabled={disabled} blocked={blocked} state={state} color={colors.primary}
				bind={(view) => { thumbs.current[which] = view }} move={(next) => move(which, next)} />)}
		</masonview>
		{props.marks?.length ? <masonview className="vx-slider-marks">
			{props.marks.filter((mark) => Number.isFinite(mark.value) && mark.value >= limits.min && mark.value <= limits.max).map((mark, index) =>
				<masonview key={index} className="vx-slider-mark" style={{ left: `${sliderRatio(mark.value, limits) * 100}%` }}>
					<masonview className="vx-slider-mark-tick" style={{ backgroundColor: colors.border }} />
					{mark.label != null ? <label className="vx-slider-mark-label" text={mark.label} /> : null}
				</masonview>)}
		</masonview> : null}
	</masonview>
}

export function Slider(props: SliderProps) @{
	const field = useContext(FieldContext)
	const generatedID = useId()
	const controlID = props.id ?? field?.controlId ?? generatedID
	@if (field) {
		<SliderControl {...props} controlID={controlID} />
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status} statusVariant={props.statusVariant}
			isDisabled={props.disabled || props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading} isRequired={props.isRequired} isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip} width={props.width} size={props.size}>
			<SliderControl {...props} controlID={controlID} />
		</FormField>
	}
}
