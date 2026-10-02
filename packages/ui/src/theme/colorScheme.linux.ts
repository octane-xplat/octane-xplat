// Color scheme — Linux webview leaf. The host reads the system appearance
// (org.freedesktop.portal.Settings → libadwaita fallback) before the webview
// loads and injects window.__xplatColorScheme at document-start — the
// useSyncExternalStore contract is sync, so a bridge round-trip can't supply
// the initial value. Changes arrive as xplat:appearance.change CustomEvents
// (emitted by platform's bridge emit side-channel; kept dependency-free like
// colorScheme.macos.ts's __xplatAppKit). WebKitGTK's own prefers-color-scheme
// does not follow GNOME dark style, so matchMedia is only the unbridged
// fallback.
import { useSyncExternalStore } from 'octane'

export type { ColorScheme } from '../props'
import type { ColorScheme } from '../props'

const bridged = () =>
	typeof window !== 'undefined' && (window as any).webkit?.messageHandlers?.xplat !== undefined

let lastScheme: ColorScheme =
	((window as any).__xplatColorScheme as ColorScheme | undefined) ?? 'light'

function getSystemScheme(): ColorScheme {
	return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'
}

export function getColorScheme(): ColorScheme {
	return bridged() ? lastScheme : getSystemScheme()
}

export function subscribeSystemScheme(cb: () => void): () => void {
	if (!bridged()) {
		const mq = matchMedia('(prefers-color-scheme: dark)')
		mq.addEventListener('change', cb)
		return () => mq.removeEventListener('change', cb)
	}

	const onChange = (e: Event) => {
		const detail = (e as CustomEvent).detail
		lastScheme = detail === 'dark' ? 'dark' : 'light'
		cb()
	}

	window.addEventListener('xplat:appearance.change', onChange)
	return () => window.removeEventListener('xplat:appearance.change', onChange)
}

export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribeSystemScheme, getColorScheme)
}
