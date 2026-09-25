import type { UserConfig } from 'vite'

export const nativeExtensions: string[]

export interface XplatNativeOptions {
	/** Extra optimizeDeps.exclude entries — app-shipped @nativescript plugins. */
	deps?: string[]
	/** Renderer rules override — defaults cover src/ + linked package source. */
	rules?: unknown[]
	/** App-specific config merged in last (plugins, server, …). */
	extra?: UserConfig
}

/** Full native (iOS/Android) Vite config — the shared preset. Resolves the
 *  app's own vite/vite-octane/octane toolchain (async because it loads
 *  through the app's node_modules). */
export function xplatNative(
	env: { mode: string } | string,
	opts?: XplatNativeOptions,
): Promise<UserConfig>
