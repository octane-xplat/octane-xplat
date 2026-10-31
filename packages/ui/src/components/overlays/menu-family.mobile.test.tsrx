/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	// ui-svg's index.common.ts evaluates NS decorators at import.
	Property: class {
		constructor(_opts?: any) {}
		register() {}
	},
	CSSType: () => () => {},
	registerElement: () => {},
	View: class {},
	// @octane-xplat/platform's device service reads these at import.
	Device: {
		os: 'iOS',
		osVersion: '26.0',
		model: 'iPhone',
		manufacturer: 'Apple',
		language: 'en-US',
		region: 'US',
	},
	isIOS: true,
	isAndroid: false,
	Application: { on() {}, off() {} },
}))

vi.mock('../../internal/platform/apply-native-modifiers.native', () => ({ applyNativeModifiers: () => {} }))
// The routing import graph reaches the platform barrel, whose per-service
// modules evaluate @nativescript/core at import; none are exercised here.
vi.mock('@octane-xplat/platform', () => ({ announce: () => {} }))
vi.mock('../layout/pan', () => ({ usePan: () => undefined }))
// The universal runtime only accepts compiler-defined components — stand in
// with a real compiled leaf rather than a bare function.
vi.mock('../media/Icon', async () => ({ Icon: (await vi.importActual('../layout/View.tsrx')).View }))
vi.mock('./Popover', async () => ({ Popover: (await vi.importActual('../layout/View.tsrx')).View }))
import { MenuSurface } from './MenuSurface.tsrx'
import { DropdownMenuItem, MenuData } from './MenuParts.tsrx'
const orphanCaught: { error?: unknown } = {}
function OrphanItem() @{
	@try {
		<DropdownMenuItem label="Lonely" />
	} @catch (error) {
		orphanCaught.error = error
		<label text="caught" />
	}
}

function DataSurface(props: any) @{
	<MenuSurface {...props}>
		<MenuData items={props.items} />
	</MenuSurface>
}

import { nativeAccessibilityRole } from './escape-props'

function all(node: any): any[] {
	return [node, ...(node.children ?? []).flatMap(all)]
}

describe('native menu action contracts (object driver)', () => {
	it('carries checked state, disabled activation, radio ownership and explicit close ownership', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const close = vi.fn(),
			check = vi.fn(),
			radio = vi.fn(),
			disabled = vi.fn()

		const items = [
			{
				key: 'check',
				label: 'Archived',
				type: 'checkbox' as const,
				value: false,
				onValueChange: check,
			},
			{
				type: 'action' as const,
				key: 'blocked',
				label: 'Disabled',
				isDisabled: true,
				onSelect: disabled,
			},
			{
				key: 'sort',
				label: 'Sort',
				type: 'radio-group' as const,
				value: 'new',
				onValueChange: radio,
				items: [{ key: 'old', label: 'Oldest' }],
			},
		]

		const row = (id: string) => all(container).find((node) => node.props?.id === id)
		try {
			root.render(DataSurface, { items, closeMenu: close })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(row('check')).toBeTruthy())
			expect(row('check').props.accessibilityRole).toBe('checkbox')
			expect(row('check').props.accessibilityState).toBe('unchecked')
			flushUniversalSync(() => container.dispatchEvent(row('check'), 'tap', {}))
			expect(check).toHaveBeenCalledWith(true)
			expect(close).not.toHaveBeenCalled()
			expect(row('check').props.accessibilityState).toBe('unchecked')
			flushUniversalSync(() => container.dispatchEvent(row('blocked'), 'tap', {}))
			expect(disabled).not.toHaveBeenCalled()
			flushUniversalSync(() => container.dispatchEvent(row('old'), 'tap', {}))
			expect(radio).toHaveBeenCalledWith('old')
			expect(close).toHaveBeenCalledTimes(1)
			root.render(DataSurface, { items: [{ ...items[0], value: true }], closeMenu: close })
			flushUniversalSync(() => {})
			await vi.waitFor(() => expect(row('check').props.accessibilityState).toBe('checked'))
		} finally {
			root.unmount()
			flushUniversalSync(() => {})
		}
	})

	it('rejects menu parts rendered outside a menu surface', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		orphanCaught.error = undefined
		try {
			root.render(OrphanItem, {})
			flushUniversalSync(() => {})
			expect(String(orphanCaught.error)).toContain('requires a menu')
		} finally {
			try {
				root.unmount()
			} catch {}
		}
	})

	it('provides a named Back action for touch submenu traversal', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const back = vi.fn()
		try {
			root.render(DataSurface, { items: [], closeMenu: vi.fn(), closeLevel: back, label: 'Move' })
			flushUniversalSync(() => {})
			const button = () =>
				all(container).find((node) => node.props?.accessibilityLabel === 'Back to parent menu')

			await vi.waitFor(() => expect(button()).toBeTruthy())
			flushUniversalSync(() => container.dispatchEvent(button(), 'tap', {}))
			expect(back).toHaveBeenCalledTimes(1)
			expect(nativeAccessibilityRole('menuitemradio')).toBe('radioButton')
		} finally {
			root.unmount()
			flushUniversalSync(() => {})
		}
	})
})

vi.mock('../../theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
vi.mock('../layout/pan.macos.tsrx', () => ({ usePan: () => undefined }))
vi.mock('../media/Icon.macos.tsrx', async () => ({ Icon: (await vi.importActual('../layout/View.tsrx')).View }))
import { DropdownMenu as MacMenu } from './DropdownMenu.macos.tsrx'
import { dispatchLayerKey } from './layer-stack'
import { createPortalObjectDriver } from '../../../tests/portal-object-driver'

it('keeps AppKit anchors and nested menu ownership across separate popup roots', async () => {
	// Source-portal layers: showLayer hands back a deferred handle whose
	// createContentRoot outlet receives the portal content. Window-update
	// notifications retry acquisition once anchors gain a native window.
	const observers = new Map<object, (note: any) => void>(),
		layers: any[] = [],
		window: any = {}
	vi.stubGlobal('NSNotificationCenter', {
		defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(
				_: unknown,
				__: unknown,
				___: unknown,
				callback: any,
			) {
				const token = {}
				observers.set(token, callback)
				return token
			},
			removeObserver(token: object) {
				observers.delete(token)
			},
		},
	})
	vi.stubGlobal('__xplatAppKit', {
		showLayer(options: any) {
			const source = options.createContentRoot({ window }),
				layer: any = {
					options,
					source,
					closed: false,
					show: vi.fn(),
					update: vi.fn(() => source.whenCommitted(() => {})),
					close: vi.fn(() => {
						if (layer.closed) {
							return
						}
						layer.closed = true
						source.unmount()
						options.onClose()
					}),
				}
			layers.push(layer)
			layer.update()
			return layer
		},
	})

	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createPortalObjectDriver())
	const pick = vi.fn(),
		close = vi.fn()
	const settle = async () => {
		for (let index = 0; index < 4; index++) {
			await Promise.resolve()
			flushUniversalSync(() => {})
		}
	}
	const notify = () => {
		for (const callback of [...observers.values()]) {
			callback({ object: window })
		}
	}
	const hydrate = (node: any) => {
		node.window = window
		node.convertRectToView = () => {}
	}

	try {
		root.render(MacMenu, {
			isOpen: true,
			button: { label: 'Actions' },
			onOpenChange: close,
			items: [
				{
					type: 'submenu',
					key: 'move',
					label: 'Move',
					items: [{ type: 'action', key: 'target', label: 'Target', onSelect: pick }],
				},
			],
		})

		flushUniversalSync(() => {})
		const trigger = all(container).find((node) =>
			String(node.props?.className).includes('vx-menu-trigger'),
		)
		hydrate(trigger)
		notify()
		await settle()
		expect(layers).toHaveLength(1)
		expect(layers[0].options.anchor).toBe(trigger)
		const submenu = all(container).find((node) => node.props?.id === 'move')
		hydrate(submenu)
		flushUniversalSync(() => container.dispatchEvent(submenu, 'tap', {}))
		await settle()
		expect(layers).toHaveLength(2)
		expect(layers[1].options.anchor).toBe(submenu)
		flushUniversalSync(() => dispatchLayerKey({ key: 'Escape', preventDefault() {} }))
		await settle()
		expect(layers[1].closed).toBe(true)
		expect(close).not.toHaveBeenCalled()
		flushUniversalSync(() => container.dispatchEvent(submenu, 'tap', {}))
		await settle()
		expect(layers).toHaveLength(3)
		const target = all(container).find((node) => node.props?.id === 'target')
		flushUniversalSync(() => container.dispatchEvent(target, 'tap', {}))
		expect(pick).toHaveBeenCalledOnce()
		expect(close).toHaveBeenCalledWith(false)
		expect(layers[0].closed).toBe(false)
	} finally {
		root.unmount()
		layers.forEach((layer) => layer.close())
		flushUniversalSync(() => {})
		vi.unstubAllGlobals()
	}
})
