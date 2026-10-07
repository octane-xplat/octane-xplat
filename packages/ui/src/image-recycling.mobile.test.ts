import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	ScrollView: class ScrollView {},
	ImageSource: { fromBase64Sync: (data: string) => ({ base64: data }) },
}))

// The svg leaf registers <svgview> via a vendored submodule; raster srcs
// never consult it, so the test stubs the router out.
vi.mock('./svg', () => ({
	isSvgSrc: () => false,
	svgSource: (src: string) => src,
}))

import { Image } from './Image'

describe('Image recyclingKey', () => {
	it('clears the previous bitmap only when a recycled cell binds a new identity', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))

		root.render(Image as any, { src: 'https://img/1.png', recyclingKey: 'a' })
		const host = container.children[0] as any
		// The sized binding holds src until the view reports a real layout.
		host.getMeasuredWidth = () => 800
		host.getMeasuredHeight = () => 600

		// Simulate a completed load: the native view holds a decoded bitmap.
		host.imageSource = { bitmap: 'first' }

		// Same identity, new src — the bitmap is still this item's predecessor;
		// it stays while the sized binding issues the replacement.
		root.render(Image as any, { src: 'https://img/2.png', recyclingKey: 'a' })
		expect(host.imageSource).toEqual({ bitmap: 'first' })
		expect(host.src).toBe('https://img/2.png')

		// Recycled cell rebound to a different item — blank before the new load.
		root.render(Image as any, { src: 'https://img/3.png', recyclingKey: 'b' })
		expect(host.imageSource).toBeNull()
		expect(host.src).toBe('https://img/3.png')

		// New identity but identical src — the bitmap is already correct.
		host.imageSource = { bitmap: 'third' }
		root.render(Image as any, { src: 'https://img/3.png', recyclingKey: 'c' })
		expect(host.imageSource).toEqual({ bitmap: 'third' })

		// No key at all — never blanks on src change.
		root.render(Image as any, { src: 'https://img/4.png' })
		expect(host.imageSource).toEqual({ bitmap: 'third' })
		expect(host.src).toBe('https://img/4.png')

		root.unmount()
	})
})
