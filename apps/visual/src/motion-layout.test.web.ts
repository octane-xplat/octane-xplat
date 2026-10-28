import { expect, it } from 'vitest'
import { createElement, createRoot } from 'octane'
import { motion } from '../../../packages/motion/src/index.web'

// Real browser layout + projection; no captures or image comparison. Stays in
// the local-only browser lane, out of the PR checks gate.
it('keeps a layout="position" child at constant size while the parent expands', async () => {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)

	const view = (open: boolean) =>
		createElement(
			motion.View,
			{
				layout: true,
				transition: { duration: 0.4, ease: 'linear' },
				style: { width: open ? 200 : 100, height: 100 },
			},
			createElement(motion.View, {
				layout: 'position',
				transition: { duration: 0.4, ease: 'linear' },
				style: { width: 50, height: 50 },
			}),
		)

	try {
		root.render(view(false))
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
		const parent = host.firstElementChild as HTMLElement
		const child = parent.firstElementChild as HTMLElement
		const beforeParent = parent.getBoundingClientRect()
		expect(beforeParent.width).toBe(100)

		const beforeChild = child.getBoundingClientRect()

		root.render(view(true))
		// The microtask pass must install the inverse projection before paint:
		// after microtask flushes but before any rAF, nothing may have moved.
		// (Octane's layout effects themselves take a microtask hop.)
		await Promise.resolve()
		await Promise.resolve()
		await Promise.resolve()
		const flashedParent = parent.getBoundingClientRect()
		const flashedChild = child.getBoundingClientRect()
		expect(Math.abs(flashedParent.width - beforeParent.width)).toBeLessThanOrEqual(0.5)
		expect(Math.abs(flashedChild.x - beforeChild.x)).toBeLessThanOrEqual(0.5)
		expect(Math.abs(flashedChild.width - beforeChild.width)).toBeLessThanOrEqual(0.5)

		await new Promise((resolve) => setTimeout(resolve, 200))

		const midParent = parent.getBoundingClientRect()
		const midChild = child.getBoundingClientRect()
		expect(midParent.width).toBeGreaterThan(beforeParent.width + 10)
		expect(midParent.width).toBeLessThan(190)
		expect(midParent.x).toBeCloseTo(beforeParent.x, 0)
		expect(midChild.width).toBeCloseTo(50, 0)
		expect(Math.abs(midChild.width - 50)).toBeLessThanOrEqual(0.5)
		expect(midChild.x).toBeCloseTo(0, 0)

		await new Promise((resolve) => setTimeout(resolve, 400))
		const afterParent = parent.getBoundingClientRect()
		const afterChild = child.getBoundingClientRect()
		expect(afterParent.width).toBeCloseTo(200, 0)
		expect(afterChild.width).toBeCloseTo(50, 0)
		expect(afterChild.x).toBeCloseTo(0, 0)
	} finally {
		root.unmount()
		host.remove()
	}
})

it('keeps the animation origin in content coordinates after nested scrolling', async () => {
	const outer = document.createElement('div')
	outer.style.cssText = 'width:300px;height:150px;overflow:auto'
	const inner = document.createElement('div')
	inner.style.cssText = 'width:250px;height:300px;overflow:auto'
	const host = document.createElement('div')
	host.style.height = '600px'
	inner.append(host)
	outer.append(inner)
	document.body.append(outer)
	const root = createRoot(host)
	const view = (offset: number) =>
		createElement(motion.View, {
			layout: true,
			transition: { duration: 0.4, ease: 'linear' },
			style: { marginTop: offset, width: 100, height: 50 },
		})
	const flush = async () => {
		for (let i = 0; i < 8; i++) {
			await Promise.resolve()
		}
	}
	try {
		root.render(view(150))
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
		const element = host.firstElementChild as HTMLElement
		outer.scrollTop = 20
		inner.scrollTop = 70
		const before = element.getBoundingClientRect().top
		root.render(view(150))
		await flush()
		expect(element.getBoundingClientRect().top).toBeCloseTo(before, 1)
		expect(element.style.transform).not.toContain('translate3d')
		root.render(view(190))
		await flush()
		expect(Math.abs(element.getBoundingClientRect().top - before)).toBeLessThan(0.5)
		await new Promise((resolve) => setTimeout(resolve, 180))
		const mid = element.getBoundingClientRect().top
		expect(mid).toBeGreaterThan(before + 5)
		expect(mid).toBeLessThan(before + 35)
		await new Promise((resolve) => setTimeout(resolve, 400))
		expect(element.getBoundingClientRect().top).toBeCloseTo(before + 40, 1)
	} finally {
		root.unmount()
		outer.remove()
	}
})
