import { act, createRoot, useEffect } from 'octane'
import { describe, expect, it, vi } from 'vitest'
import { motion, Presence, MotionConfig, useMotionValue, useTransform, useSpring } from './index.web'

function Box(props: any) @{
	<motion.View id="box" initial={{ x: 20 }} animate={props.target} transition={{ duration: 0 }} onAnimationComplete={props.done} />
}

function Values(props: any) @{
	const x = useMotionValue(2)
	const doubled = useTransform(x, (value) => value * 2)
	const spring = useSpring(x)
	useEffect(() => { props.ready({ x, doubled, spring }) }, [])

	<motion.Row id="values" style={{ x, scaleX: doubled }} />
}

function Reduced() @{
	<MotionConfig reducedMotion="always"><motion.Pressable id="reduced" initial={{ x: 0 }} animate={{ x: 100 }} transition={{ type: 'spring' }} /></MotionConfig>
}

function mount(component: any) {
	const container = document.createElement('div'); document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(component))
	return { container, root, close() { root.unmount(); container.remove() } }
}

describe('motion hosts', () => {
	it('updates destinations without remounting and suppresses equal-target restarts', async () => {
		const done = vi.fn(); const mounted = mount(<Box target={{ x: 50 }} done={done} />)
		await act(async () => {})
		const node = mounted.container.querySelector('#box') as HTMLElement
		expect(node.style.transform).toContain('translateX(50px)')
		expect(done).toHaveBeenCalledTimes(1)
		act(() => mounted.root.render(<Box target={{ x: 50 }} done={done} />))
		await act(async () => {})
		expect(done).toHaveBeenCalledTimes(1)
		act(() => mounted.root.render(<Box target={{ x: 80 }} done={done} />))
		await act(async () => {})
		expect(mounted.container.querySelector('#box')).toBe(node)
		expect(node.style.transform).toContain('translateX(80px)')
		expect(done).toHaveBeenCalledTimes(2)
		mounted.close()
	})

	it('binds and derives values without rerender and destroys owned values', () => {
		let values: any
		const mounted = mount(<Values ready={(next: any) => { values = next }} />)
		act(() => values.x.set(10))
		const node = mounted.container.querySelector('#values') as HTMLElement
		expect(node.style.transform).toContain('translateX(10px)')
		expect(node.style.transform).toContain('scaleX(20)')
		values.spring.jump(7); expect(values.spring.get()).toBe(7)
		mounted.close()
		values.x.set(30); expect(values.x.get()).toBe(10)
	})

	it('reduces transforms through configuration', () => {
		const mounted = mount(<Reduced />)
		expect((mounted.container.querySelector('#reduced') as HTMLElement).style.transform).toContain('translateX(100px)')
		mounted.close()
	})
})

function InitialFalse() @{
	<motion.View id="instant" initial={false} animate={{ x: 25 }} transition={{ duration: 100 }} />
}

function Binding(props: any) @{
	<motion.View id="binding" style={props.style} />
}

function DemoFixture() @{
	<MotionDemo />
}

import { MotionDemo } from '../examples/MotionDemo.tsrx'
import { MotionValue } from './value'
import { clock } from './clock.web'

describe('binding lifecycle', () => {
	it('initial=false applies the destination before playback', () => {
		const mounted = mount(<InitialFalse />)
		expect((mounted.container.querySelector('#instant') as HTMLElement).style.transform).toContain('translateX(25px)')
		mounted.close()
	})

	it('swaps values, removes bindings and preserves independent axes', () => {
		const x = new MotionValue(10, clock), next = new MotionValue(20, clock)
		const mounted = mount(<Binding style={{ x, rotate: 30 }} />)
		const node = mounted.container.querySelector('#binding') as HTMLElement
		act(() => mounted.root.render(<Binding style={{ x: next, rotate: 30 }} />))
		x.set(60)
		expect(node.style.transform).toContain('translateX(20px)')
		act(() => mounted.root.render(<Binding style={{ rotate: 30 }} />))
		next.set(80)
		expect(node.style.transform).toContain('translateX(0px)')
		expect(node.style.transform).toContain('rotate(30deg)')
		mounted.close(); x.destroy(); next.destroy()
	})

	it('mounts the maintained demonstration', () => {
		const mounted = mount(<DemoFixture />)
		expect(mounted.container.textContent).toContain('Drag, then release')
		mounted.close()
	})
})

import { signal$ } from 'octane/signals'
const position$ = signal$(0)
function SignalBox() @{
	<motion.View id="signal" animate={{ x: position$.get() }} transition={{ duration: 0 }} />
}

it('retargets from a render-time signal read', () => {
	const mounted = mount(<SignalBox />)
	act(() => position$.set(40))
	expect((mounted.container.querySelector('#signal') as HTMLElement).style.transform).toContain('translateX(40px)')
	mounted.close(); position$.set(0)
})

function UserReduced() @{
	<MotionConfig reducedMotion="user"><motion.View id="user-reduced" animate={{ x: 100 }} transition={{ type: 'spring' }} /></MotionConfig>
}

it('observes live system reduced-motion changes', () => {
	let reduced = false
	const callbacks = new Set<() => void>()
	vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener(_type: string, cb: () => void) { callbacks.add(cb) }, removeEventListener(_type: string, cb: () => void) { callbacks.delete(cb) } }))
	const mounted = mount(<UserReduced />)
	act(() => { reduced = true; callbacks.forEach((cb) => cb()) })
	expect((mounted.container.querySelector('#user-reduced') as HTMLElement).style.transform).toContain('translateX(100px)')
	mounted.close(); expect(callbacks.size).toBe(0); vi.unstubAllGlobals()
})

import { useAnimate } from './index.web'
import { View } from '@octane-xplat/ui'

function TapScale() @{
	<motion.Pressable id="tap" animate={{ scale: 1 }} whileTap={{ scale: 1.5 }} whileTapTransition={{ duration: 0 }} transition={{ duration: 0.01 }} />
}

describe('upstream-shaped props', () => {
	it('animates whileTap on pointerdown and returns on release', () => {
		const mounted = mount(<TapScale />)
		const node = mounted.container.querySelector('#tap') as HTMLElement
		node.dispatchEvent(new Event('pointerdown', { bubbles: true }))
		expect(node.style.transform).toContain('scale(1.5)')
		node.dispatchEvent(new Event('pointerup', { bubbles: true }))
		expect(node.style.transform).toContain('scale(1)')
		mounted.close()
	})

	it('animates whileFocus on focus and returns on blur', () => {
		const mounted = mount(<TapFocusCase />)
		const node = mounted.container.querySelector('#focusable') as HTMLElement
		node.dispatchEvent(new Event('focus'))
		expect(node.style.transform).toContain('translateX(20px)')
		node.dispatchEvent(new Event('blur'))
		expect(node.style.transform).toContain('translateX(0px)')
		mounted.close()
	})

	it('fires onAnimationStart and onUpdate for declarative runs', () => {
		const mounted = mount(<CallbackCase />)
		expect(callbackState.started).toBe(1)
		expect(callbackState.updated).toBeGreaterThan(0)
		mounted.close()
		callbackState.started = 0
		callbackState.updated = 0
	})

	it('wraps an arbitrary leaf with motion.create', () => {
		const mounted = mount(<CreatedCase />)
		const node = mounted.container.querySelector('#created') as HTMLElement
		expect(node.style.transform).toContain('translateX(30px)')
		mounted.close()
	})

	it('animates through useAnimate scope and a MotionValue directly', async () => {
		const mounted = mount(<ScopedCase />)
		const node = mounted.container.querySelector('#scoped') as HTMLElement
		await scopedApi.animate({ x: 40 }, { duration: 0 })
		expect(node.style.transform).toContain('translateX(40px)')
		const direct = scopedApi.animate(scopedApi.value, 77, { duration: 0 })
		await direct.finished
		expect(scopedApi.value.get()).toBe(77)
		mounted.close()
	})
})

const callbackState = { started: 0, updated: 0 }
function CallbackCase() @{
	<motion.View
		id="callbacks"
		animate={{ x: 5 }}
		transition={{ duration: 0 }}
		onAnimationStart={() => callbackState.started++}
		onUpdate={() => callbackState.updated++}
	/>
}

function TapFocusCase() @{
	<motion.View id="focusable" animate={{ x: 0 }} whileFocus={{ x: 20 }} whileFocusTransition={{ duration: 0 }} transition={{ duration: 0.01 }} />
}

const MotionCard = motion.create(function Card(props: any) @{
	<View {...props} />
})

function CreatedCase() @{
	<MotionCard id="created" animate={{ x: 30 }} transition={{ duration: 0 }} />
}

const scopedApi: { animate: any; value: MotionValue } = { animate: undefined, value: undefined as any }
function ScopedCase() @{
	const [scope, animate] = useAnimate()
	const value = useMotionValue(0)
	useEffect(() => {
		scopedApi.animate = animate
		scopedApi.value = value
	}, [])

	<motion.View id="scoped" bind={scope} />
}

function DragBox(props: any) @{
	<MotionConfig reducedMotion="never"><motion.View id="drag" {...props} /></MotionConfig>
}

function pointer(node: HTMLElement, type: string, x: number, y = 0, pointerId = 1) {
	const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true })
	Object.defineProperty(event, 'pointerId', { value: pointerId })
	node.dispatchEvent(event)
}

describe('declarative pointer drag', () => {
	it('writes a bound MotionValue live, captures one pointer, clamps, and cleans up', () => {
		const x = new MotionValue(10, clock)
		const started = vi.fn(), moved = vi.fn(), ended = vi.fn()
		const mounted = mount(<DragBox drag="x" style={{ x }} dragConstraints={{ left: -30, right: 30 }} dragElastic={false} dragMomentum={false} onDragStart={started} onDrag={moved} onDragEnd={ended} />)
		const node = mounted.container.querySelector('#drag') as HTMLElement
		node.setPointerCapture = vi.fn()
		expect(node.style.touchAction).toBe('pan-y')
		pointer(node, 'pointerdown', 0)
		pointer(node, 'pointermove', 4)
		expect(started).not.toHaveBeenCalled()
		pointer(node, 'pointermove', 100, 0, 2)
		expect(x.get()).toBe(10)
		pointer(node, 'pointermove', 100)
		expect(x.get()).toBe(30)
		expect(node.style.transform).toContain('translateX(30px)')
		pointer(node, 'pointerup', 100)
		expect(started).toHaveBeenCalledTimes(1)
		expect(ended).toHaveBeenCalledTimes(1)
		expect(node.setPointerCapture).toHaveBeenCalledWith(1)
		mounted.close()
		pointer(node, 'pointerdown', 0); pointer(node, 'pointermove', -100)
		expect(x.get()).toBe(30)
		expect(node.style.touchAction).toBe('')
		x.destroy()
	})

	it('updates drag axis and disables listeners on prop changes', () => {
		const mounted = mount(<DragBox drag="x" dragMomentum={false} />)
		const node = mounted.container.querySelector('#drag') as HTMLElement
		act(() => mounted.root.render(<DragBox drag="y" dragMomentum={false} />))
		expect(node.style.touchAction).toBe('pan-x')
		pointer(node, 'pointerdown', 0); pointer(node, 'pointermove', 0, 30); pointer(node, 'pointerup', 0, 30)
		expect(node.style.transform).toContain('translateY(30px)')
		act(() => mounted.root.render(<DragBox drag={false} />))
		pointer(node, 'pointerdown', 0); pointer(node, 'pointermove', 0, 80)
		expect(node.style.transform).toContain('translateY(30px)')
		mounted.close()
	})

	it('yields perpendicular movement and reports active cancellation once', () => {
		const end = vi.fn(), start = vi.fn()
		const mounted = mount(<DragBox drag="x" dragMomentum={false} onDragStart={start} onDragEnd={end} />)
		const node = mounted.container.querySelector('#drag') as HTMLElement
		pointer(node, 'pointerdown', 0); pointer(node, 'pointermove', 0, 30)
		expect(start).not.toHaveBeenCalled()
		pointer(node, 'pointerdown', 0); pointer(node, 'pointermove', 30)
		pointer(node, 'pointercancel', 30); pointer(node, 'lostpointercapture', 30)
		expect(end).toHaveBeenCalledTimes(1)
		expect(end.mock.calls[0][1].cancelled).toBe(true)
		mounted.close()
	})
})

function VariantTree(props: any) @{
	<motion.View initial="hidden" animate={props.label} variants={{ hidden: { x: -10 }, show: { x: 10, transition: { duration: 0, when: 'beforeChildren' } }, hide: { x: 0, transition: { duration: 0 } } }}>
		<motion.View id="variant-child" custom={props.custom} variants={{ hidden: { x: -20 }, show: (custom: number) => ({ x: custom, transition: { duration: 0 } }), hide: { x: 0, transition: { duration: 0 } } }} />
		<motion.View id="variant-explicit" animate={{ x: 99 }} transition={{ duration: 0 }} />
	</motion.View>
}

function VariantGesture() @{
	<motion.View id="variant-gesture" animate={['base', 'position']} whileTap="tap" whileFocus="focus" variants={{ base: { scale: 1, transition: { duration: 0 } }, position: { x: 5 }, tap: { scale: 2, transition: { duration: 0 } }, focus: { x: 30, transition: { duration: 0 } } }} />
}

it('inherits labels and initial targets while explicit animate remains independent', async () => {
	const mounted = mount(<VariantTree label="show" custom={40} />)
	const child = mounted.container.querySelector('#variant-child') as HTMLElement
	await act(async () => {})
	expect(child.style.transform).toContain('translateX(40px)')
	expect((mounted.container.querySelector('#variant-explicit') as HTMLElement).style.transform).toContain('translateX(99px)')
	act(() => mounted.root.render(<VariantTree label="hide" custom={40} />))
	await act(async () => {})
	expect(mounted.container.querySelector('#variant-child')).toBe(child)
	expect(child.style.transform).toContain('translateX(0px)')
	mounted.close()
})

it('resolves gesture labels and restores the resolved animate target', () => {
	const mounted = mount(<VariantGesture />)
	const host = mounted.container.querySelector('#variant-gesture') as HTMLElement
	host.dispatchEvent(new Event('pointerdown'))
	expect(host.style.transform).toContain('scale(2)')
	host.dispatchEvent(new Event('pointerup'))
	expect(host.style.transform).toContain('scale(1)')
	host.dispatchEvent(new Event('focus'))
	expect(host.style.transform).toContain('translateX(30px)')
	host.dispatchEvent(new Event('blur'))
	expect(host.style.transform).toContain('translateX(5px)')
	mounted.close()
})

it('retargets an inherited resolver when custom changes without a new parent label', async () => {
	const mounted = mount(<VariantTree label="show" custom={40} />)
	await act(async () => {})
	act(() => mounted.root.render(<VariantTree label="show" custom={60} />))
	await act(async () => {})
	expect((mounted.container.querySelector('#variant-child') as HTMLElement).style.transform).toContain('translateX(60px)')
	mounted.close()
})

function InitialVariantTree() @{
	<motion.View initial={false} animate="show" variants={{ show: { x: 10 } }}>
		<motion.View id="initial-variant" variants={{ show: { x: 90 } }} />
	</motion.View>
}

it('inherits initial=false and seeds child destinations without playback', () => {
	const mounted = mount(<InitialVariantTree />)
	expect((mounted.container.querySelector('#initial-variant') as HTMLElement).style.transform).toContain('translateX(90px)')
	mounted.close()
})

function VariantExit(props: any) @{
	<Presence present={props.present} onExitComplete={props.done}>
		<motion.View id="variant-exit" initial={false} animate="show" exit={['hide', 'offset']} variants={{ show: { x: 0 }, hide: { x: 70, transition: { duration: 0.1 } }, offset: { x: 100 } }} transition={{ duration: 20 }} />
	</Presence>
}

it('uses exit label arrays and their transition overrides under Presence', async () => {
	vi.useFakeTimers()
	const done = vi.fn()
	const mounted = mount(<VariantExit present={true} done={done} />)
	act(() => mounted.root.render(<VariantExit present={false} done={done} />))
	expect(mounted.container.querySelector('#variant-exit')).not.toBeNull()
	await act(async () => { await vi.advanceTimersByTimeAsync(160) })
	expect(mounted.container.querySelector('#variant-exit')).toBeNull()
	expect(done).toHaveBeenCalledOnce()
	mounted.close()
	vi.useRealTimers()
})
