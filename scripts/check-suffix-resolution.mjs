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
//                     as ['.<platform>', '.native', ''] — the project's own
//                     moduleSuffixes are overridden, so `.mobile` is never
//                     probed. apps/mobile pins 8.0.16 (carries the delegation);
//                     the checker is loaded from apps/windows' pkg.pr.new
//                     preview and invoked in-process when installed.
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
// Today's truth: every TypeScript resolver misses suffixless .tsrx —
// moduleSuffixes probes a hardcoded extension bitmask in
// ts.tryAddingExtensions (originalExtension '' → .ts/.tsx/.d.ts/.js/.jsx),
// and volar's supportedTSExtensions patch is never consulted there.
// Bundlers resolve it via resolve.extensions. #11450 therefore does NOT
// retire the barrels. If upstream ever probes `.tsrx` for bare specifiers,
// expectations below fail loudly — revisit the barrels then.
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
		const req = createRequire(join(root, 'apps/windows/package.json'))
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
	return { unresolved, output: text, delegated: /tsrx-tsc/.test(text) }
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
		'./Probe': null,
		'./MobileOnly': null,
		'./MobileTs': 'MobileTs.web.ts',
		'./OsLeaf': 'OsLeaf.web.ts',
		[EXPLICIT]: 'Probe.web.tsrx',
	},
	'tsrx-tsc (native suffixes)': {
		'./Probe': null,
		'./MobileOnly': null,
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
		`[skip] ns-vite checker: @nativescript/vite not resolvable from apps/windows (${ns.error})`,
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
		const { unresolved, output, delegated } = await runNsChecker(nsMod, platform)
		check(scenario, 'delegated to tsrx-tsc', delegated ? true : null, true)
		// The generated scratch config overrides moduleSuffixes to
		// ['.<platform>', '.native', '']: OsLeaf.<platform>.ts resolves, while
		// the .mobile tier and every .tsrx leaf are invisible.
		for (const spec of ['./Probe', './MobileOnly', './MobileTs']) {
			check(scenario, spec, unresolved.includes(spec) ? null : 'resolved?', null)
		}

		check(
			scenario,
			'./OsLeaf',
			unresolved.includes('./OsLeaf') ? null : `OsLeaf.${platform}.ts`,
			`OsLeaf.${platform}.ts`,
		)

		check(scenario, EXPLICIT, unresolved.includes(EXPLICIT) ? null : 'resolved', 'resolved')
		const errors = output.match(/error TS\d+/g) ?? []
		check(
			scenario,
			'diagnostics are exactly the three TS2307s',
			errors.length === 3 ? 'clean' : errors.join(','),
			'clean',
		)
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
		`FAIL — ${failures} expectation(s) drifted. If .tsrx suffix probing landed upstream, revisit the leaves barrels (Q25).`,
	)

	process.exit(1)
}

console.log('PASS — observed behavior matches recorded expectations.')
console.log('Verdict: suffixless `./Leaf` → `Leaf.<suffix>.tsrx` resolves only in the bundlers;')
console.log('every tsc lane (plain, tsrx-tsc, and the #11450 ns-vite checker) still needs')
console.log('the explicit-specifier barrels — PR #11450 does not retire them.')
