import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Utils: { openUrl: vi.fn() },
}))

vi.mock('./pan.tsrx', () => ({ usePan: () => undefined }))
vi.mock('./route', () => ({ pushDeepLink: () => false }))

import { View } from './View.tsrx'

// The object driver checks emitted props, not NativeScript's CSS cascade.
describe('View styling', () => {
	it('leaves direction to CSS and composes nested class arrays', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		try {
			root.render(View, { className: ['actions', [false, 'extra']] })
			const view = container.children[0]
			expect(view.props.className).toEqual(['vx-view', ['actions', [false, 'extra']]])
			expect(view.props.style).toEqual({ display: 'flex' })
		} finally {
			root.unmount()
		}
	})

	it('removes explicit direction without reinstating an inline default', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		try {
			root.render(View, { className: 'actions', style: { flexDirection: 'column' }, gap: 6 })
			expect(container.children[0].props.style).toEqual({
				display: 'flex',
				flexDirection: 'column',
				gap: 6,
			})

			root.render(View, { className: 'actions', gap: 6 })
			expect(container.children[0].props.style).toEqual({ display: 'flex', gap: 6 })
			root.render(View, {})
			expect(container.children[0].props.className).toEqual(['vx-view', undefined])
			expect(container.children[0].props.style).toEqual({ display: 'flex' })
		} finally {
			root.unmount()
		}
	})
})
