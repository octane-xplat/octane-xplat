/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Image } from './Image.macos.tsrx'

function mount(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(Image, props)
	flushUniversalSync(() => {})
	return { root, host: container.children[0] }
}

it('AppKit Image forwards declared parent layout and normalizes ClassValue and object styles', () => {
	const env = mount({
		src: 'data:image/png;base64,YQ==', alt: 'Photo',
		className: ['photo', { active: true, hidden: false }],
		row: 1, col: 2, rowSpan: 2, flexGrow: 1, order: 3,
		contentFit: 'contain', style: { width: 40, height: 24 },
	})
	try {
		expect(env.host.type).toBe('image')
		expect(env.host.props.className).toBe('photo active')
		expect(env.host.props.style).toMatchObject({
			objectFit: 'contain', width: 40, height: 24,
			gridRow: '2 / span 2', gridColumn: '3 / span 1', flexGrow: 1, order: 3,
		})
		expect(env.host.props.accessibilityLabel).toBe('Photo')
	} finally { env.root.unmount() }
})

it('AppKit Image preserves authored inline CSS and suppresses remote placeholders', () => {
	const env = mount({ src: 'https://image-test/photo.png', placeholder: 'https://image-test/tiny.png', style: 'width:40px;height:24px' })
	try {
		expect(env.host.props.style).toContain('object-fit:cover')
		expect(env.host.props.style).toContain('width:40px;height:24px')
		expect(env.host.props.placeholder).toBeUndefined()
	} finally { env.root.unmount() }
})

it('AppKit Image forwards corner/percentage positions and valid center edge offsets', () => {
	const env = mount({ src: 'data:image/png;base64,YQ==', contentPosition: { bottom: 10, right: '25%' } })
	try {
		expect(env.host.props.style.objectFit).toBe('cover')
		expect(env.host.props.style.objectPosition).toBe('bottom 10px right 25%')
		env.root.render(Image, { src: 'data:image/png;base64,YQ==', contentPosition: { top: 'center', left: 'center' } })
		flushUniversalSync(() => {})
		expect(env.host.props.style.objectPosition).toBe('top 50% left 50%')
	} finally { env.root.unmount() }
})


it('AppKit Image selects declared candidates after box/density changes and source replacement', () => {
	const sources = [
		{ uri: '~/small.png', width: 100, height: 50 },
		{ uri: '~/large.png', width: 200, height: 100 },
	]
	const env = mount({ src: sources, style: { width: 100, height: 50 } })
	try {
		expect(env.host.props.src).toBe('~/small.png')
		env.host.props.onImageGeometryChanged({ width: 100, height: 50, scale: 2 })
		flushUniversalSync(() => {})
		expect(env.host.props.src).toBe('~/large.png')
		env.host.props.onImageGeometryChanged({ width: 100, height: 50, scale: 1 })
		flushUniversalSync(() => {})
		expect(env.host.props.src).toBe('~/small.png')
		env.root.render(Image, { src: [], style: { width: 100, height: 50 } })
		flushUniversalSync(() => {})
		expect(env.host.props.src).toBe('')
		env.root.render(Image, { src: '~/single.png' })
		flushUniversalSync(() => {})
		expect(env.host.props.src).toBe('~/single.png')
		expect(env.host.props.onImageGeometryChanged).toBeUndefined()
	} finally { env.root.unmount() }
})

it('the private engine handoff forwards bypass on the initial host while preserving public layout and resets on removal', () => {
	const env = mount({ src: '~/photo.png', __appKitImageCachePolicy: 'none', alt: 'Photo', row: 1, flexGrow: 1, className: ['photo', { active: true }], style: 'width:40px;height:24px' })
	try {
		expect(Reflect.get(Image, '__xplatAppKitImagePolicy')).toBe(true); expect(env.host.props.imageCachePolicy).toBe('none')
		expect(env.host.props.className).toBe('photo active'); expect(env.host.props.style).toContain('grid-row:2 / span 1'); expect(env.host.props.style).toContain('width:40px;height:24px')
		env.root.render(Image, { src: '~/photo.png' }); flushUniversalSync(() => {}); expect(env.host.props.imageCachePolicy).toBe('memory-disk')
	} finally { env.root.unmount() }
})
it('candidate/geometry updates preserve private policy without changing public source selection', () => {
	const env = mount({ src: [{ uri: '~/small.png', width: 100, height: 50 }, { uri: '~/large.png', width: 200, height: 100 }], __appKitImageCachePolicy: 'none' })
	try {
		env.host.props.onImageGeometryChanged({ width: 100, height: 50, scale: 2 }); flushUniversalSync(() => {})
		expect(env.host.props.src).toBe('~/large.png'); expect(env.host.props.imageCachePolicy).toBe('none')
	} finally { env.root.unmount() }
})
