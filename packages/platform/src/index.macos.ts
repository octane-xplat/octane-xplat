import { useSyncExternalStore } from 'octane'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import { host } from './appkit-host'
import type {
	AppInfo,
	AppState,
	DeviceInfo,
	Insets,
	Locale,
	WebAuthnImpl,
	WindowSize,
} from './types'

export type {
	AppState,
	AppInfo,
	AuthSessionImpl,
	AuthSessionOptions,
	AuthSessionResult,
	ConnectionType,
	ConnectivityImpl,
	ConnectivityState,
	DeviceInfo,
	Insets,
	Locale,
	PermissionKind,
	RandomImpl,
	OpenSettingsImpl,
	WebAuthnAssertionJSON,
	WebAuthnCreateOptionsJSON,
	WebAuthnGetOptionsJSON,
	WebAuthnImpl,
	WebAuthnRegistrationJSON,
	WindowSize,
} from './types'

export type { BreakpointMap, BreakpointMatches } from './breakpoints.types'

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'

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

export { connectivity } from './connectivity.macos'

export { storage } from './storage.macos'

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

const webAuthnUnavailable = () => Promise.reject(new UnavailabilityError('webAuthn'))

export const webAuthn: Service<WebAuthnImpl> = {
	supported: false,
	isAvailable: async () => false,
	create: webAuthnUnavailable,
	get: webAuthnUnavailable,
}

export { authSession } from './auth-session.macos'
export { random } from './random.macos'
export { openUrl, openSettings } from './open-url.macos'

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

export { keepAwake, KeepAwakeDefaultTag } from './keep-awake.macos'
export { useKeepAwake } from './use-keep-awake.macos'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'
