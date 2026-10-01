import type { Plugin, UserConfig } from 'vite'

export const nativeExtensions: string[]

/** Fails `vite build` when a platform-suffixed module foreign to the target
 *  is reachable in the graph (e.g. a `.web` leaf pulled into a mobile
 *  bundle transitively — lint catches direct imports, this catches the
 *  transitive path). Warns once per module in dev. */
export function xplatBoundary(
	platform?: 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'visionos' | 'native',
): Plugin

/** `define` entries implementing the `process.env.NODE_ENV` npm convention —
 *  upstream octane deps read it bare and assume the consumer bundler
 *  statically rewrites the member expression. Only the literal
 *  `process.env.NODE_ENV` read is covered; `process.env.FOO` or whole-object
 *  `process` reads still fail on runtimes without a `process` global. */
export function xplatNodeEnvDefine(mode: string): Record<string, string>

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
