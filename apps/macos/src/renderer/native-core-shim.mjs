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
export const Application = { ios: null, android: null, on() {}, off() {} }
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
