// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { Image } from './Image.web.tsrx'

const roots: any[] = []

function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(<Image {...props} />))
	return el.firstElementChild as HTMLImageElement
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
})

it('writes the HTML decoding attribute — async by default, 1:1 when set', () => {
	expect(mount({ src: 'https://x/a.png' }).getAttribute('decoding')).toBe('async')
	expect(mount({ src: 'https://x/a.png', decoding: 'sync' }).getAttribute('decoding')).toBe('sync')
	expect(mount({ src: 'https://x/a.png', decoding: 'async' }).getAttribute('decoding')).toBe('async')
})
