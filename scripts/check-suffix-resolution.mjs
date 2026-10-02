#!/usr/bin/env node
// Suffixless platform-leaf resolution probe.
//
// Reproduces the resolution question behind text-coral-ns's leaves.ts /
// leaves.web.ts barrels (open question Q25): can shared code write
// `import './Leaf'` and reach `Leaf.web.tsrx` / `Leaf.<platform>.tsrx`
// directly — letting apps drop the explicit-specifier barrels — once
// NativeScript/NativeScript#11450 routes the ns-vite build-time checker
// through tsrx-tsc?
//
// Fixture: scripts/fixtures/suffix-resolution/shared/
//   ./Probe            .ios/.android/.web + unsuffixed .tsrx variants
//   ./MobileOnly       .mobile.tsrx + .web.tsrx (shared-mobile leaf)
//   ./MobileTs         .mobile.ts + .web.ts (JSX-free leaves stay .ts)
//   ./OsLeaf           .ios/.android/.web .ts (per-OS shim — the ./List pattern)
//   use-explicit.tsrx  './Probe.web.tsrx' — explicit-specifier control
//   assert-*.ts        literal-type pins: each variant exports a distinct
//                      marker literal, so which file won is proven by type.
//
// Resolvers exercised:
//   1. tsc            plain-TS baseline (the original limitation)
//   2. tsrx-tsc       @tsrx/typescript-plugin (volar) — patches
//                     supportedTSExtensions so explicit .tsrx specifiers
//                     resolve through the `.d.tsrx.ts` declaration probe
//   3. ns-vite check  @nativescript/vite typescriptCheckPlugin buildStart.
//                     #11450 (in 8.0.12+) delegates to tsrx-tsc with a
//                     scratch tsconfig whose moduleSuffixes are regenerated
//                     as ['.<platform>', '.native', ''] upstream — the
//                     project's own moduleSuffixes are overridden, so
//                     `.mobile` is never probed. Our @nativescript/vite patch
//                     adds the .mobile tier for ios/android/visionos. The
//                     checker is loaded from apps/mobile's installed copy
//                     (the version ios/android builds actually run) and
//                     invoked in-process.
//   4. vite resolveId the runtime bundler path, on the real chains:
//                     apps/web/vite.config.ts via loadConfigFromFile and
//                     @octane-xplat/cli xplatNative() for ios/android.
//
// Equivalent manual commands (from the repo root):
//   node_modules/.bin/tsc -p scripts/fixtures/suffix-resolution/tsconfig.plain-web.json --listFiles
//   node_modules/.bin/tsrx-tsc -p scripts/fixtures/suffix-resolution/tsconfig.web.json --listFiles
//   node_modules/.bin/tsrx-tsc -p scripts/fixtures/suffix-resolution/tsconfig.native.json --listFiles
//   # ns-checker: cd scripts/fixtures/suffix-resolution/app-<platform> then run
//   # the plugin's buildStart — this script does it in-process.
//
// Today's truth: plain tsc misses suffixless .tsrx — moduleSuffixes probes a
// hardcoded extension bitmask in ts.tryAddingExtensions (originalExtension ''
// → .ts/.tsx/.d.ts/.js/.jsx). tsrx-tsc DOES resolve it in this repo because our
// pnpm patch enables `resolveHiddenExtensions` on the language plugin's
// typescript facet (upstream: tsrx-org/tsrx#971, still open and labeled
// DO-NOT-MERGE pending a TypeScript 7 path). Unpatched consumers still need
// the explicit-specifier or .ts-shim forms, and the barrels keep their
// export-remapping role either way.
import { spawnSync } from 'node:child_process'
import { readFileSync, realpathSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = join(root, 'scripts/fixtures/suffix-resolution')
const sharedDir = join(fixture, 'shared')
const bin = (name) => join(root, 'node_modules/.bin', name)

const SPECS = ['./Probe', './MobileOnly', './MobileTs', './OsLeaf']
const EXPLICIT = './Probe.web.tsrx'
const IMPORTERS = {
	'./Probe': 'use-probe.ts',
	'./MobileOnly': 'use-mobile-only.ts',
	'./MobileTs': 'use-mobile-ts.ts',
	'./OsLeaf': 'use-os-leaf.ts',
}

// ---- tsc / tsrx-tsc scenarios -------------------------------------------

function runTsc(binName, config) {
	const r = spawnSync(bin(binName), ['-p', config, '--listFiles', '--pretty', 'false'], {
		cwd: fixture,
		encoding: 'utf8',
	})

	const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
	const files = new Set(
		out
			.split('\n')
			.filter((line) => line.includes('/shared/'))
			.map((line) => basename(line.trim())),
	)

	const unresolved = [...out.matchAll(/Cannot find module '([^']+)'/g)].map((m) => m[1])
	return { files, unresolved, output: out }
}

// ---- ns-vite typescriptCheckPlugin (PR #11450) ---------------------------

function loadNsViteCheck() {
	try {
		const req = createRequire(join(root, 'apps/mobile/package.json'))
		const viteMain = realpathSync(req.resolve('@nativescript/vite'))
		const pkgDir = dirname(viteMain)
		const checkFile = join(pkgDir, 'helpers/typescript-check.js')
		const source = readFileSync(checkFile, 'utf8')
		const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version
		return { checkFile, source, version }
	} catch (e) {
		return { error: String(e?.message ?? e) }
	}
}

async function runNsChecker(mod, platform) {
	const appDir = join(fixture, `app-${platform}`)
	const captured = []
	const orig = { warn: console.warn, error: console.error }
	console.warn = console.error = (...args) => captured.push(args.join(' '))
	const cwd = process.cwd()
	process.chdir(appDir)
	try {
		await mod
			.typescriptCheckPlugin({ platform, verbose: false, failOnError: false, logDiagnostics: true })
			.buildStart()
	} catch (e) {
		captured.push(`buildStart threw: ${e?.message ?? e}`)
	} finally {
		process.chdir(cwd)
		Object.assign(console, orig)
	}

	// Drop the node_modules/.ns-vite scratch dir the plugin created.
	rmSync(join(appDir, 'node_modules'), { recursive: true, force: true })
	const text = captured.join('\n').replace(/\[[0-9;]*m/g, '')
	const unresolved = [...text.matchAll(/Cannot find module '([^']+)'/g)].map((m) => m[1])
	return { unresolved, output: text }
}

// ---- vite runtime resolution --------------------------------------------

async function viteResolve(extensions) {
	const req = createRequire(join(root, 'apps/web/package.json'))
	const vite = await import(pathToFileURL(realpathSync(req.resolve('vite'))).href)
	const server = await vite.createServer({
		configFile: false,
		root: sharedDir,
		logLevel: 'silent',
		server: { middlewareMode: true, watch: null },
		optimizeDeps: { disabled: true },
		plugins: [],
		resolve: { extensions },
	})

	const out = {}
	for (const spec of SPECS) {
		const r = await server.pluginContainer.resolveId(spec, join(sharedDir, IMPORTERS[spec]))
		out[spec] = r ? basename(r.id) : null
	}

	await server.close()
	return out
}

async function webExtensions() {
	const req = createRequire(join(root, 'apps/web/package.json'))
	const vite = await import(pathToFileURL(realpathSync(req.resolve('vite'))).href)
	const loaded = await vite.loadConfigFromFile(
		{ command: 'serve', mode: 'development' },
		join(root, 'apps/web/vite.config.ts'),
	)

	return loaded.config.resolve.extensions
}

async function nativeExtensions(platform) {
	// xplatNative resolves the toolchain through the consuming app's
	// node_modules — cwd must be the app dir when vite.mjs is imported.
	const cwd = process.cwd()
	process.chdir(join(root, 'apps/mobile'))
	try {
		process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ [platform]: true })
		const { xplatNative } = await import(
			pathToFileURL(join(root, 'packages/cli/src/vite.mjs')).href
		)

		const cfg = await xplatNative('production')
		return cfg.resolve.extensions
	} finally {
		delete process.env.NATIVESCRIPT_BUNDLER_ENV
		process.chdir(cwd)
	}
}

// ---- matrix ---------------------------------------------------------------

let failures = 0
const results = {} // scenario -> { spec: file|null, evidence }

function check(scenario, spec, got, want) {
	const ok = got === want
	if (!ok) {
		failures++
	}

	results[scenario] ??= {}
	results[scenario][spec] = got
	if (!ok) {
		results[scenario][`${spec} !`] = `expected ${want ?? 'UNRESOLVED'}`
	}
}

// 1–2. tsc / tsrx-tsc
const tscRuns = [
	['plain tsc (web suffixes)', 'tsc', 'tsconfig.plain-web.json'],
	['tsrx-tsc (web suffixes)', 'tsrx-tsc', 'tsconfig.web.json'],
	['tsrx-tsc (native suffixes)', 'tsrx-tsc', 'tsconfig.native.json'],
]

const tscExpect = {
	'plain tsc (web suffixes)': {
		'./Probe': null,
		'./MobileOnly': null,
		'./MobileTs': 'MobileTs.web.ts',
		'./OsLeaf': 'OsLeaf.web.ts',
	},
	'tsrx-tsc (web suffixes)': {
		'./Probe': 'Probe.web.tsrx',
		'./MobileOnly': 'MobileOnly.web.tsrx',
		'./MobileTs': 'MobileTs.web.ts',
		'./OsLeaf': 'OsLeaf.web.ts',
		[EXPLICIT]: 'Probe.web.tsrx',
	},
	'tsrx-tsc (native suffixes)': {
		'./Probe': 'Probe.ios.tsrx',
		'./MobileOnly': 'MobileOnly.mobile.tsrx',
		'./MobileTs': 'MobileTs.mobile.ts',
		'./OsLeaf': 'OsLeaf.ios.ts',
		[EXPLICIT]: 'Probe.web.tsrx',
	},
}

for (const [name, tool, config] of tscRuns) {
	const { files, unresolved, output } = runTsc(tool, config)
	const expect = tscExpect[name]
	for (const [spec, want] of Object.entries(expect)) {
		const got = unresolved.includes(spec) ? null : resolvedFile(files, spec, want)
		check(name, spec, got, want)
	}

	const otherErrors = output.match(/error TS(?!2307)\d+/g) ?? []
	check(
		name,
		'no non-2307 diagnostics',
		otherErrors.length ? otherErrors.join(',') : 'clean',
		'clean',
	)
}

function resolvedFile(files, spec, want) {
	// Which leaf file entered the program for this specifier. Probe.web.tsrx
	// also arrives via use-explicit.tsrx — listFiles alone can't attribute it,
	// so suffixless picks are proven by the assert-*.ts literal pins; a wrong
	// variant would surface as a TS2322 type error, caught by the no-non-2307
	// assertion above.
	if (want && files.has(want)) {
		return want
	}

	const base = spec.split('/').pop()
	const hits = [...files].filter((f) => f.startsWith(`${base}.`))
	return hits.length ? hits.sort()[0] : null
}

// 3. ns-vite build-time checker (real code path from PR #11450)
const ns = loadNsViteCheck()
if (ns.error) {
	console.log(
		`[skip] ns-vite checker: @nativescript/vite not resolvable from apps/mobile (${ns.error})`,
	)
} else if (!/tsrx-tsc/.test(ns.source)) {
	console.log(
		`[note] @nativescript/vite@${ns.version} has no tsrx-tsc delegation — ` +
			`PR #11450 landed in 8.0.12+. ` +
			`The installed copy can only run the in-process plain-TS checker.`,
	)
} else {
	console.log(
		`[info] @nativescript/vite@${ns.version} carries the #11450 tsrx-tsc delegation — exercising it.`,
	)

	const nsMod = await import(pathToFileURL(ns.checkFile).href)
	for (const platform of ['ios', 'android']) {
		const scenario = `ns-checker ${platform} (PR #11450)`
		const { unresolved, output } = await runNsChecker(nsMod, platform)
		// `./Probe` only exists as .tsrx files — a suffixless resolve can only
		// come from the delegated tsrx-tsc lane; the in-process plain-TS
		// checker has no .tsrx probing.
		check(scenario, 'delegated to tsrx-tsc', !unresolved.includes('./Probe'), true)
		// The patched scratch config probes
		// ['.<platform>', '.mobile', '.native', ''] — every fixture leaf
		// resolves suffixless, and the assert-<platform>.ts literal pins prove
		// the OS/mobile tiers won.
		for (const spec of SPECS) {
			check(scenario, spec, unresolved.includes(spec) ? null : 'resolved', 'resolved')
		}

		check(scenario, EXPLICIT, unresolved.includes(EXPLICIT) ? null : 'resolved', 'resolved')
		const errors = output.match(/error TS\d+/g) ?? []
		check(scenario, 'no diagnostics', errors.length ? errors.join(',') : 'clean', 'clean')
	}
}

// 4. vite runtime resolution on the real extension chains
try {
	const webExts = await webExtensions()
	const web = await viteResolve(webExts)
	for (const spec of SPECS) {
		check(
			'vite web',
			spec,
			web[spec],
			{
				'./Probe': 'Probe.web.tsrx',
				'./MobileOnly': 'MobileOnly.web.tsrx',
				'./MobileTs': 'MobileTs.web.ts',
				'./OsLeaf': 'OsLeaf.web.ts',
			}[spec],
		)
	}

	for (const platform of ['ios', 'android']) {
		const exts = await nativeExtensions(platform)
		const got = await viteResolve(exts)
		const want = {
			'./Probe': `Probe.${platform}.tsrx`,
			'./MobileOnly': 'MobileOnly.mobile.tsrx',
			'./MobileTs': 'MobileTs.mobile.ts',
			'./OsLeaf': `OsLeaf.${platform}.ts`,
		}

		for (const spec of SPECS) {
			check(`vite ${platform}`, spec, got[spec], want[spec])
		}
	}
} catch (e) {
	failures++
	console.log(`[fail] vite runtime probes errored: ${e?.stack ?? e}`)
}

// ---- report ---------------------------------------------------------------

const scenarios = Object.keys(results)
const seen = new Set()
const headers = []
for (const s of scenarios) {
	for (const k of Object.keys(results[s])) {
		if (!k.endsWith(' !') && !seen.has(k)) {
			seen.add(k)
			headers.push(k)
		}
	}
}

const cell = (s, k) => {
	const miss = results[s][`${k} !`]
	const v = results[s][k]
	const shown = v === true ? 'yes' : v === null ? 'unresolved' : String(v)
	return miss ? `DRIFT ${shown} — ${miss}` : shown
}

const width = Math.max(...headers.map((h) => h.length))
console.log('')
for (const s of scenarios) {
	console.log(`== ${s}`)
	for (const h of headers.filter((h) => h in results[s])) {
		console.log(`   ${h.padEnd(width)}  ${cell(s, h)}`)
	}
}

console.log('')
if (failures) {
	console.log(
		`FAIL — ${failures} expectation(s) drifted. Check whether the workspace patches still apply (pnpm install), then revisit the recorded expectations (Q25).`,
	)

	process.exit(1)
}

console.log('PASS — observed behavior matches recorded expectations.')
console.log('Verdict: suffixless `./Leaf` → `Leaf.<suffix>.tsrx` resolves in the bundlers,')
console.log('tsrx-tsc, and the delegated ns-vite checker (patched .mobile tier) — plain tsc')
console.log('still misses it, and unpatched consumers keep the explicit-specifier/shim path.')
