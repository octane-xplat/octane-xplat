/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Slider } from './Slider.macos.tsrx'
import { usePan } from '../layout/pan.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { moveSlider, sliderKey, sliderLimits, sliderRatio, sliderValue } from './slider-values.macos'

afterEach(() => vi.unstubAllGlobals())
function mount(component: any, props: any) {
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true })
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const named = (name: string) => all().filter((node) => String(node.props?.className).split(' ').includes(name))
	return { root, render, all, named }
}
function key(thumb: any, name: string, extras = {}) {
	const event = { key: name, code: '', defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false,
		shiftKey: false, repeat: false, isComposing: false, preventDefault() { this.defaultPrevented = true }, stopPropagation() {}, ...extras }
	thumb.props.onKeyDown(event)
	flushUniversalSync(() => {})
	return event
}

it('slider value math handles aliases, equal bounds, steps and non-crossing pairs', () => {
	const limits = sliderLimits({ min: 10, max: 30, minValue: 0, maxValue: 100, step: 5 })
	expect(limits).toEqual({ min: 10, max: 30, step: 5 })
	expect(moveSlider([10, 25], 0, 99, limits)).toEqual([25, 25])
	expect(moveSlider([15, 30], 1, -20, limits)).toEqual([15, 15])
	expect(moveSlider(10, 1, 18, limits)).toBe(20)
	expect(moveSlider(10, 1, NaN, limits)).toBe(10)
	expect(sliderValue([40, -20], limits)).toEqual([10, 30])
	expect(sliderRatio(15, { min: 10, max: 10, step: 0 })).toBe(0)
	expect(sliderKey('ArrowUp', 10, limits)).toBe(15)
})

it('uncontrolled keys persist, while controlled values request changes without replacing their display', () => {
	const requests: unknown[] = []
	const env = mount(Slider, { min: 0, max: 10, step: 2, defaultValue: 4, onValueChange: (value: unknown) => requests.push(value) })
	try {
		expect(key(env.named('vx-slider-thumb')[0], 'ArrowRight').defaultPrevented).toBe(true)
		expect(env.named('vx-slider-thumb')[0].props.accessibilityValue).toBe('6')
		key(env.named('vx-slider-thumb')[0], 'End')
		expect(env.named('vx-slider-thumb')[0].props.accessibilityValue).toBe('10')
		env.render({ min: 0, max: 10, step: 2, value: 2, onValueChange: (value: unknown) => requests.push(value) })
		key(env.named('vx-slider-thumb')[0], 'ArrowRight')
		expect(requests).toEqual([6, 10, 4])
		expect(env.named('vx-slider-thumb')[0].props.accessibilityValue).toBe('2')
		expect(key(env.named('vx-slider-thumb')[0], 'ArrowRight', { metaKey: true }).defaultPrevented).toBe(false)
	} finally { env.root.unmount() }
})

it('range thumbs have separate keys/bounds and cannot cross', () => {
	const env = mount(Slider, { min: 0, max: 100, defaultValue: [20, 80], label: 'Range' })
	try {
		const [lower, upper] = env.named('vx-slider-thumb')
		expect(lower.props.accessibilityLabel).toBe('Range lower value')
		expect(upper.props.accessibilityLabel).toBe('Range upper value')
		key(lower, 'ArrowRight')
		expect(lower.props.accessibilityValue).toBe('21')
		key(lower, 'End')
		expect(lower.props.accessibilityValue).toBe('80')
		expect(upper.props.accessibilityMinValue).toBe(80)
		key(upper, 'Home')
		expect(upper.props.accessibilityValue).toBe('80')
	} finally { env.root.unmount() }
})

it('range drags select a nearby thumb from location, persist on end and retain the editing hosts', () => {
	const requests: unknown[] = []
	const env = mount(Slider, { min: 0, max: 100, defaultValue: [20, 80], step: 5, onValueChange: (value: unknown) => requests.push(value) })
	try {
		const [lower, upper] = env.named('vx-slider-thumb')
		const host = env.named('vx-slider--appkit')[0]
		const view = { bounds: { origin: { x: 0, y: 0 }, size: { width: 120, height: 28 } } }
		const pan = (state: number, deltaX: number) => { host.props.onPan({ state, x: 30 + deltaX, y: 14, deltaX, deltaY: 0, velocityX: 0, velocityY: 0, view }); flushUniversalSync(() => {}) }
		pan(1, 0); pan(2, 10); pan(3, 10)
		expect(requests).toEqual([[30, 80]])
		expect(env.named('vx-slider-thumb')).toEqual([lower, upper])
		expect(lower.props.accessibilityValue).toBe('30')
	} finally { env.root.unmount() }
})

it('field state blocks pan, keys and adjustable actions without duplicating Field metadata', () => {
	function Parent(props: any) {
		return <FormField label="Volume" isDisabled={props.disabled} isReadOnly={props.readonly}>
			<Slider defaultValue={40} />
		</FormField>
	}
	const env = mount(Parent, { disabled: true })
	try {
		expect(env.named('vx-field')).toHaveLength(1)
		for (const state of [{ disabled: true }, { readonly: true }]) {
			env.render(state)
			expect(env.named('vx-slider--appkit')[0].props.onPan).toBeUndefined()
			const thumb = env.named('vx-slider-thumb')[0]
			expect(thumb.props.onAccessibilityIncrement).toBeUndefined()
			expect(key(thumb, 'ArrowRight').defaultPrevented).toBe(false)
			expect(thumb.props.accessibilityValue).toBe('40')
		}
	} finally { env.root.unmount() }
})

it('formats text/tooltip readouts, draws declared marks and retains inline CSS strings', async () => {
	const env = mount(Slider, { value: 0.5, min: 0, max: 1, valueDisplay: 'text', marks: [{ value: 0, label: 'Quiet' }, { value: 1, label: 'Loud' }], style: 'width:200px' })
	try {
		expect(env.named('vx-slider-value')[0].props.text).toBe('0.5')
		expect(env.named('vx-slider-mark-label').map((node) => node.props.text)).toEqual(['Quiet', 'Loud'])
		expect(env.named('vx-slider-block')[0].props.style).toContain('width:200px')
		env.render({ value: 0.5, valueDisplay: 'tooltip', formatValue: (value: number) => `${value * 100}%` })
		await vi.waitFor(() => expect(env.named('vx-slider-thumb')[0].toolTip).toBe('50%'))
		expect(env.named('vx-slider-thumb')[0].props.accessibilityValue).toBe('0.5')
	} finally { env.root.unmount() }
})


it('AppKit pan keeps shared delta aliases and exposes pointer location separately', () => {
	const events: unknown[] = []
	function Listener() @{
		const pan = usePan((event) => events.push(event))
		<masonview className="pan-listener" onPan={pan} />
	}
	const env = mount(Listener, {})
	try {
		env.named('pan-listener')[0].props.onPan({ state: 2, x: 42, y: 17, deltaX: 10, deltaY: 3, view: {} })
		expect(events).toEqual([expect.objectContaining({ x: 10, y: 3, dx: 10, dy: 3, locationX: 42, locationY: 17 })])
	} finally { env.root.unmount() }
})

it('retained AppKit thumb handlers read current values, limits, steps and callbacks', () => {
	const calls: unknown[] = [], env = mount(Slider, { value: 20, step: 5, onValueChange: () => calls.push('old') })
	try {
		const thumb = env.named('vx-slider-thumb')[0], increment = thumb.props.onAccessibilityIncrement, down = thumb.props.onAccessibilityDecrement, keyboard = thumb.props.onKeyDown
		env.render({ value: 50, min: 40, max: 70, step: 10, onValueChange: (value: unknown) => calls.push(value) })
		increment(); down(); key({ props: { onKeyDown: keyboard } }, 'End')
		expect(calls).toEqual([60, 40, 70]); expect(thumb.props.accessibilityValue).toBe('50')
	} finally { env.root.unmount() }
})

it('retained thumb callbacks reject current blocking and detached hosts without stealing focus', () => {
	const calls: unknown[] = [], env = mount(Slider, { value: 20, onValueChange: (value: unknown) => calls.push(value) })
	const thumb = env.named('vx-slider-thumb')[0], increment = thumb.props.onAccessibilityIncrement, keyboard = thumb.props.onKeyDown, tap = thumb.props.onTap
	let focused = 0
	thumb.window = { makeFirstResponder: () => { focused++; return true } }
	try {
		for (const flag of ['disabled', 'isDisabled', 'isReadOnly']) {
			env.render({ value: 20, [flag]: true, onValueChange: (value: unknown) => calls.push(value) })
			increment(); expect(key({ props: { onKeyDown: keyboard } }, 'ArrowRight').defaultPrevented).toBe(false)
			if (flag !== 'isReadOnly') tap()
		}
		expect(calls).toEqual([]); expect(focused).toBe(0)
		env.render({ value: 20, onValueChange: (value: unknown) => calls.push(value) }); env.root.unmount()
		increment(); tap(); expect(key({ props: { onKeyDown: keyboard } }, 'ArrowRight').defaultPrevented).toBe(false)
		expect(calls).toEqual([]); expect(focused).toBe(0)
	} finally { env.root.unmount() }
})

it('AppKit slider adjustments reject callback reentry and release their claim after a thrown callback', () => {
	const calls: unknown[] = [], env = mount(Slider, { value: 20 })
	try {
		const increment = env.named('vx-slider-thumb')[0].props.onAccessibilityIncrement
		let nested = true
		env.render({ value: 20, onValueChange: (value: unknown) => { calls.push(value); if (nested) { nested = false; increment() } } })
		increment(); expect(calls).toEqual([21])
		env.render({ value: 20, onValueChange: () => { throw Error('consumer failed') } })
		expect(() => increment()).toThrow('consumer failed')
		env.render({ value: 20, onValueChange: (value: unknown) => calls.push(value) }); increment()
		expect(calls).toEqual([21, 21])
	} finally { env.root.unmount() }
})

it('an external controlled value retires the AppKit drag preview and its remaining deltas', () => {
	const calls: unknown[] = [], changed = (value: unknown) => calls.push(value), env = mount(Slider, { value: 20, onValueChange: changed })
	try {
		const host = env.named('vx-slider--appkit')[0], thumb = env.named('vx-slider-thumb')[0], view = { bounds: { size: { width: 120 } } }
		const pan = (state: number, deltaX: number) => { host.props.onPan({ state, x: 30 + deltaX, deltaX, deltaY: 0, view }); flushUniversalSync(() => {}) }
		pan(1, 0); pan(2, 10); expect(thumb.props.accessibilityValue).toBe('30'); expect(calls).toEqual([30])
		env.render({ value: 60, onValueChange: changed }); expect(thumb.props.accessibilityValue).toBe('60')
		pan(2, 20); pan(3, 30); expect(calls).toEqual([30]); expect(thumb.props.accessibilityValue).toBe('60')
	} finally { env.root.unmount() }
})

it('matching controlled feedback keeps an AppKit drag while mode, limits and blocking changes retire it', () => {
	let selected: number | [number, number] = 20
	const requests: unknown[] = [], env = mount(Slider, { value: selected })
	const props = () => ({ value: selected, onValueChange: (value: number | [number, number]) => { selected = value; requests.push(value); env.render(props()) } })
	try {
		env.render(props())
		const host = env.named('vx-slider--appkit')[0], view = { bounds: { size: { width: 120 } } }, thumb = () => env.named('vx-slider-thumb')[0]
		const pan = (state: number, deltaX: number) => { host.props.onPan?.({ state, x: 30 + deltaX, deltaX, deltaY: 0, view }); flushUniversalSync(() => {}) }
		pan(1, 0); pan(2, 10); pan(2, 20); pan(3, 20); expect(requests).toEqual([30, 40]); expect(thumb().props.accessibilityValue).toBe('40')
		for (const replacement of [{ defaultValue: 10 }, { value: 40, step: 5 }, { value: 40, isReadOnly: true }]) {
			env.render({ value: 40, onValueChange: (value: unknown) => requests.push(value) }); pan(1, 0); pan(2, 5)
			const before = requests.length
			env.render({ ...replacement, onValueChange: (value: unknown) => requests.push(value) })
			pan(2, 20); pan(3, 20); expect(requests).toHaveLength(before)
		}
	} finally { env.root.unmount() }
})

it('a keyboard adjustment retires an active AppKit drag instead of leaving its preview over parent state', () => {
	const calls: unknown[] = [], env = mount(Slider, { value: 20, onValueChange: (value: unknown) => calls.push(value) })
	try {
		const host = env.named('vx-slider--appkit')[0], thumb = env.named('vx-slider-thumb')[0], view = { bounds: { size: { width: 120 } } }
		const pan = (state: number, deltaX: number) => { host.props.onPan({ state, x: 30 + deltaX, deltaX, deltaY: 0, view }); flushUniversalSync(() => {}) }
		pan(1, 0); pan(2, 10); expect(thumb.props.accessibilityValue).toBe('30')
		key(thumb, 'ArrowRight'); expect(calls).toEqual([30, 31]); expect(thumb.props.accessibilityValue).toBe('20')
		pan(2, 20); pan(3, 20); expect(calls).toEqual([30, 31])
	} finally { env.root.unmount() }
})
