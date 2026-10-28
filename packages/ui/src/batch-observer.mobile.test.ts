import { expect, it, vi } from 'vitest'
import { LayoutBase, View } from '@nativescript/core'
import {
	createNativeScriptContainer,
	nativeScriptDriver,
	observeBatches,
	releaseNativeScriptContainer,
} from '../node_modules/@nativescript-community/octane/dist/driver.js'

import { registerElement } from '../node_modules/@nativescript-community/octane/dist/elements.js'
import { NATIVESCRIPT_RENDERER_ID } from '../node_modules/@nativescript-community/octane/dist/config.js'

// The installed driver is real; native host views are substituted. This does
// not establish device layout or hit-testing.
vi.mock('@nativescript/core/ui/core/properties', () => ({
	_getProperties: () => [],
	_getStyleProperties: () => [],
}))

vi.mock('@nativescript/core', () => {
	class View {
		parent: View | null = null
		children: View[] = []
	}

	class LayoutBase extends View {
		addChild(view: View) {
			this.children.push(view)
			view.parent = this
		}
		insertChild(view: View, index: number) {
			this.children.splice(index, 0, view)
			view.parent = this
		}
		removeChild(view: View) {
			this.children.splice(this.children.indexOf(view), 1)
			view.parent = null
		}
	}

	class ContentView extends View {
		content: View | null = null
	}

	class TextBase extends View {}
	const named = Object.fromEntries(
		'AbsoluteLayout ActionBar ActionItem ActivityIndicator Button LiquidGlass DatePicker DockLayout FlexboxLayout FormattedString Frame GridLayout HtmlView Image Label ListPicker ListView NavigationButton Page Placeholder Progress ProxyViewContainer RootLayout ScrollView SearchBar SegmentedBar SegmentedBarItem Slider Span StackLayout Switch TabView TabViewItem TextField TextView TimePicker ViewBase WebView WrapLayout'
			.split(' ')
			.map((name) => [name, class extends View {}]),
	)

	return {
		...named,
		Application: {},
		Utils: {},
		isIOS: false,
		isAndroid: false,
		View,
		LayoutBase,
		ContentView,
		TextBase,
		unsetValue: Symbol('unset'),
	}
})

function container() {
	return createNativeScriptContainer(new LayoutBase() as never)
}

function apply(target: ReturnType<typeof container>, commands: readonly object[] = []) {
	nativeScriptDriver
		.prepareBatch(target, { renderer: NATIVESCRIPT_RENDERER_ID, version: 0, commands } as never)
		.apply()
}

it('calls willApply before commands and didApply after, with container, commands and depth', () => {
	const target = container()
	const events: string[] = []
	const commands: readonly object[] = []
	const stop = observeBatches({
		willApply(c, cmds, depth) {
			expect(c).toBe(target)
			expect(cmds).toBe(commands)
			expect(depth).toBe(0)
			events.push('will')
		},
		didApply(c, cmds, depth) {
			expect(c).toBe(target)
			expect(cmds).toBe(commands)
			expect(depth).toBe(0)
			events.push('did')
		},
	})

	try {
		apply(target, commands)
		expect(events).toEqual(['will', 'did'])
	} finally {
		stop()
	}
	apply(target)
	expect(events).toEqual(['will', 'did'])

	releaseNativeScriptContainer(target)
})

it('fires for nested applies with the applying depth', () => {
	class ProbeView extends View {
		set probe(_value: unknown) {
			;(globalThis as Record<string, unknown>).__probe?.()
		}
	}
	registerElement('probeview', ProbeView)

	const target = container()
	const depths: [string, number][] = []
	let nested = false
	const stop = observeBatches({
		willApply(_c, _cmds, depth) {
			depths.push(['will', depth ?? -1])
		},
		didApply(_c, _cmds, depth) {
			depths.push(['did', depth ?? -1])
		},
	})

	// The probe setter runs mid-command, while the outer apply's depth is 1.
	;(globalThis as Record<string, unknown>).__probe = () => {
		if (nested) {
			return
		}
		nested = true
		apply(target)
	}
	apply(target, [{ op: 'create', id: 1, type: 'probeview', props: { probe: true } }])

	expect(depths).toEqual([
		['will', 0],
		['will', 1],
		['did', 1],
		['did', 0],
	])
	delete (globalThis as Record<string, unknown>).__probe
	stop()

	releaseNativeScriptContainer(target)
})

it('iterates a snapshot and stays consistent when an observer throws', () => {
	const target = container()
	const calls: string[] = []
	const stopFirst = observeBatches({
		willApply() {
			calls.push('first')
			stopFirst()
		},
	})
	observeBatches({ willApply: () => calls.push('second') })

	apply(target)
	expect(calls).toEqual(['first', 'second'])

	// Unsubscribed during its own callback — only the second observer remains.
	calls.length = 0
	apply(target)
	expect(calls).toEqual(['second'])

	const stopThrowing = observeBatches({
		willApply() {
			throw new Error('boom')
		},
	})
	expect(() => apply(target)).toThrow('boom')
	// The throw happened before applyingDepth touched state; a later apply works.
	stopThrowing()
	calls.length = 0
	apply(target)
	expect(calls).toEqual(['second'])

	releaseNativeScriptContainer(target)
})
