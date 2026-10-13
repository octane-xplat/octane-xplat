import type { AppInfo, AppState, WindowSize } from './types'

/** The AppKit host seam — installed as `globalThis.__xplatAppKit` by the
 *  macOS host before app code runs. Every hook is optional; partial or
 *  absent hosts degrade honestly rather than throwing. */
export type AppKitHost = {
	appInfo?: AppInfo
	appState?: AppState
	windowSize?: WindowSize
	announce?: (text: string) => void
	readClipboard?: () => string | null
	writeClipboard?: (value: string) => boolean
	storageGet?: (key: string) => string | null
	storageSet?: (key: string, value: string) => void
	storageRemove?: (key: string) => void
	/** Deliver pending storage writes to the host's durable store;
	 *  returns whether the host confirmed the hand-off. */
	storageFlush?: () => boolean
	openUrl?: (url: string) => boolean
	onWindowResize?: (listener: () => void) => () => void
	onAppStateChange?: (listener: () => void) => () => void
	onDeepLink?: (listener: (url: string) => void) => () => void
	consumeInitialUrl?: () => string | null
}

export const host = (): AppKitHost => (globalThis as any).__xplatAppKit ?? {}
