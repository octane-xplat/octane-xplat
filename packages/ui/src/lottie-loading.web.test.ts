import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'

// Resolve from the engine-owning package; UI itself does not depend on Lottie.
const requireLottie = createRequire(resolve('../lottie/package.json'))
const loadAnimation = vi.fn()
let Lottie: typeof import('../../lottie/src/Lottie.web.tsrx')['Lottie']

beforeAll(async () => {
	vi.doMock(requireLottie.resolve('lottie-web'), () => ({ default: { loadAnimation } }))
	;({ Lottie } = await import('../../lottie/src/Lottie.web.tsrx'))
})

afterEach(() => loadAnimation.mockReset())

it.fails('keeps controlled playback paused when loading finishes after playing becomes false', () => {
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
