import { registerStylesheet } from './css/stylesheets.ts'
import { NSScreen } from '@octane-xplat/platform/macos'

// The shared pan leaf imports Utils eagerly, but this spike doesn't implement
// NativeScript gestures. Fail explicitly if pan velocity is ever requested.
export const Utils = {
	layout: {
		getDisplayDensity() {
			throw new Error('NativeScript display density is unavailable in the AppKit spike')
		},
	},
}

// The AppKit build may resolve a shared native leaf before tree-shaking it.
// These values keep import-time platform checks safe; components that need
// NativeScript application services have explicit AppKit leaves or render
// an unsupported state.
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
// NS `Screen.mainScreen` reports the main display in DIPs; AppKit points are
// the DIP equivalent and backingScaleFactor is the pixel ratio.
export const Screen = {
	mainScreen: {
		get widthDIPs() {
			return Number(NSScreen.mainScreen?.frame.size.width ?? 0)
		},
		get heightDIPs() {
			return Number(NSScreen.mainScreen?.frame.size.height ?? 0)
		},
		get scale() {
			return Number(NSScreen.mainScreen?.backingScaleFactor ?? 1)
		},
		get widthPixels() {
			return this.widthDIPs * this.scale
		},
		get heightPixels() {
			return this.heightDIPs * this.scale
		},
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

// Octane's universal entry may evaluate the NativeScript driver module
// while the AppKit renderer is selected. The AppKit host never instantiates
// these NativeScript node classes.
export class ActionBar {}
export class ContentView {}
export class FormattedString {}
export class LayoutBase {}
export class ListView {}
export class Span {}
export class TextBase {}
export class View {}
export const unsetValue = Symbol('unsetValue')

// The AppKit spike has no display-link driver — motion's clock just needs a
// frame-shaped timer; the host's pump runs setTimeout on the main run loop.
export function requestAnimationFrame(callback: (time: number) => void): unknown {
	return setTimeout(() => callback(Date.now()), 16)
}

export function cancelAnimationFrame(id: unknown) {
	clearTimeout(id)
}
