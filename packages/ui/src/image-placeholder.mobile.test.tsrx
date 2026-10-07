/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Screen: { mainScreen: { scale: 2 } },
	ImageSource: class {
		static fromBase64Sync() {
			return { mocked: 'png' }
		}
		static fromResourceSync() {
			return { mocked: 'res' }
		}
		static fromFileSync() {
			return { mocked: 'file' }
		}
	},
	knownFolders: { currentApp: () => ({ path: '/app' }) },
}))

// The raster path is under test; ./svg resolves to svg.mobile.ts, which
// registers SVGView from the vendored submodule (needs real NS core).
vi.mock('./svg', () => ({
	isSvgSrc: () => false,
	svgSource: (s: string) => s,
}))

import { Image } from './Image.tsrx'

const BLURHASH = 'blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj'

function mount(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(Image as any, props)
	flushUniversalSync(() => {})
	return { container, root, host: container.children[0] as any }
}

function sized(host: any) {
	host.on = (event: string, fn: () => void) => {
		if (event === 'layoutChanged') host._layoutCb = fn
		if (event === 'isLoadingChange') host._loadCb = fn
	}

	host.off = () => {}
	host.getMeasuredWidth = () => 300
	host.getMeasuredHeight = () => 200
	host.stretch = 'aspectFit'
}

describe('native Image placeholder (study L5)', () => {
	it('paints the placeholder bitmap while the binding still holds src', () => {
		const { host } = mount({ src: 'https://x/photo.png', placeholder: BLURHASH })
		expect(host.type).toBe('image')
		// L1 binding: src stays unissued until first layout.
		expect(host.src).toBeUndefined()
		expect(host.imageSource).toEqual({ mocked: 'png' })
	})

	it('re-applies after each src issue and leaves the final bitmap alone on completion', () => {
		const { root, host } = mount({ src: 'https://x/a.png', placeholder: BLURHASH })
		expect(host.imageSource).toEqual({ mocked: 'png' })
		sized(host)

		// Emulate the iOS sequence for a pending load: the previous bitmap was
		// cleared and isLoading is already true when src is written again.
		host.imageSource = null
		host.isLoading = true
		root.render(Image as any, { src: 'https://x/b.png', placeholder: BLURHASH })
		flushUniversalSync(() => {})

		// The binding issued the new src and its afterIssue hook repainted the
		// placeholder — this is the same-src/mid-load gap that fires no
		// isLoadingChange.
		expect(host.src).toBe('https://x/b.png')
		expect(host.decodeWidth).toEqual({ value: 300, unit: 'px' })
		expect(host.imageSource).toEqual({ mocked: 'png' })
		expect(host._loadCb).toBeTypeOf('function')

		// Load completes: final bitmap arrives before isLoading goes false →
		// the placeholder must not clobber it.
		host.imageSource = { mocked: 'final' }
		host.isLoading = false
		host._loadCb()
		expect(host.imageSource).toEqual({ mocked: 'final' })

		// Failure path: Android clears imageSource on error → the listener
		// puts the placeholder back (failure-image semantics).
		host.imageSource = null
		host._loadCb()
		expect(host.imageSource).toEqual({ mocked: 'png' })
	})

	it('ignores a remote placeholder URL and no-ops without placeholder', () => {
		const { host } = mount({
			src: 'https://x/photo.png',
			placeholder: 'https://x/placeholder.png',
		})

		expect(host.imageSource).toBeUndefined()

		const { host: plain } = mount({ src: 'https://x/photo.png' })
		expect(plain.imageSource).toBeUndefined()
	})
})
