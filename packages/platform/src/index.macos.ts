import { useSyncExternalStore } from 'octane'
import type {
	AppInfo,
	AppState,
	Capability,
	ConnectivityImpl,
	ConnectivityState,
	DeviceInfo,
	Insets,
	Locale,
	OpenSettingsImpl,
	PermissionResult,
	WebAuthnImpl,
	WindowSize,
} from './types'

export type {
	AppState,
	AppInfo,
	AuthSessionImpl,
	AuthSessionOptions,
	AuthSessionResult,
	Capability,
	ConnectionType,
	ConnectivityImpl,
	ConnectivityState,
	DeviceInfo,
	Insets,
	Locale,
	PermissionKind,
	PermissionResult,
	OpenSettingsImpl,
	WebAuthnAssertionJSON,
	WebAuthnCreateOptionsJSON,
	WebAuthnGetOptionsJSON,
	WebAuthnImpl,
	WebAuthnRegistrationJSON,
	WindowSize,
} from './types'

export type { BreakpointMap, BreakpointMatches } from './breakpoints.types'

type AppKitHost = {
	appInfo?: AppInfo
	appState?: AppState
	windowSize?: WindowSize
	announce?: (text: string) => void
	readClipboard?: () => string | null
	writeClipboard?: (value: string) => boolean
	storageGet?: (key: string) => string | null
	storageSet?: (key: string, value: string) => void
	storageRemove?: (key: string) => void
	openUrl?: (url: string) => boolean
	onWindowResize?: (listener: () => void) => () => void
	onAppStateChange?: (listener: () => void) => () => void
	onDeepLink?: (listener: (url: string) => void) => () => void
	consumeInitialUrl?: () => string | null
}

const host = (): AppKitHost => (globalThis as any).__xplatAppKit ?? {}
const unsupported = async (): Promise<PermissionResult> => 'unsupported'

const language = Intl.DateTimeFormat().resolvedOptions().locale
const [languageTag = '', region = ''] = language.split(/[-_]/)

export const device: DeviceInfo = {
	os: 'macos',
	osVersion: 'unknown',
	model: 'Mac',
	manufacturer: 'Apple',
	language: languageTag,
	region,
}

export const appInfo: AppInfo = {
	get supported() {
		return host().appInfo?.supported ?? false
	},
	get version() {
		return host().appInfo?.version ?? null
	},
	get build() {
		return host().appInfo?.build ?? null
	},
	get bundleId() {
		return host().appInfo?.bundleId ?? null
	},
}

export const locale: Locale = { tag: language, language: languageTag, region }

export const connectivity: ConnectivityImpl = {
	getState(): ConnectivityState {
		return { supported: false, online: false, type: 'unknown' }
	},
	subscribe(listener) {
		console.warn('[octane-xplat] Connectivity status is unsupported by the AppKit host.')
		return () => {
			void listener
		}
	},
}

const hostStorage = new Map<string, string>()

export const storage = {
	getString(key: string): string | null {
		return host().storageGet?.(key) ?? hostStorage.get(key) ?? null
	},
	setString(key: string, value: string): void {
		const set = host().storageSet
		if (set) {
			set(key, value)
			return
		}

		hostStorage.set(key, value)
	},
	remove(key: string): void {
		const remove = host().storageRemove
		if (remove) {
			remove(key)
			return
		}

		hostStorage.delete(key)
	},
}

export const clipboard = {
	get canCopy() {
		return !!host().readClipboard && !!host().writeClipboard
	},
	async writeText(value: string): Promise<boolean> {
		return host().writeClipboard?.(value) ?? false
	},
	async readText(): Promise<string | null> {
		return host().readClipboard?.() ?? null
	},
	async write(value: string): Promise<boolean> {
		return host().writeClipboard?.(value) ?? false
	},
	async read(): Promise<string | null> {
		return host().readClipboard?.() ?? null
	},
}

export const webAuthn: Capability<WebAuthnImpl> = {
	supported: false,
	ensure: unsupported,
	impl: null,
}

export { authSession } from './auth-session.macos'
export const openSettings: Capability<OpenSettingsImpl> = {
	supported: false,
	ensure: unsupported,
	impl: null,
}

export { permissions } from './permissions'
export const systemBars = {
	setColor(_color: string): void {
		console.warn('[octane-xplat] System bars are unsupported by the AppKit host.')
	},
}

/**
 * Request an accessibility announcement of localized text without moving focus.
 * AppKit uses medium priority. Blank text, a missing host, or a stopped host
 * does nothing. Each call posts independently; no message or window is retained.
 * Returning does not acknowledge speech or braille delivery by VoiceOver.
 */
export function announce(text: string): void {
	if (text.trim()) {
		host().announce?.(text)
	}
}

export function openUrl(url: string): boolean {
	return host().openUrl?.(url) ?? false
}

export function useAppState(): AppState {
	return useSyncExternalStore(
		(listener) => host().onAppStateChange?.(listener) ?? (() => {}),
		() => host().appState ?? 'active',
	)
}

const fallbackWindowSize: WindowSize = { width: 0, height: 0, orientation: 'landscape' }
export function useWindowSize(): WindowSize {
	return useSyncExternalStore(
		(listener) => host().onWindowResize?.(listener) ?? (() => {}),
		() => host().windowSize ?? fallbackWindowSize,
	)
}

export function useSafeAreaInsets(): Insets {
	return { top: 0, right: 0, bottom: 0, left: 0 }
}

export function onDeepLink(listener: (url: string) => void): () => void {
	return host().onDeepLink?.(listener) ?? (() => {})
}

export function consumeInitialUrl(): string | null {
	return host().consumeInitialUrl?.() ?? null
}

export function useBackHandler(_listener: () => boolean): () => void {
	return () => {}
}

export function useBreakpoints$<T extends Record<string, number>>(
	thresholds: T,
): { [K in keyof T]: boolean } {
	const width = useWindowSize().width
	return Object.fromEntries(
		Object.entries(thresholds).map(([name, threshold]) => [name, width >= threshold]),
	) as {
		[K in keyof T]: boolean
	}
}
