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
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
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
const importApp = (spec) => import(pathToFileURL(realpathSync(req.resolve(spec))).href)

// The toolchain/runtime realms have their own serving paths (`/ns/core`,
// dev tooling) — never exclude them into the per-module path.
const NS_REALM = new Set(['@nativescript/core', '@nativescript/vite'])

/**
 * Every installed package carrying a `nativescript` key in package.json,
 * reachable from the app's dependency graph — the same BFS the `ns` CLI
 * runs at `ns prepare` time (deps of deps, resolved from each package's
 * real .pnpm dir, so plugin-bearing leaf packages like @octane-xplat/gif
 * surface their native plugins here too). The app doesn't have to declare
 * each plugin by hand.
 */
const collectNsPluginDeps = (rootDir) => {
	const out = new Set()
	const visited = new Set()
	const queue = [rootDir]
	while (queue.length) {
		const dir = queue.shift()

		let pkg
		try {
			pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
		} catch {
			continue
		}

		for (const name of Object.keys(pkg.dependencies ?? {})) {
			if (visited.has(name)) {
				continue
			}

			visited.add(name)

			const pkgJsonPath = join(dir, 'node_modules', name, 'package.json')
			let depDir
			try {
				depDir = dirname(realpathSync(pkgJsonPath))
			} catch {
				try {
					depDir = dirname(req.resolve(`${name}/package.json`, { paths: [dir] }))
				} catch {
					continue
				}
			}

			const depPkg = JSON.parse(readFileSync(join(depDir, 'package.json'), 'utf8'))
			if (depPkg.nativescript && !NS_REALM.has(name)) {
				out.add(name)
			}

			queue.push(depDir)
		}
	}

	return out
}

/** CSS that NS parses but silently ignores or misreads — the app looks
 *  identical in source but diverges at runtime. Warned at build time so the
 *  divergence is loud instead of invisible. Each entry: pattern + the
 *  portable alternative. */
const CSS_DIVERGENCES = [
	[
		/margin-(?:left|right|top|bottom)\s*:\s*auto|margin\s*:[^;{}]*\bauto\b/,
		'auto margins are ignored on native — use justify-content, alignSelf, or a <Spacer/>',
	],
	[
		/position\s*:\s*(fixed|sticky)\b/,
		'position: fixed/sticky does not exist on native — overlays go through Overlay/Modal services, not positioning',
	],
	[/\bfloat\s*:/, 'float is unsupported on native — use flex rows'],
	[
		/\bbox-shadow\s*:/,
		'box-shadow is inert on native — Android elevation and iOS shadows do not map to it (framework mapping is a TODO)',
	],
	[
		/white-space\s*:\s*pre-wrap\b/,
		'Label rejects white-space:pre-wrap — "wrap" is the native wrap value (no space/newline preservation)',
	],
]

/**
 * Shared stylesheets are authored in web units and web semantics. For the
 * native bundle this transform (a) rewrites `px` lengths to `dip` — NS CSS
 * reads `px` as _device_ pixels, not dips (`width:88px` measures 29 dips on
 * a 3x device); inline `style` props are already dips and untouched — and
 * (b) warns once per file on declarations NS silently ignores, so the
 * divergence is loud at build time.
 */
function pxToDip() {
	const warned = new Set()
	const process = (code, id, warn) => {
		// Framework authors mark web-only rule blocks — overlays, popovers,
		// dialog modals render through RootLayout/showModal natively, so
		// their CSS is dead weight (and would trip the divergence warnings).
		// Stripped before the warn pass.
		code = code.replace(
			/\/\*\s*xplat-web-only:start[\s\S]*?\*\/[\s\S]*?\/\*\s*xplat-web-only:end[\s\S]*?\*\//g,
			'',
		)

		// `@import` inlining reads the target file's raw text — it never
		// reaches this hook, so inlined css ships px units AND un-stripped
		// xplat-web-only rules (they land as real native props, e.g.
		// translate(-50%,-50%) → translateY:-50dip). Import css files as JS
		// modules instead — each then passes through this transform.
		// Strip comments first so `@import` inside a comment doesn't warn.
		const uncommented = code.replace(/\/\*[\s\S]*?\*\//g, '')
		if (/@import\s+['"]/.test(uncommented) && !warned.has(id + '|@import')) {
			warned.add(id + '|@import')
			warn(
				`${id}: @import inlining bypasses the px→dip rewrite and the ` +
					`xplat-web-only strip — import css files as JS modules instead ` +
					`(import 'pkg/file.css')`,
			)
		}

		for (const [re, hint] of CSS_DIVERGENCES) {
			const key = id + '|' + hint
			if (re.test(code) && !warned.has(key)) {
				warned.add(key)
				warn(`${id}: ${hint}`)
			}
		}

		return code.replace(/(-?\d+(?:\.\d+)?)px\b/g, '$1dip')
	}

	return {
		name: 'xplat-native-css',
		enforce: 'pre',
		// Per-file pass — covers dev serving where css is transformed
		// per module (the /ns/m bridge path).
		transform(code, id) {
			if (!id.split('?')[0].endsWith('.css')) {
				return
			}

			return process(code, id, (m) => this.warn(m))
		},
		// Build pass — @nativescript/vite collects emitted .css assets in
		// generateBundle and serializes them via addTaggedAdditionalCSS;
		// @import inlining bypasses the transform hook, so the asset text
		// must be rewritten here. 'pre' ordering lands us before it.
		generateBundle(_opts, bundle) {
			for (const file of Object.values(bundle)) {
				if (file.type === 'asset' && file.fileName.endsWith('.css')) {
					const src =
						typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source)

					file.source = process(src, file.fileName, (m) => this.warn(m))
				}
			}
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
	'.ios.js',
	'.android.js',
	'.native.js',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

function nativePlatformExtensions() {
	let platform
	try {
		const env = JSON.parse(process.env.NATIVESCRIPT_BUNDLER_ENV ?? '{}')
		platform = env.platform ?? (env.android ? 'android' : env.ios || env.visionos ? 'ios' : undefined)
	} catch {}

	const args = process.argv.slice(2)
	if (!platform) {
		if (args.some((arg) => arg === '--android' || arg === '--env.android' || arg.startsWith('--env.android='))) {
			platform = 'android'
		} else if (
			args.some((arg) => arg === '--ios' || arg === '--env.ios' || arg.startsWith('--env.ios=') || arg === '--visionos')
		) {
			platform = 'ios'
		} else {
			const platformIndex = args.indexOf('--platform')
			const value = args.find((arg) => arg.startsWith('--platform='))?.slice('--platform='.length)
			platform = value ?? (platformIndex >= 0 ? args[platformIndex + 1] : undefined)
		}
	}

	if (platform !== 'android' && platform !== 'ios' && platform !== 'visionos') {
		return nativeExtensions
	}

	const target = platform === 'android' ? '.android' : '.ios'
	return [
		`${target}.tsrx`,
		'.native.tsrx',
		'.tsrx',
		`${target}.tsx`,
		'.native.tsx',
		'.tsx',
		`${target}.ts`,
		'.native.ts',
		'.ts',
		`${target}.js`,
		'.native.js',
		'.mjs',
		'.mts',
		'.jsx',
		'.js',
		'.json',
	]
}

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
 *   - deps: extra optimizeDeps.exclude entries — nativescript-keyed deps are
 *     already collected automatically; use this for anything else that must
 *     stay per-module in dev (e.g. a plugin missed by the scan)
 *   - rules: renderer rules override (defaults cover src + packages source)
 */
export async function xplatNative(env, opts = {}) {
	const mode = typeof env === 'string' ? env : env.mode
	const [{ mergeConfig }, { octaneConfig }, { nativeScriptRenderer }] = await Promise.all([
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
			build: {
				rolldownOptions: {
					// Dev/HMR universal emit retains JSX in expression props
					// (e.g. `renderItem={(item) => <gridlayout>…}`) for the file's
					// own @jsxImportSource pragma to lower. Rolldown only parses
					// JSX in script-lang modules, so mark .tsrx transform
					// output tsx.
					moduleTypes: { '.tsrx': 'tsx' },
				},
			},
			optimizeDeps: {
				// A dep discovered mid-boot re-commits the optimizer's
				// browserHash, staling every `?v=` stamp already served —
				// vite expects the client to reload, the NS http-loader has
				// none, and the stale fetch 504s the boot. Upstream disables
				// discovery under HMR for angular/solid/react for exactly this;
				// linked packages are discovery-eligible because their realpath
				// sits outside node_modules. Freeze the dep set per session.
				noDiscovery: true,
				// Keep alien-signals (octane/signals' reactive impl) optimized:
				// with the dep set frozen its `?v` stamp is stable for the
				// session, and any path that still emits a .vite/deps URL gets
				// a live artifact instead of a per-module miss.
				include: ['alien-signals', 'alien-signals/system'],
				// Flattened optimizeDeps chunks get mangled by the /ns/m device
				// transform (`import import "/ns/core/utils"`) and miss the vendor
				// manifest — serve @nativescript plugins per-module instead.
				exclude: [...collectNsPluginDeps(process.cwd()), ...(opts.deps ?? [])],
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
				extensions: nativePlatformExtensions(),
			},
		},
		opts.extra ?? {},
	)
}
