// Single index — each specifier resolves its own leaf through the suffix
// chain (.web under web conditions, unsuffixed native defaults / .mobile/.ios/.android under native).
// Hook-bearing services live in .tsrx files. Consumers typecheck the generated
// declarations while the app compiler resolves each runtime platform leaf.
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
	RandomImpl,
	OpenSettingsImpl,
	WebAuthnAssertionJSON,
	WebAuthnCreateOptionsJSON,
	WebAuthnGetOptionsJSON,
	WebAuthnImpl,
	WebAuthnRegistrationJSON,
	WindowSize,
} from './types'

export { device } from './device'
export { connectivity } from './connectivity'
export { appInfo } from './app-info'
export { openUrl, openSettings } from './open-url'
export { storage } from './storage'
export { clipboard } from './clipboard'
export { permissions } from './permissions'
export { systemBars } from './system-bars'
export { announce } from './a11y'
export { locale } from './locale'
export { webAuthn } from './webauthn'
export { random } from './random'
export { authSession } from './auth-session'
export { onDeepLink, consumeInitialUrl } from './deep-links'
export { useAppState, useBackHandler } from './lifecycle'
export { useSafeAreaInsets } from './safe-area'
export { useWindowSize } from './screen'
export { useBreakpoints$ } from './breakpoints'
export type { BreakpointMap, BreakpointMatches } from './breakpoints.types'

export { keepAwake, KeepAwakeDefaultTag } from './keep-awake'
export { useKeepAwake } from './use-keep-awake'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'
