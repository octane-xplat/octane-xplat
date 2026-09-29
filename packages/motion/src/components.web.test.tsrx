import { act, createRoot, useEffect } from 'octane'
import { describe, expect, it, vi } from 'vitest'
import { motion, MotionConfig, useMotionValue, useTransform, useSpring } from './index.web'

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
	<MotionConfig reducedMotion="always"><motion.Pressable id="reduced" initial={{ x: 0 }} animate={{ x: 100 }} transition={{ duration: 10 }} /></MotionConfig>
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
	<MotionConfig reducedMotion="user"><motion.View id="user-reduced" animate={{ x: 100 }} transition={{ duration: 10 }} /></MotionConfig>
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
