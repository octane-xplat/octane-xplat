import type { AppInfo, AppState, PermissionResult, WindowSize } from './types'

export type HostColorScheme = 'light' | 'dark'
export type HostShareResult = 'shared' | 'copied' | 'unavailable'

export interface HostFileRef {
	name: string
	uri: string
}

export interface HostFilePickOptions {
	startingFolder?: string
}

export type HostWindowKind = 'regular' | 'dialog'

export interface HostWindowOpenOptions {
	id?: string
	url?: string
	data?: unknown
	kind?: HostWindowKind
	title?: string
	size?: { width: number; height: number }
}

export interface HostShareInput {
	text?: string
	url?: string
	title?: string
}

/** Framework services exposed by a native desktop webview host. */
export interface FrameworkHostServices {
	app: {
		getInfo(): AppInfo
		getState(): AppState
		getWindowSize(): WindowSize
		consumeInitialUrl(): string | null
	}
	clipboard: {
		read(): Promise<string | null>
		write(value: string): Promise<boolean>
	}
	files: {
		pick(accept?: string, options?: HostFilePickOptions): Promise<HostFileRef | null>
		readText(uri: string): Promise<string | null>
		writeText(name: string, text: string): Promise<HostFileRef | null>
	}
	notifications: {
		ensure(): Promise<PermissionResult>
		notify(title: string, body?: string): Promise<boolean>
	}
	secureStorage: {
		get(key: string): Promise<string | null>
		set(key: string, value: string): Promise<boolean>
		remove(key: string): Promise<boolean>
	}
	appearance: {
		get(): Promise<HostColorScheme>
	}
	windows: {
		open(options: HostWindowOpenOptions): Promise<string>
		close(id: string): Promise<boolean>
		setTitle(id: string, title: string): Promise<boolean>
	}
	system: {
		openUrl(url: string): Promise<boolean>
		openPath(path: string): Promise<boolean>
		shareContent(input: HostShareInput): Promise<HostShareResult>
	}
	storage: {
		get(key: string): Promise<string | null>
		set(key: string, value: string): Promise<void>
		remove(key: string): Promise<void>
	}
}

/** Events emitted by framework-owned desktop services. */
export interface FrameworkHostEvents {
	'app.state.change': AppState
	'window.resize': WindowSize
	'app.deep-link': string
	'appearance.change': HostColorScheme
	'windows.closed': string
}

/** Synchronous values injected before the web document starts. */
export interface HostBootstrapState {
	appInfo?: AppInfo
	appState?: AppState
	windowSize?: WindowSize
	initialUrl?: string | null
	colorScheme?: HostColorScheme
}
