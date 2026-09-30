import type { AppInfo, AppState, WindowSize } from './types'

export type HostColorScheme = 'light' | 'dark'
export type HostShareResult = 'shared' | 'copied' | 'unavailable'

/** Framework services exposed by a native desktop webview host. */
export interface FrameworkHostServices {
	app: {
		getInfo(): AppInfo
		getState(): AppState
		getWindowSize(): WindowSize
		consumeInitialUrl(): string | null
		getColorScheme(): HostColorScheme
	}
	clipboard: {
		read(): Promise<string | null>
		write(value: string): Promise<boolean>
	}
	storage: {
		get(key: string): Promise<string | null>
		set(key: string, value: string): Promise<void>
		remove(key: string): Promise<void>
	}
	system: {
		openUrl(url: string): Promise<boolean>
		shareContent(input: { text?: string; url?: string; title?: string }): Promise<HostShareResult>
	}
}

/** Events emitted by framework-owned desktop services. */
export interface FrameworkHostEvents {
	'app.state.change': AppState
	'window.resize': WindowSize
	'app.deep-link': string
	'appearance.change': HostColorScheme
}

/** Synchronous values injected before the web document starts. */
export interface HostBootstrapState {
	appInfo?: AppInfo
	appState?: AppState
	windowSize?: WindowSize
	initialUrl?: string | null
	colorScheme?: HostColorScheme
}
