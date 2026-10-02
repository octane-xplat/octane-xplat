import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
vi.mock('./pan.tsrx', () => ({ usePan: () => undefined }))
import { Pressable } from './Pressable.tsrx'

describe('native disabled Pressable accessibility state', () => {
	it('reports disabled ahead of selected/checked and restores state when enabled', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Pressable as any, {
			disabled: true,
			accessibilityState: { selected: true, checked: true },
		})
		expect(container.children[0].props.accessibilityState).toBe('disabled')
		root.render(Pressable as any, {
			disabled: false,
			accessibilityState: { selected: true, checked: true },
		})
		expect(container.children[0].props.accessibilityState).toBe('selected')
		root.unmount()
	})
})
