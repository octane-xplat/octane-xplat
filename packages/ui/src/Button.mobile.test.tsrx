/** @jsxImportSource @nativescript-community/octane */
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
	Application: {},
	Utils: { openUrl: () => {} },
}))

// Icon's leaf imports the svg router for icon markup; string icons are not
// exercised here, so stub the router module out.
vi.mock('./svg', () => ({
	glyphSvgMarkup: () => null,
	isSvgSrc: () => false,
	svgSource: (src: string) => src,
}))

// The loading swap renders ActivityIndicator, whose ref drives NS view
// animation the object driver does not implement; swap in a compiled no-op.
vi.mock('./ActivityIndicator.tsrx', async () => ({
	ActivityIndicator: (await import('./Spacer.tsrx')).Spacer,
}))

import { Button } from './Button.tsrx'

describe('native button action failure reporting', () => {
	it('reports a rejected clickAction through onActionError', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const error = new Error('save failed')
		const onActionError = vi.fn()
		let rejectAction: ((reason: unknown) => void) | undefined
		root.render(Button, {
			label: 'Save',
			clickAction: () =>
				new Promise<void>((_, reject) => {
					rejectAction = reject
				}),
			onActionError,
		})

		const host = container.children[0]
		container.dispatchEvent(host, 'tap', {})

		rejectAction!(error)
		await Promise.resolve()
		await Promise.resolve()
		expect(onActionError).toHaveBeenCalledWith(error)
		root.unmount()
	})

	it('reports a synchronous clickAction throw through onActionError', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const error = new Error('sync failure')
		const onActionError = vi.fn()
		root.render(Button, {
			label: 'Save',
			clickAction: () => {
				throw error
			},
			onActionError,
		})

		container.dispatchEvent(container.children[0], 'tap', {})
		expect(onActionError).toHaveBeenCalledWith(error)
		root.unmount()
	})
})
