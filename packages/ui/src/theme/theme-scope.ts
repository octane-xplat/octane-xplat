/** Root theme scope state — shared by every leaf so independently-mounted
 *  roots (portals, toasts, sheets, modal hosts) can stamp the same theme
 *  class as the app root. Written by the outermost mounted `Theme`;
 *  `themeSchemeClasses()` folds the active scope class into its result and
 *  `applyThemeClasses` re-stamps on scope changes the same way it does for
 *  light/dark scheme changes. */

import type { DefinedTheme } from './defined-theme'

let rootScope: DefinedTheme | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** The currently mounted root `Theme`'s definition, or null. */
export function getRootThemeScope(): DefinedTheme | null {
	return rootScope
}

/** Scope class stamped on themed hosts — `xds-theme-<sanitized-name>`. */
export function themeScopeClass(name: string): string {
	return `xds-theme-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

/** Active root scope class for host stamping, or '' when no Theme is mounted. */
export function themeScopeClasses(): string {
	return rootScope == null ? '' : themeScopeClass(rootScope.name)
}

/** Called by the root `Theme` while mounted; returns the restore to run on
 *  unmount or when the theme object changes. */
export function setRootThemeScope(theme: DefinedTheme): () => void {
	const prev = rootScope
	rootScope = theme
	emit()
	return () => {
		if (rootScope === theme) {
			rootScope = prev
			emit()
		}
	}
}

/** Imperative subscription for hosts outside any render cycle. */
export function onThemeScopeChange(cb: () => void): () => void {
	listeners.add(cb)
	return () => {
		listeners.delete(cb)
	}
}
