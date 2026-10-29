import type { SplashScreenCapabilities, SplashScreenOptions } from './types'
export interface SplashScreenBackend {
	capabilities(): SplashScreenCapabilities
	preventAutoHide(): boolean
	hide(): void
	configure(options: SplashScreenOptions): void
}
