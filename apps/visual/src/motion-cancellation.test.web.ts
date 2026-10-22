import { expect, it } from 'vitest'
import { attachHost } from '../../../packages/motion/src/host.web'

// Real browser WAAPI and DOM geometry; no captures, image comparison, or OS
// input. This stays in the local-only browser task rather than the PR gate.
it.fails('preserves centered scale geometry when a delegated animation is cancelled', async () => {
	const element = document.createElement('div')
	element.style.cssText = 'width:100px;height:100px;transform-origin:50px 50px'
	document.body.append(element)
	const host = attachHost(element)
	const run = host.delegate!({
		target: { scaleX: 2, scaleY: 2 },
		dest: { scaleX: 2, scaleY: 2 },
		eff: { scaleX: 2, scaleY: 2 },
		transition: { duration: 1, ease: 'linear' },
	})
	let cancelled = false
	try {
		expect(run).not.toBeNull()
		const [animation] = element.getAnimations()
		expect(animation).toBeDefined()
		animation.pause()
		animation.currentTime = 500
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
		const before = element.getBoundingClientRect()
		expect(before.width).toBeCloseTo(150)
		run!.cancel()
		cancelled = true
		const after = element.getBoundingClientRect()
		expect(after.x).toBeCloseTo(before.x)
		expect(after.y).toBeCloseTo(before.y)
		expect(after.width).toBeCloseTo(before.width)
		expect(after.height).toBeCloseTo(before.height)
	} finally {
		if (!cancelled) {
			run?.cancel()
		}
		host.restore()
		element.remove()
	}
})
