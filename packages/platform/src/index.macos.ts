import { useSyncExternalStore } from 'octane'
import type {
	AppInfo,
	AppState,
	AuthSessionImpl,
	BiometricsImpl,
	Capability,
	ConnectivityImpl,
	ConnectivityState,
	DeviceInfo,
	FileRef,
	GeolocationImpl,
	HapticsImpl,
	Insets,
	Locale,
	MediaImpl,
	NotificationsImpl,
	OpenSettingsImpl,
	PermissionKind,
	PermissionResult,
	SecureStore,
	ShareResult,
	WebAuthnImpl,
	WindowSize,
} from './types'

export type {
	AppState,
	AppInfo,
	AuthSessionImpl,
	AuthSessionOptions,
	AuthSessionResult,
	BiometricsImpl,
	Capability,
	CapturePhotoOptions,
	ConnectionType,
	ConnectivityImpl,
	ConnectivityState,
	DeviceInfo,
	FileRef,
	GeolocationImpl,
	GeolocationOptions,
	GeolocationPosition,
	HapticsImpl,
	PickedImage,
	Insets,
	Locale,
	MediaImpl,
	MediaPermissionKind,
	NotificationsImpl,
	PermissionKind,
	PermissionResult,
	OpenSettingsImpl,
	SecureStore,
	ShareResult,
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
	get supported() { return host().appInfo?.supported ?? false },
	get version() { return host().appInfo?.version ?? null },
	get build() { return host().appInfo?.build ?? null },
	get bundleId() { return host().appInfo?.bundleId ?? null },
}

export const locale: Locale = { tag: language, language: languageTag, region }

export const connectivity: ConnectivityImpl = {
	getState(): ConnectivityState {
		return { supported: false, online: false, type: 'unknown' }
	},
	subscribe(listener) {
		console.warn('[octane-xplat] Connectivity status is unsupported by the AppKit host.')
		return () => { void listener }
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
	get canCopy() { return !!host().readClipboard && !!host().writeClipboard },
	async writeText(value: string): Promise<boolean> { return host().writeClipboard?.(value) ?? false },
	async readText(): Promise<string | null> { return host().readClipboard?.() ?? null },
	async write(value: string): Promise<boolean> { return host().writeClipboard?.(value) ?? false },
	async read(): Promise<string | null> { return host().readClipboard?.() ?? null },
}

export const secureStorage: Capability<SecureStore> = {
	supported: false,
	ensure: unsupported,
	impl: null,
}

export const haptics: Capability<HapticsImpl> = { supported: false, ensure: unsupported, impl: null }
export const notifications: Capability<NotificationsImpl> = { supported: false, ensure: unsupported, impl: null }
export const biometrics: Capability<BiometricsImpl> = { supported: false, ensure: unsupported, impl: null }
export const webAuthn: Capability<WebAuthnImpl> = { supported: false, ensure: unsupported, impl: null }
export const authSession: Capability<AuthSessionImpl> = { supported: false, ensure: unsupported, impl: null }
export const openSettings: Capability<OpenSettingsImpl> = { supported: false, ensure: unsupported, impl: null }
export const geolocation: Capability<GeolocationImpl> = { supported: false, ensure: unsupported, impl: null }

export const media: MediaImpl = {
	async ensure() { return 'unsupported' },
	async pickImage() { return null },
	async pickImages() { return [] },
	async capturePhoto() { return null },
}

export const permissions = {
	async ensure(_kind: PermissionKind): Promise<PermissionResult> { return 'unsupported' },
}

export const files = {
	async pick(): Promise<FileRef | null> {
		throw new Error('unsupported: the AppKit host does not provide a file picker')
	},
	async pickMultiple(): Promise<FileRef[]> {
		throw new Error('unsupported: the AppKit host does not provide a file picker')
	},
	async readText(_file: FileRef): Promise<string> {
		throw new Error('unsupported: AppKit file access is not wired')
	},
	async writeText(_name: string, _text: string): Promise<FileRef> {
		throw new Error('unsupported: the AppKit host does not provide a save panel')
	},
	release(_file: FileRef): void {},
}

export const share = {
	async text(_value: string): Promise<ShareResult> { return 'unavailable' },
}

export const systemBars = {
	setColor(_color: string): void {
		console.warn('[octane-xplat] System bars are unsupported by the AppKit host.')
	},
}

export function announce(_text: string): void {
	console.warn('[octane-xplat] Accessibility announcements are unsupported by the AppKit host.')
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
	return Object.fromEntries(Object.entries(thresholds).map(([name, threshold]) => [name, width >= threshold])) as {
		[K in keyof T]: boolean
	}
}
