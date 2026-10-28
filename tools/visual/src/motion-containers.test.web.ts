import { attachProjection } from '../../../packages/motion/src/projection/adapter'
import { attachDrag } from '../../../packages/motion/src/drag'
import { Controller } from '../../../packages/motion/src/controller'
import type { HostAdapter } from '../../../packages/motion/src/host-types'
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
	const adapters = new Map<ProjectionNode, HostAdapter>()
	const mount = (element: HTMLElement, parent?: ProjectionNode, id?: string) => {
		const adapter = attachHost(element)
		const node = new ProjectionNode(parent)
		node.options = {
			animationType: 'both',
			layoutId: id,
			transition: { duration: 0.4, ease: 'linear' },
		}
		adapters.set(node, attachProjection(node, adapter))
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
		adapters,
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

it('keeps a dragged card under the pointer through ancestor layout changes and release', async () => {
	const h = harness()
	const parent = document.createElement('div'),
		card = document.createElement('div')
	parent.style.cssText = 'position:relative;width:300px;height:200px'
	card.style.cssText =
		'position:absolute;left:20px;top:20px;width:100px;height:100px;touch-action:none'
	parent.append(card)
	h.host.append(parent)
	const p = h.mount(parent),
		node = h.mount(card, p)
	const adapter = h.adapters.get(node)!
	const controller = new Controller(clock)
	controller.seed(adapter.read())
	controller.attach(adapter)
	const props = { drag: true as const, dragMomentum: false }
	const off = attachDrag(
		adapter,
		controller,
		props,
		(axis) => controller.value(axis),
		() => false,
		() => props,
		() => node,
	)
	const pointer = (type: string, x: number) =>
		card.dispatchEvent(
			new PointerEvent(type, {
				pointerId: 21,
				clientX: x,
				clientY: 30,
				button: 0,
				isPrimary: true,
				bubbles: true,
			}),
		)
	const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	try {
		await h.commit()
		card.style.left = '80px'
		await h.commit()
		await sleep(80)
		expect(node.currentAnimation).toBeDefined()
		const moving = card.getBoundingClientRect().x
		pointer('pointerdown', 30)
		pointer('pointermove', 50)
		await frame()
		const before = card.getBoundingClientRect().x
		expect(before).toBeCloseTo(moving + 20, 0)
		expect(node.isAnimationBlocked).toBe(true)
		parent.style.marginLeft = '100px'
		card.style.left = '40px'
		await h.commit()
		expect(node.currentAnimation).toBeUndefined()
		expect(card.getBoundingClientRect().x).toBeCloseTo(before, 0)
		await sleep(120)
		expect(card.getBoundingClientRect().x).toBeCloseTo(before, 0)
		pointer('pointermove', 60)
		await frame()
		expect(card.getBoundingClientRect().x).toBeCloseTo(before + 10, 0)
		pointer('pointerup', 60)
		await h.commit()
		expect(node.isAnimationBlocked).toBe(false)
		expect(card.getBoundingClientRect().x).toBeCloseTo(before + 10, 0)
		await sleep(450)
		expect(card.getBoundingClientRect().x).toBeCloseTo(before + 10, 0)
	} finally {
		off()
		controller.destroy()
		h.dispose()
	}
})

it('snaps a root and animates its anchored child relative to the new root position', async () => {
	const h = harness()
	const parent = document.createElement('div'),
		card = document.createElement('div')
	parent.style.cssText = 'position:relative;width:250px;height:100px'
	card.style.cssText = 'position:absolute;left:20px;top:20px;width:30px;height:30px'
	parent.append(card)
	h.host.append(parent)
	const p = h.mount(parent),
		c = h.mount(card, p)
	p.options.layoutRoot = true
	c.options.layoutAnchor = { x: 1, y: 1 }
	try {
		await h.commit()
		const before = card.getBoundingClientRect().x
		parent.style.marginLeft = '100px'
		card.style.left = '40px'
		await h.commit()
		expect(parent.getBoundingClientRect().x).toBeCloseTo(100, 0)
		expect(card.getBoundingClientRect().x).toBeCloseTo(before + 100, 0)
		await sleep(500)
		expect(card.getBoundingClientRect().x).toBeCloseTo(before + 120, 0)
	} finally {
		h.dispose()
	}
})

it('preserves intentional channel scaling of corners through a layout animation', async () => {
	const h = harness()
	const card = document.createElement('div')
	card.style.cssText =
		'width:100px;height:100px;border-radius:20px;box-shadow:0px 4px 12px 0px black'
	h.host.append(card)
	const node = h.mount(card)
	const adapter = h.adapters.get(node)!
	const controller = new Controller(clock)
	controller.seed({ ...adapter.read(), scale: 2 })
	controller.attach(adapter)
	const radius = () => {
		const value = getComputedStyle(card).borderTopLeftRadius
		const width = card.getBoundingClientRect().width
		return value.includes('%')
			? (parseFloat(value) / 100) * width
			: (parseFloat(value) * width) / card.offsetWidth
	}
	const blur = () => {
		const parts = [...getComputedStyle(card).boxShadow.matchAll(/(-?[\d.]+)px/g)]
		return (Number(parts[2][1]) * card.getBoundingClientRect().width) / card.offsetWidth
	}
	try {
		await h.commit()
		expect(radius()).toBeCloseTo(40, 0)
		expect(blur()).toBeCloseTo(24, 0)
		card.style.width = card.style.height = '200px'
		await h.commit()
		expect(card.getBoundingClientRect().width).toBeCloseTo(200, 0)
		expect(radius()).toBeCloseTo(40, 0)
		expect(blur()).toBeCloseTo(24, 0)
		await sleep(160)
		expect(radius()).toBeCloseTo(40, 0)
		expect(blur()).toBeCloseTo(24, 0)
		await sleep(350)
		expect(radius()).toBeCloseTo(40, 0)
		expect(blur()).toBeCloseTo(24, 0)
		expect(card.getBoundingClientRect().width).toBeCloseTo(400, 0)
	} finally {
		controller.destroy()
		h.dispose()
	}
})
