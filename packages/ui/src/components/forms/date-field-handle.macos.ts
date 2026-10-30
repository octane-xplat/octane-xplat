import type { NSView } from '@octane-xplat/platform/macos'
import type { TextInputHandle } from '../../props'

const read = (view: NSView, name: string) => {
	const value = Reflect.get(view, name)
	return typeof value === 'function' ? value.call(view) : value
}
const enabled = (view: NSView, name: string) => { const value = read(view, name); return value == null || Boolean(value) }
/** Private AppKit date/plain-text ref adapter. Native responder changes own text commits. */
export function createAppKitDateFieldHandle(options: {
	primary(): NSView | null
	fields?(): readonly (NSView | null)[]
	blocked(): boolean
}): TextInputHandle {
	return {
		focus() {
			const view = options.primary(), window = view?.window
			if (!view || !window || options.blocked() || read(view, 'hidden') || read(view, 'hiddenOrHasHiddenAncestor') ||
				!enabled(view, 'enabled') || !enabled(view, 'isEnabled') || !enabled(view, 'isAccessibilityEnabled')) {return}
			window.makeFirstResponder(view)
		},
		blur() {
			for (const view of options.fields?.() ?? [options.primary()]) {
				const window = view?.window, responder = window?.firstResponder
				if (!view || !window || !responder) {continue}
				if (responder === view || responder === read(view, 'currentEditor')) {
					window.makeFirstResponder(null)
					return
				}
			}
		},
		get native() { return options.primary() },
	}
}
