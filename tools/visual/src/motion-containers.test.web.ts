import { expect, it } from 'vitest'
import { attachHost } from '../../../packages/motion/src/host.web'
import { ProjectionNode } from '../../../packages/motion/src/projection/node'
import { ProjectionRoot } from '../../../packages/motion/src/projection/root'
import { barrier } from '../../../packages/motion/src/projection/barrier.web'
import { clock } from '../../../packages/motion/src/clock.web'

// Browser geometry and computed paint only. No captures or image analysis.
function harness() {
	const host = document.createElement('div')
	document.body.append(host)
	const root = new ProjectionRoot({ clock, barrier })
	const cleanups: (() => void)[] = []
	const mount = (element: HTMLElement, parent?: ProjectionNode, id?: string) => {
		const adapter = attachHost(element)
		const node = new ProjectionNode(parent)
		node.options = {
			animationType: 'both',
			layoutId: id,
			transition: { duration: 0.4, ease: 'linear' },
		}
		node.attach({
			measureLayout: () => adapter.measureLayout!(),
			resetProjection: () => adapter.resetProjection!(),
			project: (write) => adapter.project!(write),
		})
		root.add(node)
		cleanups.push(() => {
			root.remove(node)
			adapter.restore()
		})
		return node
	}
	return {
		host,
		root,
		mount,
		async commit() {
			root.invalidate('commit')
			await Promise.resolve()
			await Promise.resolve()
		},
		dispose() {
			cleanups.reverse().forEach((cleanup) => cleanup())
			host.remove()
		},
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

it('keeps numeric corners steady during resizing inside nested projecting scrollers', async () => {
	const h = harness()
	const outer = document.createElement('div'),
		inner = document.createElement('div'),
		card = document.createElement('div')
	outer.style.cssText = 'width:300px;height:150px;overflow:auto'
	inner.style.cssText = 'width:250px;height:400px;overflow:auto'
	card.style.cssText =
		'margin-top:160px;width:100px;height:100px;border-radius:20px;box-shadow:0px 4px 12px 0px black'
	inner.append(card, Object.assign(document.createElement('div'), { style: 'height:500px' }))
	outer.append(inner)
	h.host.append(outer)
	outer.scrollTop = 30
	inner.scrollTop = 50
	const parent = h.mount(inner),
		child = h.mount(card, parent)
	try {
		await h.commit()
		const before = card.getBoundingClientRect()
		card.style.width = card.style.height = '200px'
		await h.commit()
		const initial = card.getBoundingClientRect()
		expect(initial.width).toBeCloseTo(100, 0)
		expect(initial.y).toBeCloseTo(before.y, 0)
		// CSS percentages resolve against the layout border box, then projection scales it.
		const radius = () =>
			(parseFloat(getComputedStyle(card).borderTopLeftRadius) / 100) *
			card.getBoundingClientRect().width

		expect(radius()).toBeCloseTo(20, 0)
		await sleep(160)
		expect(card.getBoundingClientRect().width).toBeGreaterThan(110)
		expect(radius()).toBeCloseTo(20, 0)
		await sleep(350)
		expect(getComputedStyle(card).borderTopLeftRadius).toBe('20px')
		outer.scrollTop += 10
		inner.scrollTop += 10
		await h.commit()
		expect(child.currentAnimation).toBeUndefined()
	} finally {
		h.dispose()
	}
})

it('hands off from a scrolled source after its DOM node has been removed', async () => {
	const h = harness()
	const scroller = document.createElement('div'),
		source = document.createElement('div'),
		destination = document.createElement('div')
	scroller.style.cssText = 'width:200px;height:100px;overflow:auto'
	source.style.cssText = 'margin-top:180px;width:100px;height:80px'
	scroller.append(source, Object.assign(document.createElement('div'), { style: 'height:400px' }))
	h.host.append(scroller)
	const old = h.mount(source, undefined, 'card')
	try {
		await h.commit()
		scroller.scrollTop = 80
		const before = source.getBoundingClientRect()
		source.remove()
		h.root.remove(old)
		destination.style.cssText = 'position:fixed;left:300px;top:200px;width:180px;height:120px'
		h.host.append(destination)
		h.mount(destination, undefined, 'card')
		await h.commit()
		const initial = destination.getBoundingClientRect()
		expect(initial.x).toBeCloseTo(before.x, 0)
		expect(initial.y).toBeCloseTo(before.y, 0)
		expect(initial.width).toBeCloseTo(before.width, 0)
	} finally {
		h.dispose()
	}
})
