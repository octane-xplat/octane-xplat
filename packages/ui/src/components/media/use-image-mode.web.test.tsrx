/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { useImageMode } from './use-image-mode.web.tsrx'
import type { UseImageModeOptions } from '../../props'

function Reader(props: { src: string; options?: UseImageModeOptions }) {
	const mode = useImageMode(props.src, props.options)
	return <span>{mode ?? 'pending'}</span>
}

const roots: ReturnType<typeof createRoot>[] = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
	vi.unstubAllGlobals()
})

function mount(src: string, options: UseImageModeOptions = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const render = (nextSrc: string, nextOptions: UseImageModeOptions = options) =>
		act(() => root.render(<Reader src={nextSrc} options={nextOptions} />))

	render(src)
	return { el, render }
}

function sampling(rgb: number[]) {
	const bitmap = { width: 100, height: 100, close: vi.fn() }
	const drawImage = vi.fn()
	const data = new Uint8ClampedArray(400)
	for (let i = 0; i < data.length; i += 4) {
		data.set([...rgb, 255], i)
	}

	vi.stubGlobal(
		'createImageBitmap',
		vi.fn(async () => bitmap),
	)

	vi.stubGlobal(
		'OffscreenCanvas',
		class {
			getContext() {
				return { drawImage, getImageData: () => ({ data }) }
			}
		},
	)

	const setRgb = (next: number[]) => {
		for (let i = 0; i < data.length; i += 4) {
			data.set([...next, 255], i)
		}
	}

	return { bitmap, drawImage, setRgb }
}

it('returns fallback while loading, samples the requested region and closes the bitmap', async () => {
	const { bitmap, drawImage } = sampling([255, 255, 255])
	let resolve!: (response: unknown) => void
	vi.stubGlobal(
		'fetch',
		vi.fn(
			() =>
				new Promise((done) => {
					resolve = done
				}),
		),
	)

	const { el } = mount('/white.png', {
		region: { x: 0.5, y: 0, width: 0.5, height: 0.5 },
		fallback: 'dark',
	})

	expect(el.textContent).toBe('dark')
	resolve({ ok: true, blob: async () => new Blob() })
	await vi.waitFor(() => expect(el.textContent).toBe('light'))
	expect(drawImage).toHaveBeenCalledWith(bitmap, 50, 0, 50, 50, 0, 0, 10, 10)
	expect(bitmap.close).toHaveBeenCalledOnce()
})

it('discards cancelled loads and resets immediately when source or sampling options change', async () => {
	const { bitmap, setRgb } = sampling([0, 0, 0])
	const pending: ((response: unknown) => void)[] = []
	vi.stubGlobal(
		'fetch',
		vi.fn(
			() =>
				new Promise((done) => {
					pending.push(done)
				}),
		),
	)

	const { el, render } = mount('/a.png')
	render('/b.png')
	pending[1]({ ok: true, blob: async () => new Blob() })
	await vi.waitFor(() => expect(el.textContent).toBe('dark'))
	setRgb([255, 255, 255])
	pending[0]({ ok: true, blob: async () => new Blob() })
	await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledTimes(2))
	expect(el.textContent).toBe('dark')
	render('/b.png', { threshold: 0.9, fallback: 'light' })
	expect(el.textContent).toBe('light')
})

it('keeps the declared fallback on failed fetches', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => {
			throw new Error('unavailable')
		}),
	)

	const { el } = mount('/missing.png', { fallback: 'light' })
	await vi.waitFor(() => expect(el.textContent).toBe('light'))
})
