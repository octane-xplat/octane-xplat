// The browser entry must not traverse the NativeScript-backed default barrel.
// Explicit suffixes keep Vite's dependency scan on the DOM implementation.
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

export { device } from './device.web'
export { connectivity } from './connectivity.web'
export { appInfo } from './app-info.web'
export { openUrl, openSettings } from './open-url.web'
export { storage } from './storage.web'
export { clipboard } from './clipboard.web'
export { permissions } from './permissions'
export { systemBars } from './system-bars.web'
export { announce } from './a11y.web'
export { locale } from './locale.web'
export { webAuthn } from './webauthn.web'
export { authSession } from './auth-session.web'
export { onDeepLink, consumeInitialUrl } from './deep-links.web'
export { useAppState, useBackHandler } from './lifecycle.web'
export { useSafeAreaInsets } from './safe-area.web'
export { useWindowSize } from './screen.web'
export { useBreakpoints$ } from './breakpoints.web'
export type { BreakpointMap, BreakpointMatches } from './breakpoints.types'
