/** Expo-shaped dismissal options. Fade is an iOS option. */
export interface SplashScreenOptions {
	/** Fade/exit animation duration in milliseconds. Defaults to 400; range 0–60000. */
	duration?: number
	/** Fade the iOS launch storyboard out. Defaults to false. */
	fade?: boolean
}
/** Per-platform feature flags — a false flag means the matching option is
 *  accepted but ignored on that platform. */
export interface SplashScreenCapabilities {
	/** Whether preventAutoHideAsync can hold the launch screen. */
	readonly hold: boolean
	/** Whether a fade-out animation is supported (iOS storyboard only). */
	readonly fade: boolean
	/** Whether the exit animation duration is configurable. */
	readonly animationDuration: boolean
}
