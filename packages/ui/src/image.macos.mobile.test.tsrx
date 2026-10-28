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
