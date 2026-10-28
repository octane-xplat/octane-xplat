import { registerStylesheet } from '@octane-xplat/css-engine'

// The shared pan leaf imports Utils eagerly, but this renderer doesn't
// implement NativeScript gestures. Fail explicitly if pan velocity is ever
// requested.
export const Utils = {
	layout: {
		getDisplayDensity() {
			throw new Error('NativeScript display density is unavailable in the GTK renderer')
		},
	},
}

// The GTK build may resolve a shared native leaf before tree-shaking it.
// These values keep import-time platform checks safe; components that need
// NativeScript application services need explicit GTK leaves or render an
// unsupported state.
let addCssSeq = 0
export const Application = {
	ios: null,
	android: null,
	on() {},
	off() {},
	/** NS parity: theme/runtime CSS injection (theme-css-inject.ts uses this). */
	addCss(css: string) {
		registerStylesheet('addCss:' + ++addCssSeq, css)
	},
}

export const isAndroid = false
export const isIOS = false
export const AccessibilityRole = {
	button: 'button',
	link: 'link',
	heading: 'heading',
	image: 'image',
	text: 'text',
}

// Octane's universal entry may evaluate the NativeScript driver module while
// the GTK renderer is selected. The GTK host never instantiates these
// NativeScript node classes.
export class ActionBar {}
export class ContentView {}
export class FormattedString {}
export class LayoutBase {}
export class ListView {}
export class Span {}
export class TextBase {}
export class View {}
export const unsetValue = Symbol('unsetValue')

// There is no display-link driver — motion's clock just needs a frame-shaped
// timer; the GJS host runs setTimeout on the GLib main loop.
export function requestAnimationFrame(callback: (time: number) => void): unknown {
	return setTimeout(() => callback(Date.now()), 16)
}

export function cancelAnimationFrame(id: number) {
	clearTimeout(id)
}

// Sync KV seam — @octane-xplat/ui query-storage and platform/storage persist
// through ApplicationSettings on native. GTK's honest stand-in is an
// in-process map: it answers get/set/remove/flush synchronously with the same
// semantics but does not persist across runs (no GLib keyfile yet — recorded
// as an upstream-limitations stand-in).
const settingsStore = new Map<string, unknown>()
export const ApplicationSettings = {
	getString(key: string): string | undefined {
		const v = settingsStore.get(key)
		return v === undefined || typeof v === 'string' ? v : String(v)
	},
	getNumber(key: string): number | undefined {
		const v = settingsStore.get(key)
		return typeof v === 'number' ? v : v === undefined ? undefined : Number(v)
	},
	getBoolean(key: string): boolean | undefined {
		const v = settingsStore.get(key)
		return typeof v === 'boolean' ? v : v === undefined ? undefined : Boolean(v)
	},
	getAllKeys(): string[] {
		return [...settingsStore.keys()]
	},
	hasKey(key: string): boolean {
		return settingsStore.has(key)
	},
	setString(key: string, value: string) {
		settingsStore.set(key, value)
	},
	setNumber(key: string, value: number) {
		settingsStore.set(key, value)
	},
	setBoolean(key: string, value: boolean) {
		settingsStore.set(key, value)
	},
	remove(key: string) {
		settingsStore.delete(key)
	},
	clear() {
		settingsStore.clear()
	},
	flush(): boolean {
		return true
	},
}

// Connectivity — GTK4 has no @nativescript/core equivalent in GJS scope.
// Report `unknown` honestly; monitoring is a no-op rather than fake events.
const UNKNOWN = 6 // Connectivity.connectionType.unknown in @nativescript/core
export const Connectivity = {
	connectionType: {
		none: 0,
		wifi: 1,
		mobile: 2,
		ethernet: 3,
		bluetooth: 4,
		vpn: 5,
		unknown: UNKNOWN,
	},
	getConnectionType(): number {
		return UNKNOWN
	},
	startMonitoring() {},
	stopMonitoring() {},
}

// platform/device.ts reads Device at import time on some leaves.
export const Device = {
	deviceType: 'Desktop',
	os: 'Linux',
	osVersion: '',
	model: '',
	sdkVersion: '',
	language: 'en',
	manufacturer: '',
	platform: 'linux',
	region: '',
	uuid: '',
}
