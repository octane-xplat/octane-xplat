// @vitest-environment jsdom
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'

// Resolve from the engine-owning package; UI itself does not depend on Lottie.
let workspaceRoot = process.cwd()
while (!existsSync(join(workspaceRoot, 'packages/lottie/package.json'))) {
	const parent = dirname(workspaceRoot)
	if (parent === workspaceRoot) {
		throw new Error('Cannot locate the Lottie package in the framework workspace')
	}

	workspaceRoot = parent
}

const requireLottie = createRequire(join(workspaceRoot, 'packages/lottie/package.json'))
const loadAnimation = vi.fn()
let Lottie: (typeof import('../../../../lottie/src/Lottie.web.tsrx'))['Lottie']

beforeAll(async () => {
	vi.doMock(requireLottie.resolve('lottie-web'), () => ({ default: { loadAnimation } }))
	;({ Lottie } = await import('../../../../lottie/src/Lottie.web.tsrx'))
})

afterEach(() => loadAnimation.mockReset())

it('keeps controlled playback paused when loading finishes after playing becomes false', () => {
	const events = new Map<string, () => void>()
	const animation = {
		addEventListener: (name: string, listener: () => void) => events.set(name, listener),
		destroy: vi.fn(),
		play: vi.fn(),
		pause: vi.fn(),
		getDuration: () => 1,
	}
	loadAnimation.mockReturnValue(animation)
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	try {
		act(() => root.render(Lottie, { src: 'animation.json', playing: true }))
		expect(loadAnimation).toHaveBeenCalledTimes(1)
		expect(events.has('DOMLoaded')).toBe(true)
		expect(animation.play).not.toHaveBeenCalled()
		act(() => root.render(Lottie, { src: 'animation.json', playing: false }))
		act(() => events.get('DOMLoaded')!())
		expect(animation.play).not.toHaveBeenCalled()
	} finally {
		act(() => root.unmount())
		host.remove()
	}
})

it('uses the latest playback intent at readiness and ignores a replaced animation', () => {
	const instances: Array<{
		events: Map<string, () => void>
		play: ReturnType<typeof vi.fn>
		destroy: ReturnType<typeof vi.fn>
	}> = []
	loadAnimation.mockImplementation(() => {
		const events = new Map<string, () => void>()
		const animation = {
			events,
			addEventListener: (name: string, listener: () => void) => events.set(name, listener),
			destroy: vi.fn(),
			play: vi.fn(),
			pause: vi.fn(),
			getDuration: () => 2,
		}
		instances.push(animation)
		return animation
	})
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	const loaded = vi.fn()
	try {
		act(() => root.render(Lottie, { src: 'first.json', playing: false, onLoaded: loaded }))
		act(() => root.render(Lottie, { src: 'first.json', playing: true, onLoaded: loaded }))
		act(() => instances[0].events.get('DOMLoaded')!())
		expect(instances[0].play).toHaveBeenCalledTimes(1)
		expect(loaded).toHaveBeenCalledWith({ duration: 2000 })
		act(() => root.render(Lottie, { src: 'second.json', playing: false, onLoaded: loaded }))
		expect(instances[0].destroy).toHaveBeenCalledTimes(1)
		act(() => instances[0].events.get('DOMLoaded')!())
		expect(instances[0].play).toHaveBeenCalledTimes(1)
		expect(loaded).toHaveBeenCalledTimes(1)
		act(() => instances[1].events.get('DOMLoaded')!())
		expect(instances[1].play).not.toHaveBeenCalled()
		expect(loaded).toHaveBeenCalledTimes(2)
	} finally {
		act(() => root.unmount())
		host.remove()
	}
})
