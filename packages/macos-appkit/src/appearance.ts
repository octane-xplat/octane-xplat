/** App-wide effective appearance. AppKit resolves both system mode and an
 * explicit NSApplication.appearance override; colors remain app-owned. */

import { NSAppearance, NSApplication, NSObject } from '@octane-xplat/platform/macos'
export function installAppearanceBridge(bridge: Record<string, any>): void {
	// An explicit app preference pins NSApp.appearance; null restores system
	// following. The effectiveAppearance change notifies onAppearanceChange
	// listeners, so scheme reads, CSS root classes, media queries and native
	// controls all move together. Installed apart from the producer guard so
	// a host-installed producer can still inherit this setter.
	bridge.setAppearanceOverride ??= (scheme: 'light' | 'dark' | null) => {
		const application = NSApplication.sharedApplication
		;(application as { appearance: unknown }).appearance =
			scheme == null
				? null
				: NSAppearance.appearanceNamed(
						scheme === 'dark' ? 'NSAppearanceNameDarkAqua' : 'NSAppearanceNameAqua',
					)
	}

	// Preserve an installed producer across module reloads and host customization.
	if (bridge.getColorScheme && bridge.onAppearanceChange) {
		return
	}

	const listeners = new Set<() => void>()
	let observer: any
	let application: any
	let Observer: any

	bridge.getColorScheme = () => {
		const appearance = NSApplication.sharedApplication.effectiveAppearance
		return appearance?.bestMatchFromAppearancesWithNames?.([
			'NSAppearanceNameAqua',
			'NSAppearanceNameDarkAqua',
		]) === 'NSAppearanceNameDarkAqua'
			? 'dark'
			: 'light'
	}

	bridge.onAppearanceChange = (listener: () => void) => {
		if (!observer) {
			// extend binds the inherited NSObject KVO selector in node-api.
			Observer ??= NSObject.extend({
				observeValueForKeyPathOfObjectChangeContext(keyPath: string) {
					if (keyPath === 'effectiveAppearance') {
						listeners.forEach((callback) => callback())
					}
				},
			})

			application = NSApplication.sharedApplication
			observer = Observer.new()
			application.addObserverForKeyPathOptionsContext(observer, 'effectiveAppearance', 0, null)
		}

		listeners.add(listener)
		let active = true
		return () => {
			if (!active) {
				return
			}

			active = false
			listeners.delete(listener)
			if (listeners.size === 0 && observer) {
				application.removeObserverForKeyPath(observer, 'effectiveAppearance')
				observer = undefined
				application = undefined
			}
		}
	}
}
