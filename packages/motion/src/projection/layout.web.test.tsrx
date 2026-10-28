import { act, createRoot } from 'octane'
import { describe, expect, it, vi } from 'vitest'
import { View } from '@octane-xplat/ui'
import { motion } from '../index.web'

// jsdom has no layout engine: geometry is scripted per element through this
// map and read back via the getBoundingClientRect stub below.
const rects = new Map<Element, { x: number; y: number; width: number; height: number }>()

function setRect(element: Element | null, x: number, y: number, width: number, height: number) {
	if (element) {
		rects.set(element, { x, y, width, height })
	}
}

Element.prototype.getBoundingClientRect = function () {
	const r = rects.get(this) ?? { x: 0, y: 0, width: 0, height: 0 }
	return {
		x: r.x,
		y: r.y,
		width: r.width,
		height: r.height,
		top: r.y,
		left: r.x,
		right: r.x + r.width,
		bottom: r.y + r.height,
		toJSON: () => ({}),
	} as DOMRect
}

const gbrCalls = { count: 0 }
const wrappedGbr = Element.prototype.getBoundingClientRect
Element.prototype.getBoundingClientRect = function () {
	gbrCalls.count++
	return wrappedGbr.call(this)
}

function mount(component: any) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(component))
	return {
		container,
		root,
		close() {
			root.unmount()
			container.remove()
		},
	}
}

const flush = () => act(async () => {})

function Mover(props: any) @{
	<motion.View id="mover" layout transition={{ duration: 0.4 }} style={props.style} />
}

function Reorder(props: any) @{
	<View id="list">
		{props.items.map((item: string) => (
			<motion.View key={item} id={item} layout transition={{ duration: 0.4 }} />
		))}
	</View>
}

function Sibling(props: any) @{
	<View id="wrap">
		<View id="sibling" className={props.className} />
		<motion.View id="tracked" layout transition={{ duration: 0.4 }} />
	</View>
}

describe('motion layout on web', () => {
	it('writes a non-identity transform after a layout-changing re-render', async () => {
		const mounted = mount(<Mover />)
		const el = mounted.container.querySelector('#mover') as HTMLElement
		setRect(el, 0, 0, 100, 100)
		await flush()
		expect(el.style.transform).not.toContain('translate3d')

		setRect(el, 40, 0, 100, 100)
		act(() => mounted.root.render(<Mover />))
		await flush()
		expect(el.style.transform).toMatch(/translate3d\(-[1-9]\d*(\.\d+)?px/)
		mounted.close()
	})

	it('animates a keyed reorder', async () => {
		const mounted = mount(<Reorder items={['a', 'b']} />)
		const a = mounted.container.querySelector('#a') as HTMLElement
		const b = mounted.container.querySelector('#b') as HTMLElement
		setRect(a, 0, 0, 100, 50)
		setRect(b, 0, 50, 100, 50)
		await flush()

		setRect(a, 0, 50, 100, 50)
		setRect(b, 0, 0, 100, 50)
		act(() => mounted.root.render(<Reorder items={['b', 'a']} />))
		await flush()
		expect(a.style.transform).toContain('translate3d')
		expect(b.style.transform).toContain('translate3d')
		mounted.close()
	})

	it('animates when a non-motion sibling mutates the DOM', async () => {
		const mounted = mount(<Sibling className="idle" />)
		const el = mounted.container.querySelector('#tracked') as HTMLElement
		setRect(el, 0, 50, 100, 50)
		await flush()

		setRect(el, 0, 90, 100, 50)
		act(() => mounted.root.render(<Sibling className="loaded" />))
		await flush()
		expect(el.style.transform).toContain('translate3d')
		mounted.close()
	})

	it('does not run passes for plain channel animations', async () => {
		function Channel(props: any) @{
			<View>
				<motion.View id="chan" animate={{ x: 40 }} transition={{ duration: 0.05 }} />
				<motion.View id="watcher" layout />
			</View>
		}

		const mounted = mount(<Channel />)
		await flush()
		gbrCalls.count = 0
		await new Promise((resolve) => setTimeout(resolve, 120))
		const node = mounted.container.querySelector('#chan') as HTMLElement
		expect(node.style.transform).toContain('translateX(40px)')
		expect(gbrCalls.count).toBe(0)
		mounted.close()
	})

	it('restores the plain channel transform when the layout animation completes', async () => {
		function OpacityX() @{
			<motion.View
				id="opx"
				layout
				initial={{ opacity: 0, x: 10 }}
				animate={{ opacity: 1, x: 10 }}
				transition={{ duration: 0.01 }}
			/>
		}

		const mounted = mount(<OpacityX />)
		const el = mounted.container.querySelector('#opx') as HTMLElement
		setRect(el, 0, 0, 100, 100)
		await flush()

		setRect(el, 40, 0, 100, 100)
		act(() => mounted.root.render(<OpacityX />))
		await flush()
		expect(el.style.transform).toContain('translate3d')

		await new Promise((resolve) => setTimeout(resolve, 600))
		expect(el.style.transform).toContain('translateX(10px)')
		expect(el.style.transform).not.toContain('translate3d')
		expect(el.style.opacity).toBe('1')
		mounted.close()
	})

	it('disconnects the observer after the last layout host unmounts', async () => {
		const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
		const mounted = mount(<Mover />)
		act(() => mounted.close())
		await flush()
		expect(disconnect).toHaveBeenCalled()
		disconnect.mockRestore()
	})
})
