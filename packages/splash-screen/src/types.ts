/** Expo-shaped dismissal options. Fade is an iOS option. */
export interface SplashScreenOptions {
	/** Fade/exit animation duration in milliseconds. Defaults to 400; range 0–60000. */
	duration?: number
	/** Fade the iOS launch storyboard out. Defaults to false. */
	fade?: boolean
}
export interface SplashScreenCapabilities {
	readonly hold: boolean
	readonly fade: boolean
	readonly animationDuration: boolean
}
