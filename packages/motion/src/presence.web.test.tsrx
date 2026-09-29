import { act, createRoot, useEffect, useState } from 'octane'
import { describe, expect, it, vi } from 'vitest'
import { motion, Presence, MotionConfig } from './index.web'

let mounts = 0, cleanups = 0
function Child(props: any) @{
	const [count, setCount] = useState(0)
	useEffect(() => { mounts++; return () => { cleanups++ } }, [])

	<motion.View id="exiting" initial={false} animate={{ x: 0 }} exit={{ x: 100 }} transition={{ duration: props.duration }}>
		<button id="counter" onClick={() => setCount(count + 1)}>{count}</button>
	</motion.View>
}

function Scene(props: any) @{
	<MotionConfig reducedMotion={props.reduced ? 'always' : 'never'}>
		<Presence present={props.present} onExitComplete={props.done} id="boundary">
			<Child duration={props.duration ?? 0.1} />
		</Presence>
	</MotionConfig>
}

function mount(props: any) {
	const container = document.createElement('div'); document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(<Scene {...props} />))
	return { container, root, update(next: any) { act(() => root.render(<Scene {...next} />)) }, close() { act(() => root.unmount()); container.remove() } }
}

const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

describe('retained presence', () => {
	it('retains component state until exit finishes, blocks input and relinquishes focus', async () => {
		vi.useFakeTimers(); mounts = cleanups = 0
		const done = vi.fn(); const r = mount({ present: true, done })
		const node = r.container.querySelector('#exiting')
		const button = r.container.querySelector('button') as HTMLButtonElement
		act(() => button.click()); button.focus()
		expect(button.textContent).toBe('1')
		r.update({ present: false, done })
		expect(r.container.querySelector('#exiting')).toBe(node)
		expect(cleanups).toBe(0)
		expect(r.container.querySelector('#boundary')?.hasAttribute('inert')).toBe(true)
		expect(document.activeElement).not.toBe(button)
		await advance(160)
		expect(r.container.querySelector('#exiting')).toBeNull()
		expect(cleanups).toBe(1); expect(done).toHaveBeenCalledTimes(1)
		r.close(); vi.useRealTimers()
	})

	it('reverses without remounting or stale removal', async () => {
		vi.useFakeTimers(); mounts = cleanups = 0
		const done = vi.fn(); const r = mount({ present: true, done })
		const node = r.container.querySelector('#exiting')
		r.update({ present: false, done }); await advance(32)
		r.update({ present: true, done }); await advance(200)
		expect(r.container.querySelector('#exiting')).toBe(node)
		expect(mounts).toBe(1); expect(cleanups).toBe(0)
		expect(done).not.toHaveBeenCalled()
		expect(r.container.querySelector('#boundary')?.hasAttribute('inert')).toBe(false)
		r.close(); expect(cleanups).toBe(1); vi.useRealTimers()
	})

	it('disposes immediately when the boundary unmounts', async () => {
		vi.useFakeTimers(); mounts = cleanups = 0
		const done = vi.fn(); const r = mount({ present: true, done })
		r.update({ present: false, done }); r.close()
		expect(cleanups).toBe(1)
		await advance(200); expect(done).not.toHaveBeenCalled()
		vi.useRealTimers()
	})

	it('starts absent, supports repeated cycles and instant reduced exits', async () => {
		vi.useFakeTimers(); mounts = cleanups = 0
		const done = vi.fn(); const r = mount({ present: false, done, reduced: true })
		expect(r.container.querySelector('#exiting')).toBeNull()
		for (let i = 0; i < 2; i++) {
			r.update({ present: true, done, reduced: true }); await advance(1)
			expect(r.container.querySelector('#exiting')).not.toBeNull()
			r.update({ present: false, done, reduced: true }); await advance(1)
			expect(r.container.querySelector('#exiting')).toBeNull()
		}

		expect(done).toHaveBeenCalledTimes(2)
		r.close(); vi.useRealTimers()
	})
})

import { PresenceDemo } from '../examples/PresenceDemo.tsrx'
it('mounts the retained-presence example', () => {
	const container = document.createElement('div'); document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(<PresenceDemo />))
	expect(container.textContent).toContain('Count: 0')
	act(() => root.unmount()); container.remove()
})

import { useMotionValue } from './index.web'
function Independent(props: any) @{
	const x = useMotionValue(0)
	useEffect(() => { props.ready(x) }, [])

	<Presence present={props.present}>
		<motion.View id="independent" style={{ x }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} />
	</Presence>
}

it('exit reversal does not take ownership of independent MotionValue channels', async () => {
	vi.useFakeTimers()
	let x: any
	const ready = (value: any) => { x = value }
	const container = document.createElement('div'); document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(<Independent present={true} ready={ready} />))
	act(() => root.render(<Independent present={false} ready={ready} />))
	await advance(32)
	x.set(50)
	act(() => root.render(<Independent present={true} ready={ready} />))
	await advance(200)
	expect((container.querySelector('#independent') as HTMLElement).style.transform).toContain('translateX(50px)')
	act(() => root.unmount()); container.remove(); vi.useRealTimers()
})
