// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'

const { loadAnimation } = vi.hoisted(() => ({ loadAnimation: vi.fn() }))
vi.mock('lottie-web', () => ({ default: { loadAnimation } }))

import { Lottie } from './Lottie.web.tsrx'

const roots: any[] = []

function mount(props: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push({ root, host })
	act(() => root.render(<Lottie {...props} />))
	return host
}

afterEach(() => {
	for (const { root, host } of roots.splice(0)) {
		act(() => root.unmount())
		host.remove()
	}

	loadAnimation.mockReset()
})

it('reports malformed inline JSON through onError without throwing', () => {
	const onError = vi.fn()
	const host = mount({ src: '{invalid json', onError })

	expect(onError).toHaveBeenCalledTimes(1)
	expect(onError.mock.calls[0][0].message).toMatch(/JSON|position/i)
	expect(loadAnimation).not.toHaveBeenCalled()
	expect(host.firstElementChild).not.toBeNull()
})

it('reports synchronous lottie-web construction failures through onError', () => {
	const onError = vi.fn()
	loadAnimation.mockImplementation(() => {
		throw new Error('invalid animation data')
	})

	mount({ data: { v: '5.0', layers: [] }, onError })

	expect(onError).toHaveBeenCalledWith({ message: 'invalid animation data' })
})

it('binds the created animation handle on initial mount', () => {
	const animation = {
		addEventListener: vi.fn(),
		destroy: vi.fn(),
	} as any

	loadAnimation.mockReturnValue(animation)
	const bind = vi.fn()

	mount({ data: { v: '5.0', layers: [] }, bind })

	expect(bind).toHaveBeenCalledTimes(1)
	expect(bind.mock.calls[0][0].native).toBe(animation)
})
