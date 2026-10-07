/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Screen: { mainScreen: { scale: 3 } },
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

function render(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(Image as any, props)
	return { container, root, host: container.children[0] as any }
}

describe('native Image — contentFit fast path (L7)', () => {
	it('defaults to cover → aspectFill (the web/img fill and NS aspectFit defaults diverged)', () => {
		const { host } = render({ src: 'https://img.example/x.png' })
		expect(host.type).toBe('image')
		expect(host.props.stretch).toBe('aspectFill')
	})

	it('maps contain/cover/fill onto stretch', () => {
		expect(render({ src: 'x', contentFit: 'contain' }).host.props.stretch).toBe('aspectFit')
		expect(render({ src: 'x', contentFit: 'cover' }).host.props.stretch).toBe('aspectFill')
		expect(render({ src: 'x', contentFit: 'fill' }).host.props.stretch).toBe('fill')
	})

	it('routes none/scale-down/positioned content through the computed wrapper', () => {
		const none = render({ src: 'x', contentFit: 'none' }).host
		expect(none.type).toBe('absolutelayout')
		const inner = none.children[0] as any
		expect(inner.type).toBe('image')
		expect(inner.props.stretch).toBe('fill')

		const scaleDown = render({ src: 'x', contentFit: 'scale-down' }).host
		expect(scaleDown.type).toBe('absolutelayout')
		const positioned = render({ src: 'x', contentFit: 'cover', contentPosition: 'top left' }).host
		expect(positioned.type).toBe('absolutelayout')
		// fill ignores position — the rect is always the whole box
		const filled = render({ src: 'x', contentFit: 'fill', contentPosition: 'top left' }).host
		expect(filled.type).toBe('image')
	})
})

describe('native Image — multi-source selection (L8)', () => {
	const sources = [
		{ uri: 'https://img.example/p-200.jpg', width: 200, height: 200 },
		{ uri: 'https://img.example/p-800.jpg', width: 800, height: 800 },
	]

	it('defers src until a real layout, then assigns the closest source', () => {
		const { root, host } = render({ src: sources })
		expect(host.type).toBe('image')
		expect(host.src).toBeUndefined()

		// re-render re-fires the ref → binding.update → content binding picks
		// (200x200 dips at scale 3 → 600² px → 800² wins) and hands it to the
		// sized binding, whose measured-width gate lands the src + decode dims
		host.getActualSize = () => ({ width: 200, height: 200 })
		host.getMeasuredWidth = () => 600
		host.getMeasuredHeight = () => 600
		root.render(Image as any, { src: sources })
		expect(host.src).toBe('https://img.example/p-800.jpg')
		expect(host.decodeWidth).toEqual({ value: 600, unit: 'px' })
	})
})
