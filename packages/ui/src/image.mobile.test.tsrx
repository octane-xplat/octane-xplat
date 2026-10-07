/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	ScrollView: class {},
	ImageSource: class {
		static fromBase64Sync() {
			return { mocked: true }
		}
	},
}))

// The raster path is under test; ./svg resolves to svg.mobile.ts, which
// registers SVGView from the vendored submodule (needs real NS core).
vi.mock('./svg', () => ({
	isSvgSrc: () => false,
	svgSource: (s: string) => s,
}))

import { Image } from './Image.tsrx'

describe('native Image sized decode', () => {
	it('defers src until first layout, issues decode dims in device px, and re-issues per the stretch gate', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Image as any, { src: 'res://feed/photo.jpg' })
		const host = container.children[0] as any
		expect(host.type).toBe('image')
		// The leaf owns src imperatively — the driver never saw it.
		expect(host.props.src).toBeUndefined()
		expect(host.src).toBeUndefined()

		let layoutCb: (() => void) | null = null
		host.on = (event: string, cb: () => void) => {
			if (event === 'layoutChanged') layoutCb = cb
		}

		host.off = () => {}
		host.getMeasuredWidth = () => 300
		host.getMeasuredHeight = () => 200
		host.stretch = 'aspectFit'

		root.render(Image as any, { src: 'res://feed/photo.jpg', id: 'rebind' })
		expect(host.src).toBe('res://feed/photo.jpg')
		expect(host.decodeWidth).toEqual({ value: 300, unit: 'px' })
		expect(host.decodeHeight).toEqual({ value: 200, unit: 'px' })

		host.getMeasuredWidth = () => 600
		layoutCb!()
		expect(host.decodeWidth).toEqual({ value: 600, unit: 'px' })
		expect(host.src).toBe('res://feed/photo.jpg')

		host.stretch = 'fill'
		host.getMeasuredWidth = () => 900
		layoutCb!()
		expect(host.decodeWidth).toEqual({ value: 600, unit: 'px' })

		root.render(Image as any, { src: 'res://feed/other.jpg' })
		expect(host.src).toBe('res://feed/other.jpg')
		expect(host.decodeWidth).toEqual({ value: 900, unit: 'px' })
		root.unmount()
	})

	it('maps decoding to NS loadMode — async by default, sync when requested', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))

		root.render(Image as any, { src: 'res://feed/photo.jpg' })
		expect((container.children[0] as any).props.loadMode).toBe('async')

		root.render(Image as any, { src: 'res://feed/photo.jpg', decoding: 'sync' })
		expect((container.children[0] as any).props.loadMode).toBe('sync')

		root.render(Image as any, { src: 'res://feed/photo.jpg', decoding: 'async' })
		expect((container.children[0] as any).props.loadMode).toBe('async')
		root.unmount()
	})
})
