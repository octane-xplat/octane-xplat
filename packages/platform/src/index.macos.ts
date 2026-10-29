import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import { host } from './appkit-host'
import type {
	AppInfo,
	DeviceInfo,
	Locale,
	WebAuthnImpl,
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

export { clipboard } from './clipboard.macos'

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

export { useAppState, useBackHandler } from './lifecycle.macos'
export { useWindowSize } from './screen.macos'
export { useSafeAreaInsets } from './safe-area.macos'
export { useBreakpoints$ } from './breakpoints.macos'

export function onDeepLink(listener: (url: string) => void): () => void {
	return host().onDeepLink?.(listener) ?? (() => {})
}

export function consumeInitialUrl(): string | null {
	return host().consumeInitialUrl?.() ?? null
}

export { keepAwake, KeepAwakeDefaultTag } from './keep-awake.macos'
export { useKeepAwake } from './use-keep-awake.macos'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'
