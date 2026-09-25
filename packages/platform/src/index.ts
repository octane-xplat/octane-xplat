// Single index — each specifier resolves its own leaf through the suffix
// chain (.web under web conditions, .native/.ios/.android under native).
// Hook-bearing services live in .tsrx files with .ts shims so tsc's
// moduleSuffixes can reach them (docs/module-resolution.md).
export type {
	AppState,
	AppInfo,
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
	WindowSize,
} from './types'

export { device } from './device'
export { geolocation } from './geolocation'
export { connectivity } from './connectivity'
export { appInfo } from './app-info'
export { openUrl, openSettings } from './open-url'
export { storage } from './storage'
export { clipboard } from './clipboard'
export { share } from './share'
export { haptics } from './haptics'
export { secureStorage } from './secure-storage'
export { files } from './files'
export { notifications } from './notifications'
export { permissions } from './permissions'
export { systemBars } from './system-bars'
export { announce } from './a11y'
export { locale } from './locale'
export { media } from './media'
export { biometrics } from './biometrics'
export { onDeepLink, consumeInitialUrl } from './deep-links'
export { useAppState, useBackHandler } from './lifecycle'
export { useSafeAreaInsets } from './safe-area'
export { useWindowSize } from './screen'
