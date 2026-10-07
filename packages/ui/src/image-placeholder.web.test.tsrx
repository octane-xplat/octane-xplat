// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Image } from './Image.web.tsrx'

const roots: any[] = []

function mount(props: any = {}) {
	vi.useFakeTimers()
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const render = (next: any = {}) => act(() => root.render(<Image {...props} {...next} />))
	render()
	return { root, render, el, img: el.firstElementChild as HTMLImageElement }
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
	vi.useRealTimers()
})

it('serves the placeholder through the same <img>, then swaps to src on placeholder load', () => {
	const { img } = mount({ src: 'https://x/photo.png', placeholder: 'blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj' })
	expect(img.getAttribute('src')).toMatch(/^data:image\/png;base64,iVBORw0KGgo/)
	act(() => img.dispatchEvent(new Event('load')))
	expect(img.getAttribute('src')).toBe('https://x/photo.png')
})

it('swaps to src when the placeholder errors', () => {
	const { img } = mount({ src: 'https://x/photo.png', placeholder: 'blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj' })
	act(() => img.dispatchEvent(new Event('error')))
	expect(img.getAttribute('src')).toBe('https://x/photo.png')
})

it('passes non-hash placeholders through as plain URLs', () => {
	const { img } = mount({ src: 'https://x/photo.png', placeholder: 'https://x/tiny.jpg' })
	expect(img.getAttribute('src')).toBe('https://x/tiny.jpg')
	act(() => img.dispatchEvent(new Event('load')))
	expect(img.getAttribute('src')).toBe('https://x/photo.png')
})

it('does not re-run the placeholder when src is already complete', () => {
	const { img } = mount({ src: 'https://x/photo.png' })
	expect(img.getAttribute('src')).toBe('https://x/photo.png')
})
