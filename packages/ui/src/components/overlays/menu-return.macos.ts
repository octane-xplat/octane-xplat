import { createContext } from 'octane'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'

export interface AppKitMenuReturnOwner {
	isOpen(): boolean
	resolveTab(backward: boolean): NSView | null
	requestTab(target: NSView): void
	focusTarget(): NSView | null
	reset(): void
}

export const AppKitMenuReturnContext = createContext<AppKitMenuReturnOwner | null>(null)
export const AppKitMenuReturnProvider: any = AppKitMenuReturnContext

/** Current accepted ancestors decide which window still owns return focus. */
export function createAppKitMenuReturn(options: {
	anchor(): NSView | null
	open(): boolean
	close(): void
	parent?(): AppKitMenuReturnOwner | null
}): AppKitMenuReturnOwner {
	let requested: { target: NSView; window: NSWindow } | null = null
	return {
		isOpen: () => options.open() && (options.parent?.()?.isOpen() ?? true),
		resolveTab(backward) {
			const parent = options.parent?.()
			if (parent) {
				return parent.resolveTab(backward)
			}
			const anchor = options.anchor(),
				window = anchor?.window
			if (!anchor || !window) {
				return null
			}
			const candidate = backward ? anchor.previousValidKeyView : anchor.nextValidKeyView
			return candidate && candidate.window === window ? candidate : anchor
		},
		requestTab(target) {
			if (!target.window) {
				return
			}
			requested = { target, window: target.window }
			options.close()
			options.parent?.()?.requestTab(target)
		},
		focusTarget() {
			const parent = options.parent?.(),
				anchor = options.anchor()
			if (parent) {
				return parent.isOpen() ? anchor : parent.focusTarget()
			}
			return requested &&
				requested.target.window === requested.window &&
				anchor?.window === requested.window
				? requested.target
				: anchor
		},
		reset() {
			requested = null
		},
	}
}
