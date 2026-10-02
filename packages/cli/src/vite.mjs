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
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { unwrapCssLayers } from './css-layers.mjs'

// The toolchain modules (vite, vite-octane, the nativescript renderer)
// belong to the CONSUMING app, not to this package — under pnpm's isolated
// linker a bare import here would miss them entirely. createRequire from
// the app's cwd makes the preset use the app's own pinned versions.
// realpathSync matters: resolve() returns the symlinked node_modules path
// and ESM import() does not realpath — loading vite through the symlink
// leaves its internal 'rolldown' bare-import stranded outside its .pnpm
// peer dir.
// Lazy per call: the config file can be loaded while cwd is still the repo
// root (vite loadConfigFromFile), with the real app cwd set later — freezing
// a root-scoped require would strand importApp on the wrong package.json.
const importApp = (spec) => {
	const req = createRequire(join(process.cwd(), 'package.json'))
	return import(pathToFileURL(realpathSync(req.resolve(spec))).href)
}

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

		code = unwrapCssLayers(code)

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

/** The full extension chain, most-specific first: .ios/.android → .mobile →
 *  the unsuffixed native default (windows joins per-platform at build time —
 *  its qualifier must never shadow `.mobile` on ios/android builds). NS's
 *  own file qualifiers (.land, .minWH600…) still apply to assets on top. */
export const nativeExtensions = [
	'.ios.tsrx',
	'.android.tsrx',
	'.mobile.tsrx',
	'.tsrx',
	'.ios.tsx',
	'.android.tsx',
	'.mobile.tsx',
	'.tsx',
	'.ios.ts',
	'.android.ts',
	'.mobile.ts',
	'.ios.js',
	'.android.js',
	'.mobile.js',
	'.mjs',
	'.mts',
	'.ts',
	'.jsx',
	'.js',
	'.json',
]

/** The bundle platform the current invocation targets, read from
 *  NATIVESCRIPT_BUNDLER_ENV or the ns/vite CLI args — undefined when the
 *  caller can't be identified (the generic native chain applies). */
function nativePlatform() {
	let platform
	try {
		const env = JSON.parse(process.env.NATIVESCRIPT_BUNDLER_ENV ?? '{}')
		platform =
			env.platform ?? (env.android ? 'android' : env.ios || env.visionos ? 'ios' : undefined)
	} catch {}

	const args = process.argv.slice(2)
	if (!platform) {
		if (
			args.some(
				(arg) => arg === '--android' || arg === '--env.android' || arg.startsWith('--env.android='),
			)
		) {
			platform = 'android'
		} else if (
			args.some(
				(arg) =>
					arg === '--ios' ||
					arg === '--env.ios' ||
					arg.startsWith('--env.ios=') ||
					arg === '--visionos',
			)
		) {
			platform = 'ios'
		} else if (
			args.some(
				(arg) => arg === '--windows' || arg === '--env.windows' || arg.startsWith('--env.windows='),
			)
		) {
			platform = 'windows'
		} else {
			const platformIndex = args.indexOf('--platform')
			const value = args.find((arg) => arg.startsWith('--platform='))?.slice('--platform='.length)
			platform = value ?? (platformIndex >= 0 ? args[platformIndex + 1] : undefined)
		}
	}

	return platform
}

function nativePlatformExtensions() {
	const platform = nativePlatform()

	if (
		platform !== 'android' &&
		platform !== 'ios' &&
		platform !== 'visionos' &&
		platform !== 'windows'
	) {
		return nativeExtensions
	}

	const target = platform === 'android' ? '.android' : platform === 'windows' ? '.windows' : '.ios'
	// `.mobile` is ios+android shared divergence — windows doesn't inherit it;
	// its chain is .windows → the unsuffixed native default.

	if (platform === 'windows') {
		return [
			'.windows.tsrx',
			'.tsrx',
			'.windows.tsx',
			'.tsx',
			'.windows.ts',
			'.ts',
			'.windows.js',
			'.mjs',
			'.mts',
			'.jsx',
			'.js',
			'.json',
		]
	}

	return [
		`${target}.tsrx`,
		'.mobile.tsrx',
		'.tsrx',
		`${target}.tsx`,
		'.mobile.tsx',
		'.tsx',
		`${target}.ts`,
		'.mobile.ts',
		'.ts',
		`${target}.js`,
		'.mobile.js',
		'.mjs',
		'.mts',
		'.jsx',
		'.js',
		'.json',
	]
}

// ---------- platform boundary guard ----------

/** Platform suffixes a module filename can carry. Unsuffixed modules are the
 *  native default — legal in every bundle; only a tag foreign to the target
 *  is a leak. */
const PLATFORM_TAG = /\.(web|mobile|ios|android|macos|windows|linux)\.[^./\\]+$/

const boundaryAllowed = {
	web: new Set(['web']),
	// The mobile glob eagerly imports every ios/android/mobile leaf and
	// deriveRouteManifest picks by `prefer` at runtime — a sibling OS's file
	// in the graph is by design, so the mobile family shares one allowed set.
	ios: new Set(['ios', 'android', 'mobile']),
	visionos: new Set(['ios', 'android', 'mobile']),
	android: new Set(['ios', 'android', 'mobile']),
	macos: new Set(['macos']),
	// windows doesn't inherit .mobile (decision #64) — its chain is
	// .windows → the unsuffixed default.
	windows: new Set(['windows']),
	// Linux resolves .linux → .web → unsuffixed, so web leaves are legal there.
	linux: new Set(['linux', 'web']),
	// Bundle platform unknown (generic native chain): every native tag is
	// possible — only browser/desktop tags are foreign.
	native: new Set(['ios', 'android', 'mobile', 'windows']),
}

function platformTag(id) {
	const file = id.split(/[?#]/, 1)[0]
	const m = PLATFORM_TAG.exec(file)
	return m?.[1]
}

/** Build-time enforcement of the platform-suffix boundary (invariant #1) —
 *  the lint rules catch direct imports, this catches transitive leakage:
 *  a `foo.web.tsrx` module reachable in a mobile bundle means the resolver
 *  picked a browser leaf into a native graph. Fails `vite build` with the
 *  import chain; warns once per module in dev.
 *
 *  `platform` names the bundle target — 'web' | 'ios' | 'android' |
 *  'macos' | 'windows' | 'linux' | 'native' (generic: any native tag ok). */
export function xplatBoundary(platform = 'native') {
	const allowed = boundaryAllowed[platform] ?? boundaryAllowed.native
	let command = 'build'
	let root = ''
	const warned = new Set()
	const foreign = new Set()

	const chainFor = (getModuleInfo, id) => {
		const chain = []
		let cur = id
		const seen = new Set()

		while (cur && !seen.has(cur)) {
			seen.add(cur)
			const info = getModuleInfo(cur)
			const importers = [...(info?.importers ?? []), ...(info?.dynamicImporters ?? [])]
			const next = importers[0]
			if (!next) {
				break
			}

			chain.push(next)
			cur = next
		}

		return chain
	}

	return {
		name: 'xplat-platform-boundary',
		configResolved(config) {
			command = config.command
			root = config.root
		},
		moduleParsed(info) {
			const tag = platformTag(info.id)
			if (!tag || allowed.has(tag)) {
				return
			}

			if (command === 'serve') {
				if (!warned.has(info.id)) {
					warned.add(info.id)

					const infoOf =
						typeof this.getModuleInfo === 'function'
							? (i) => this.getModuleInfo(i)
							: () => undefined

					this.warn(
						`xplat boundary — .${tag} module in a ${platform} graph: ` +
							`${relative(root, info.id)} (importers: ${
								chainFor(infoOf, info.id)
									.map((i) => relative(root, i))
									.join(' → ') || 'unknown'
							})`,
					)
				}

				return
			}

			foreign.add(info.id)
		},
		buildEnd() {
			for (const id of foreign) {
				const tag = platformTag(id)

				const infoOf =
					typeof this.getModuleInfo === 'function' ? (i) => this.getModuleInfo(i) : () => undefined

				const chain = chainFor(infoOf, id)
				this.error(
					`xplat boundary — a .${tag} module is reachable in the ${platform} bundle:\n` +
						`  foreign: ${relative(root, id)}\n` +
						`  chain:   ${[...chain.reverse(), id].map((i) => relative(root, i)).join(' → ') || relative(root, id)}\n` +
						`  Platform-suffixed leaves resolve per-target; a foreign tag here means a\n` +
						`  shared module imported a platform file directly — split it behind the\n` +
						`  suffix seam (a .${tag} import must sit in a .${tag} importer's subtree).`,
				)
			}
		},
	}
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

/** `define` for the `process.env.NODE_ENV` npm convention — upstream octane
 *  packages (and much of the ecosystem) read it bare and assume the consumer
 *  bundler statically rewrites the member expression. The NativeScript
 *  runtime has no `process` global, so an unrewritten read throws at module
 *  eval; vite's define substitution is what makes the convention work.
 *
 *  Scope: only the literal `process.env.NODE_ENV` expression is rewritten —
 *  `process.env.FOO`, `process.platform`, and whole-object `process` reads
 *  still crash on native. The NS dev server's per-module `globalThis.process`
 *  shim picks the value up too (it captures `process.env.*` define entries
 *  from the resolved config). */
export const xplatNodeEnvDefine = (mode) => ({
	'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
})

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
	const appRequire = createRequire(join(process.cwd(), 'package.json'))
	const octaneRequire = createRequire(realpathSync(appRequire.resolve('octane')))
	// Signals belong to octane, not the app's direct dependency graph.
	// Resolve them from their owner under pnpm's isolated linker.
	const signalAliases = ['alien-signals', 'alien-signals/system'].map((specifier) => ({
		find: new RegExp(`^${specifier}$`),
		// require.resolve selects CJS; use the package's explicit ESM exports.
		replacement: realpathSync(
			octaneRequire.resolve(specifier.replace('alien-signals', 'alien-signals/esm')),
		),
	}))

	const [{ mergeConfig }, { octaneConfig }, { nativeScriptRenderer }] = await Promise.all([
		importApp('vite'),
		importApp('@nativescript-community/vite-octane'),
		importApp('@nativescript-community/octane/config'),
	])

	const config = mergeConfig(
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
			// DEBUG mirrors the ns base config's own NODE_ENV choice
			// (debug = !!process.env.DEBUG || isDevMode) so this define can never
			// disagree with its replace()/optimizeDeps substitutions on the
			// same key.
			define: xplatNodeEnvDefine(process.env.DEBUG ? 'development' : mode),
			oxc: {
				// NativeScript modules use TypeScript's legacy decorators. Oxc's
				// default emits decorator syntax the native JS runtime cannot parse.
				decorator: { legacy: true },
			},
			plugins: [pxToDip(), nsHmrClientWatchdog(), xplatBoundary(nativePlatform() ?? 'native')],
			build: {
				rolldownOptions: {
					// Dev/HMR universal emit retains JSX in expression props
					// (e.g. `renderItem={(item) => <gridlayout>…}`) for the file's
					// own @jsxImportSource pragma to lower. Rolldown only parses
					// JSX in script-lang modules, so mark .tsrx transform
					// output tsx.
					moduleTypes: { '.tsrx': 'tsx' },
					output: {
						// Sources deliberately kept out of a graph (boundary-severed
						// leaves, build-side loader code) must not ride along inside
						// the map either — positions stay, sources don't embed.
						sourcemapExcludeSources: true,
					},
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
				// alien-signals is ESM. Serve it directly: NativeScript decodes
				// flattened optimizer names back into package specifiers, which
				// cannot represent Vite's generated Rolldown helper chunks.
				// Flattened optimizeDeps chunks get mangled by the /ns/m device
				// transform (`import import "/ns/core/utils"`) and miss the vendor
				// manifest — serve @nativescript plugins per-module instead.
				exclude: [
					'alien-signals',
					'alien-signals/system',
					...collectNsPluginDeps(process.cwd()),
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
				alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }, ...signalAliases],
				// ns-vite sets preserveSymlinks:true; under pnpm's isolated layout
				// that resolves a dep's imports from the symlink path instead of
				// its real .pnpm dir, so declared transitive deps can't be found.
				preserveSymlinks: false,
				extensions: nativePlatformExtensions(),
			},
		},
	)

	return mergeConfig(config, opts.extra ?? {})
}
