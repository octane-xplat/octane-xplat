// @octane-xplat/cli/vite — the shared native Vite preset.
//
// Everything in here was previously per-app boilerplate (copied between
// vite.config.native.mts files) or an app-owned workaround: the nativescript
// renderer rules, the octane→universal/native alias, the platform-suffix
// extension chain, the deps-bundle plugin exclusions, the HMR watchdog, and
// the px→dip CSS rewrite. Apps now write:
//
//   import { defineConfig } from 'vite'
//   import { xplatNative } from '@octane-xplat/cli/vite'
//   export default defineConfig(({ mode }) => xplatNative(mode))
//
// The preset calls octaneConfig itself — consumers only merge in
// app-specific extras via the `extra` option or a vite mergeConfig wrapper.

import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// The toolchain modules (vite, vite-octane, the nativescript renderer)
// belong to the CONSUMING app, not to this package — under pnpm's isolated
// linker a bare import here would miss them entirely. createRequire from
// the app's cwd makes the preset use the app's own pinned versions.
// realpathSync matters: resolve() returns the symlinked node_modules path
// and ESM import() does not realpath — loading vite through the symlink
// leaves its internal 'rolldown' bare-import stranded outside its .pnpm
// peer dir.
const req = createRequire(join(process.cwd(), 'package.json'))
const importApp = (spec) =>
	import(pathToFileURL(realpathSync(req.resolve(spec))).href)

/**
 * Shared stylesheets are authored in web units: `px` means the web pixel,
 * which maps to a device-independent unit. NativeScript CSS reads `px` as
 * _device_ pixels — `width:88px` measures 29 dips on a 3x device — so the
 * native bundle rewrites px lengths to `dip`. Inline `style` props are
 * already dips and are untouched.
 */
function pxToDip() {
	return {
		name: 'xplat-px-to-dip',
		enforce: 'pre',
		transform(code, id) {
			if (id.split('?')[0].endsWith('.css'))
				return code.replace(/(-?\d+(?:\.\d+)?)px\b/g, '$1dip')
		},
	}
}

/**
 * On-device HMR needs the app's websocket client to attach to /ns-hmr after
 * the HTTP boot. When it never does — the websockets polyfill missing from
 * the bundle, `adb reverse` not covering the vite port, or a boot error
 * before the client import — every save logs `recipients=0` and the device
 * silently stays stale. Warn once when a dev session was fetched but no
 * client ever attached.
 */
function nsHmrClientWatchdog() {
	return {
		name: 'xplat-ns-hmr-client-watchdog',
		configureServer(server) {
			let everConnected = false
			let timer
			// Hook the raw 'request' event — middlewares.use() appends after
			// the ns plugin's session handler, which ends the response without
			// next(), so a connect middleware never observes /__ns_dev__/session.
			server.httpServer?.on('request', (req) => {
				if (!everConnected && req.url?.startsWith('/__ns_dev__/session')) {
					clearTimeout(timer)
					timer = setTimeout(() => {
						if (!everConnected) {
							console.warn(
								'[xplat] the app fetched its dev session but no /ns-hmr ' +
									'websocket client connected — edits will not reach the ' +
									'device. Check that @valor/nativescript-websockets is ' +
									'installed, `adb reverse tcp:<port>` covers this vite ' +
									'port (physical Android), and the device log for ' +
									'hmr-client errors.',
							)
						}
					}, 15_000)
				}
			})

			server.httpServer?.on('upgrade', (req) => {
				if (req.url?.startsWith('/ns-hmr')) {
					everConnected = true
					clearTimeout(timer)
				}
			})
		},
	}
}

/** The full extension chain, most-specific first: .ios/.android → .native →
 *  shared. NS's own file qualifiers (.land, .minWH600…) still apply to
 *  assets on top of this. */
export const nativeExtensions = [
	'.ios.tsrx',
	'.android.tsrx',
	'.native.tsrx',
	'.tsrx',
	'.ios.tsx',
	'.android.tsx',
	'.native.tsx',
	'.tsx',
	'.ios.ts',
	'.android.ts',
	'.native.ts',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

/** Default renderer rules: every component file the native graph can reach —
 *  src plus linked package source — compiles under the nativescript
 *  renderer. `.web.*` leaves legitimately use DOM globals; they're
 *  unreachable from the native entry but must not fail validation, so each
 *  rule excludes them. */
const nativeRules = [
	{
		include: 'src/**/*.{ts,tsx,tsrx}',
		exclude: 'src/**/*.web.*',
		renderer: 'nativescript',
	},
	{
		include: '**/packages/**/*.{ts,tsx,tsrx}',
		exclude: '**/*.web.*',
		renderer: 'nativescript',
	},
]

/**
 * Native (iOS/Android) Vite config. `env` is defineConfig's { mode }; `extra`
 * is merged in last for app-specific additions (own plugins, extra
 * optimizeDeps, server options).
 *
 * opts:
 *   - deps: extra optimizeDeps.exclude entries (app-shipped NS plugins)
 *   - rules: renderer rules override (defaults cover src + packages source)
 */
export async function xplatNative(env, opts = {}) {
	const mode = typeof env === 'string' ? env : env.mode
	const [{ mergeConfig }, { octaneConfig }, { nativeScriptRenderer }] =
		await Promise.all([
			importApp('vite'),
			importApp('@nativescript-community/vite-octane'),
			importApp('@nativescript-community/octane/config'),
		])

	return mergeConfig(
		octaneConfig(
			{ mode },
			{
				octane: {
					renderers: {
						// The stock renderer ships validation.forbiddenGlobals/Imports
						// by default since 0.2.1 (upstream #6).
						registry: { nativescript: nativeScriptRenderer },
						rules: opts.rules ?? nativeRules,
					},
				},
			},
		),
		{
			plugins: [pxToDip(), nsHmrClientWatchdog()],
			optimizeDeps: {
				// Flattened optimizeDeps chunks get mangled by the /ns/m device
				// transform (`import import "/ns/core/utils"`) and miss the vendor
				// manifest — serve @nativescript plugins per-module instead.
				exclude: [
					'@nativescript/biometrics',
					'@nativescript/haptics',
					'@nativescript/imagepicker',
					'@nativescript/local-notifications',
					'@nativescript/secure-storage',
					'@nativescript/social-share',
					'@nativescript-community/ui-svg',
					'nativescript-clipboard',
					...(opts.deps ?? []),
				],
			},
			resolve: {
				conditions: ['native'],
				// The compiler retargets hook imports to @nativescript-community/
				// octane, but the deps-bundle scanner sees source-level 'octane'
				// first — without this it vendors octane/dist/index.js (the full
				// DOM runtime). Exact-match only: 'octane/universal/native' itself
				// must not be rewritten.
				alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
				// ns-vite sets preserveSymlinks:true; under pnpm's isolated layout
				// that resolves a dep's imports from the symlink path instead of
				// its real .pnpm dir, so declared transitive deps can't be found.
				preserveSymlinks: false,
				extensions: nativeExtensions,
			},
		},
		opts.extra ?? {},
	)
}
