/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
vi.mock('@nativescript/core', () => ({ isIOS: true, isAndroid: false, Application: {} }))
vi.mock('./apply-native-modifiers.native', () => ({ applyNativeModifiers: () => {} }))
vi.mock('./pan', () => ({ usePan: () => undefined }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Popover', () => ({ Popover: () => null }))
import { MenuSurface } from './MenuSurface.tsrx'
import { MenuData } from './MenuParts.tsrx'
function DataSurface(props: any) @{
	<MenuSurface {...props}><MenuData items={props.items} /></MenuSurface>
}

import { nativeAccessibilityRole } from './escape-props'

function all(node: any): any[] {
	return [node, ...(node.children ?? []).flatMap(all)]
}

describe('native menu action contracts (object driver)', () => {
	it('carries checked state, disabled activation, radio ownership and explicit close ownership', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const close = vi.fn(), check = vi.fn(), radio = vi.fn(), disabled = vi.fn()
		const items = [
			{ key: 'check', label: 'Archived', type: 'checkbox' as const, value: false, onValueChange: check },
			{ key: 'blocked', label: 'Disabled', disabled: true, onSelect: disabled },
			{ key: 'sort', label: 'Sort', type: 'radio-group' as const, value: 'new', onValueChange: radio, items: [{ key: 'old', label: 'Oldest' }] },
		]

		const row = (id: string) => all(container).find((node) => node.props?.id === id)
		try {
			root.render(DataSurface as any, { items, closeMenu: close })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(row('check')).toBeTruthy())
			expect(row('check').props.accessibilityRole).toBe('checkbox')
			expect(row('check').props.accessibilityState).toBe('unchecked')
			flushUniversalSync(() => container.dispatchEvent(row('check'), 'tap', {}))
			expect(check).toHaveBeenCalledWith(true); expect(close).not.toHaveBeenCalled()
			expect(row('check').props.accessibilityState).toBe('unchecked')
			flushUniversalSync(() => container.dispatchEvent(row('blocked'), 'tap', {}))
			expect(disabled).not.toHaveBeenCalled()
			flushUniversalSync(() => container.dispatchEvent(row('old'), 'tap', {}))
			expect(radio).toHaveBeenCalledWith('old'); expect(close).toHaveBeenCalledTimes(1)
			root.render(DataSurface as any, { items: [{ ...items[0], value: true }], closeMenu: close })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(row('check').props.accessibilityState).toBe('checked'))
		} finally { root.unmount(); flushUniversalSync(() => {}) }
	})

	it('provides a named Back action for touch submenu traversal', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const back = vi.fn()
		try {
			root.render(DataSurface as any, { items: [], closeMenu: vi.fn(), closeLevel: back, label: 'Move' })
			flushUniversalSync(() => {})
			const button = () => all(container).find((node) => node.props?.accessibilityLabel === 'Back to parent menu')
			await vi.waitFor(() => expect(button()).toBeTruthy())
			flushUniversalSync(() => container.dispatchEvent(button(), 'tap', {}))
			expect(back).toHaveBeenCalledTimes(1)
			expect(nativeAccessibilityRole('menuitemradio')).toBe('radioButton')
		} finally { root.unmount(); flushUniversalSync(() => {}) }
	})
})

vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
vi.mock('./pan.macos.tsrx', () => ({ usePan: () => undefined }))
vi.mock('./Icon.macos.tsrx', () => ({ Icon: () => null }))
import { DropdownMenu as MacMenu } from './DropdownMenu.macos.tsrx'
import { dispatchLayerKey } from './layer-stack'

it('keeps AppKit anchors and nested menu ownership across separate popup roots', async () => {
	const popups: { container: any; root: any; closed: boolean; close: any }[] = []
	const show = vi.fn((options: any) => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const popup = { container, root, closed: false, close: () => { popup.closed = true; root.unmount(); options.onClose?.() }, update: (props: any) => root.render(options.component, props) }
		popups.push(popup)
		root.render(options.component, options.props)
		return popup
	})

	vi.stubGlobal('__xplatAppKit', { showAnchoredPopup: show })
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const pick = vi.fn(), close = vi.fn()
	try {
		root.render(MacMenu as any, { isOpen: true, trigger: 'Actions', onOpenChange: close, items: [{ key: 'move', label: 'Move', items: [{ key: 'target', label: 'Target', onSelect: pick }] }] })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(popups).toHaveLength(1))
		expect(show.mock.calls[0][0].anchor).toBeTruthy()
		const submenu = all(popups[0].container).find((node) => node.props?.id === 'move')
		flushUniversalSync(() => popups[0].container.dispatchEvent(submenu, 'tap', {}))
		await vi.waitFor(() => expect(popups).toHaveLength(2))
		expect(show.mock.calls[1][0].anchor).toBeTruthy()
		flushUniversalSync(() => dispatchLayerKey({ key: 'Escape', preventDefault() {} }))
		await vi.waitFor(() => expect(popups[1].closed).toBe(true))
		expect(close).not.toHaveBeenCalled()
		flushUniversalSync(() => popups[0].container.dispatchEvent(submenu, 'tap', {}))
		await vi.waitFor(() => expect(popups).toHaveLength(3))
		const target = all(popups[2].container).find((node) => node.props?.id === 'target')
		flushUniversalSync(() => popups[2].container.dispatchEvent(target, 'tap', {}))
		expect(pick).toHaveBeenCalledOnce(); expect(close).toHaveBeenCalledWith(false)
		expect(popups[0].closed).toBe(false)
	} finally {
		root.unmount(); popups.forEach((popup) => popup.root.unmount()); flushUniversalSync(() => {}); vi.unstubAllGlobals()
	}
})
