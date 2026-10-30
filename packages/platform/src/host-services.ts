import type { PermissionStatus } from '@octane-xplat/lib/capability'
import type { AppInfo, AppState, WindowSize } from './types'

/** Light/dark/host-default schemes. */
export type HostColorScheme = 'light' | 'dark'
/** Share outcome. */
export type HostShareResult = 'shared' | 'copied' | 'unavailable'

/** Host-side file reference. */
export interface HostFileRef {
	/** Display/file name. */
	name: string
	/** Opaque resource URI. */
	uri: string
}

/** File-picker options. */
export interface HostFilePickOptions {
	/** Directory hint. */
	startingFolder?: string
}

/** Window kind discriminator. */
export type HostWindowKind = 'regular' | 'dialog'

/** Window-open options. */
export interface HostWindowOpenOptions {
	/** Opaque identifier. */
	id?: string
	/** Resource URL. */
	url?: string
	/** Opaque payload. */
	data?: unknown
	/** Kind discriminator. */
	kind?: HostWindowKind
	/** Title/headline text. */
	title?: string
	/** Requested size. */
	size?: { width: number; height: number }
}

/** Share payload. */
export interface HostShareInput {
	/** Text payload. */
	text?: string
	/** Resource URL. */
	url?: string
	/** Title/headline text. */
	title?: string
	/** Local file path to share — hosts present a file item in the picker. */
	file?: string
}

/** Framework services exposed by a native desktop webview host. */
export interface FrameworkHostServices {
	/** Hold the screen on. */
	keepAwake: {
		activate(tag: string): Promise<boolean>
		deactivate(tag: string): Promise<boolean>
	}
	/** App services section. */
	app: {
		getInfo(): AppInfo
		getState(): AppState
		getWindowSize(): WindowSize
		consumeInitialUrl(): string | null
	}
	/** Clipboard service. */
	clipboard: {
		read(): Promise<string | null>
		write(value: string): Promise<boolean>
	}
	/** Files service. */
	files: {
		pick(accept?: string, options?: HostFilePickOptions): Promise<HostFileRef | null>
		readText(uri: string): Promise<string | null>
		writeText(name: string, text: string): Promise<HostFileRef | null>
	}
	/** Notifications service. */
	notifications: {
		ensure(): Promise<PermissionStatus>
		notify(title: string, body?: string): Promise<boolean>
	}
	/** Secure-storage service. */
	secureStorage: {
		get(key: string): Promise<string | null>
		set(key: string, value: string): Promise<boolean>
		remove(key: string): Promise<boolean>
	}
	/** Appearance service. */
	appearance: {
		get(): Promise<HostColorScheme>
	}
	/** Window service. */
	windows: {
		open(options: HostWindowOpenOptions): Promise<string>
		close(id: string): Promise<boolean>
		setTitle(id: string, title: string): Promise<boolean>
	}
	/** System service. */
	system: {
		openUrl(url: string): Promise<boolean>
		openPath(path: string): Promise<boolean>
		shareContent(input: HostShareInput): Promise<HostShareResult>
	}
	/** Key-value storage service. */
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
	/** App metadata. */
	appInfo?: AppInfo
	/** App lifecycle state. */
	appState?: AppState
	/** Window size. */
	windowSize?: WindowSize
	/** Deep link that launched the app. */
	initialUrl?: string | null
	/** Light/dark preference. */
	colorScheme?: HostColorScheme
}
