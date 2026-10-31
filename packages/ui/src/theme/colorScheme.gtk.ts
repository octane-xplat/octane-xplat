import { useSyncExternalStore } from 'octane'
import { hostGlobal } from '../internal/platform/host-bridge'

export type { ColorScheme } from '../props'
import type { ColorScheme } from '../props'

/** GTK/GJS color-scheme leaf — the renderer's `__octaneGtkHost` bridge is
 *  the single source: it reads Gtk.Settings (gtk-interface-color-scheme on
 *  GTK 4.20+, gtk-application-prefer-dark-theme plus the -dark theme-name
 *  heuristic below it) the same way the cascade's ambient ns-dark/ns-light
 *  classes do, so hook answers cannot diverge from styled behavior. */
const host = () => hostGlobal<Record<string, any>>('__octaneGtkHost')

/** Resolved system appearance — 'light' or 'dark'. */
export function getColorScheme(): ColorScheme {
	return host()?.getColorScheme?.() === 'dark' ? 'dark' : 'light'
}

export function subscribeSystemScheme(cb: () => void): () => void {
	return host()?.onColorSchemeChange?.(cb) ?? (() => {})
}

/** Reactive system appearance — 'light' | 'dark', re-renders on OS change. */
export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribeSystemScheme, getColorScheme)
}
