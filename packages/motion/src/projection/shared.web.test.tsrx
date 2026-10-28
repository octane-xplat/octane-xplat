import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
import { motion, LayoutGroup, Presence } from '../index.web'

const frames = vi.hoisted(() => ({ time: 0, id: 0, queue: new Map<number, () => void>() }))
vi.mock('../clock', () => ({
	clock: {
		now: () => frames.time,
		request: (callback: () => void) => {
			const id = ++frames.id
			frames.queue.set(id, callback)
			return id
		},
		cancel: (id: number) => {
			frames.queue.delete(id)
		},
	},
}))

function advance(ms: number) {
	frames.time += ms
	const queued = [...frames.queue.values()]
	frames.queue.clear()
	for (const callback of queued) {
		callback()
	}
}

function App(props: { next: boolean; retain?: boolean }) @{
	<>
		<LayoutGroup id="first">
			@if (props.retain) {
				<Presence present={!props.next}>
					<motion.View
						id="old"
						layoutId="card"
						style={{ width: 100 }}
						transition={{ duration: 0.1 }}
					/>
				</Presence>
			} @else if (!props.next) {
				<motion.View id="old" layoutId="card" transition={{ duration: 0.1 }} />
			}
			@if (props.next) {
				<motion.View id="next" layoutId="card" transition={{ duration: 0.1 }} />
			}
		</LayoutGroup>
		<LayoutGroup id="second">
			<motion.View id="isolated" layoutId="card" />
		</LayoutGroup>
	</>
}

it('hands off across component lifetimes and isolates group namespaces', async () => {
	const container = document.createElement('div')
	document.body.append(container)
	const original = Element.prototype.getBoundingClientRect
	Element.prototype.getBoundingClientRect = function () {
		const x = this.id === 'next' ? 200 : this.id === 'isolated' ? 500 : 0
		return {
			x,
			y: 0,
			left: x,
			right: x + 100,
			top: 0,
			bottom: 100,
			width: 100,
			height: 100,
		} as DOMRect
	}

	const root = createRoot(container)
	try {
		act(() => root.render(<App next={false} retain />))
		await act(async () => {})
		act(() => root.render(<App next retain />))
		await act(async () => {})
		const next = container.querySelector('#next') as HTMLElement
		expect(next.style.transform).toContain('-200px')
		expect(container.querySelector('#old')).not.toBeNull()
		expect((container.querySelector('#isolated') as HTMLElement).style.transform).not.toContain(
			'translate3d',
		)

		act(() => advance(150))
		await act(async () => {})

		expect(container.querySelector('#old')).toBeNull()
		expect(next.style.opacity).toBe('1')
	} finally {
		root.unmount()
		container.remove()
		Element.prototype.getBoundingClientRect = original
	}
})

it('hands off when the source unmounts in the same commit without Presence', async () => {
	const container = document.createElement('div')
	document.body.append(container)
	const original = Element.prototype.getBoundingClientRect
	Element.prototype.getBoundingClientRect = function () {
		const x = this.id === 'next' ? 200 : this.id === 'isolated' ? 500 : 0
		return {
			x,
			y: 0,
			left: x,
			right: x + 100,
			top: 0,
			bottom: 100,
			width: 100,
			height: 100,
		} as DOMRect
	}

	const root = createRoot(container)
	try {
		act(() => root.render(<App next={false} />))
		await act(async () => {})
		act(() => root.render(<App next />))
		await act(async () => {})
		expect(container.querySelector('#old')).toBeNull()
		expect((container.querySelector('#next') as HTMLElement).style.transform).toContain('-200px')
	} finally {
		root.unmount()
		container.remove()
		Element.prototype.getBoundingClientRect = original
	}
})
