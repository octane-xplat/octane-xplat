// Keep public declarations separate from PostCSS implementation imports: consumers
// can resolve a different compatible PostCSS patch through Vite.
import type { CssPlatform } from './css-platform.types.ts'

export type { CssPlatform } from './css-platform.types.ts'

import type { Plugin, UserConfig } from 'vite'

/** Select platform CSS siblings and compile build-time `@platform` blocks.
 * CSS suffixes replace the unsuffixed file; explicit platform filenames stay
 * exact. Native presets include this automatically; web apps add
 * `css('web')` to their Vite plugins. Defaults to `web`. */
export function css(platform?: CssPlatform): Plugin

/** @internal Native CSS normalization used by the platform presets. */
export type NativeCssPlugin = Plugin

/** @internal Native CSS normalization used by the platform presets. */
export function pxToDip(options?: { masonSafeAreaEnvironment?: boolean }): NativeCssPlugin

/** Select platform implementations for explicit TSRX paths in a custom
 * compiler or test setup. Standard platform presets and boundary include it.
 * Vite 8 dependency optimization defaults to each environment's resolved extension
 * order. Explicit optimizeDeps.rolldownOptions.resolve.extensions take precedence. */
export function tsrx(
  platform?:
    | 'web'
    | 'ios'
    | 'android'
    | 'macos'
    | 'windows'
    | 'linux'
    | 'gtk'
    | 'visionos'
    | 'native',
): Plugin

export const nativeExtensions: string[]

/** Selects platform implementations for unsuffixed explicit `.tsrx` imports.
 * Declaration-only contracts require a target implementation.
 * Includes tsrx and its platform-aware dependency optimization defaults.
 * Fails `vite build` when a platform-suffixed module foreign to the target
 *  is reachable in the graph (e.g. a `.web` leaf pulled into a mobile
 *  bundle transitively — lint catches direct imports, this catches the
 *  transitive path). Warns once per module in dev. */
export function boundary(
  platform?:
    | 'web'
    | 'ios'
    | 'android'
    | 'macos'
    | 'windows'
    | 'linux'
    | 'gtk'
    | 'visionos'
    | 'native',
): Plugin

/** `define` entries implementing the `process.env.NODE_ENV` npm convention —
 *  upstream octane deps read it bare and assume the consumer bundler
 *  statically rewrites the member expression. Only the literal
 *  `process.env.NODE_ENV` read is covered; `process.env.FOO` or whole-object
 *  `process` reads still fail on runtimes without a `process` global. */
export function nodeEnvDefine(mode: string): Record<string, string>

/** Development-action bridge (MCP). Dev-server middleware: the app announces
 *  its action registry and polls for invocations under /__xplat_dev__/; the
 *  MCP server discovers the endpoint through a same-uid session file under
 *  node_modules/.cache/xplat/dev-bridge/ and authenticates with the per-server
 *  token the plugin injects through a dev-only define. apply:'serve' — never
 *  part of a production build. Included automatically by native; web
 *  configs add it to `plugins` alongside boundary. */
export function devBridge(options?: { appRoot?: string }): Plugin

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
export function native(
  env: { mode: string } | string,
  opts?: XplatNativeOptions,
): Promise<UserConfig>

/** @deprecated Use {@link css}. */
export const xplatCss: typeof css

/** @deprecated Use {@link devBridge}. */
export const xplatDevBridge: typeof devBridge

/** @deprecated Use {@link tsrx}. */
export const xplatTsrx: typeof tsrx

/** @deprecated Use {@link boundary}. */
export const xplatBoundary: typeof boundary

/** @deprecated Use {@link native}. */
export const xplatNative: typeof native

/** @deprecated Use {@link nodeEnvDefine}. */
export const xplatNodeEnvDefine: typeof nodeEnvDefine
