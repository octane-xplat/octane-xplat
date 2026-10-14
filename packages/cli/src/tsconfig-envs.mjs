// Shared TypeScript environment presets + tsconfig.envs.json expansion.
//
// Every platform is intended to expose the same API surface at the type
// level, so a package declares its checked surface once in tsconfig.envs.json
// and this module synthesizes ONE program covering all of it. The program
// lists every platform module suffix in a fixed precedence order
// (extensionless first) so imports bind the unsuffixed default while each
// variant file is checked as a program root under that same resolution.
// Per-file @jsxImportSource pragmas select the renderer; the program default
// is `octane`, which is what shared and .web/.linux sources already use.
//
// TYPECHECK_ENVIRONMENTS keeps the per-platform resolution settings for
// *consumers* of a packed package (tests/packed-consumer.mjs) — a real
// consumer app still typechecks one platform's selection.
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

export const ENV_MANIFEST = 'tsconfig.envs.json'

/**
 * The one platform-suffix precedence order for repository typecheck and
 * typegen programs: extensionless first, then every platform suffix. Imports
 * bind the unsuffixed default; variant files still enter the program as
 * roots so each is checked against the shared contract.
 */
export const PLATFORM_MODULE_SUFFIXES = [
	'',
	'.web',
	'.ios',
	'.android',
	'.mobile',
	'.native',
	'.macos',
	'.linux',
	'.windows',
]

/**
 * Options one program needs to compile sources for a target. `ambient` lists
 * narrow host-global declaration files (relative to this module) injected
 * into every program for that environment — JS-engine globals the runtime
 * provides but upstream types do not declare.
 *
 * These per-platform resolution settings drive consumer-side checks (a packed
 * package typechecked the way a single-platform app would). The envs-manifest
 * expansion uses only `lib` and `ambient` from them — merged across the
 * declared environments — because a manifest expands to one shared program,
 * not one per platform. `customConditions` is deliberately absent from the
 * combined program: every package's exports fall back to `types`/`default`,
 * the unsuffixed surface, which is the package-boundary analog of the
 * extensionless-first suffix order.
 */
export const TYPECHECK_ENVIRONMENTS = {
	web: {
		compilerOptions: {
			jsxImportSource: 'octane',
			moduleSuffixes: ['.web', ''],
			customConditions: ['web'],
			lib: ['ESNext', 'DOM', 'DOM.Iterable'],
		},
	},
	native: {
		compilerOptions: {
			jsxImportSource: '@nativescript-community/octane',
			moduleSuffixes: ['.ios', '.android', '.mobile', ''],
			customConditions: ['native'],
			lib: ['ESNext'],
		},
		ambient: ['typecheck-globals/native.d.ts'],
	},
	macos: {
		compilerOptions: {
			jsxImportSource: '@octane-xplat/macos-renderer',
			moduleSuffixes: ['.macos', ''],
			customConditions: ['macos'],
			lib: ['ESNext'],
		},
		// The renderer's AppKit ambient declares the NS* globals every .macos
		// source leans on. It must precede any @nativescript/types copy in the
		// program (duplicate global classes are first-wins) — ambient files are
		// emitted ahead of all env files for that reason.
		ambient: ['typecheck-globals/macos.d.ts', '../../macos-renderer/src/host-globals.d.ts'],
	},
	linux: {
		compilerOptions: {
			jsxImportSource: 'octane',
			moduleSuffixes: ['.linux', '.web', ''],
			customConditions: ['linux', 'web'],
			lib: ['ESNext', 'DOM', 'DOM.Iterable'],
		},
	},
	windows: {
		compilerOptions: {
			jsxImportSource: '@nativescript-community/octane',
			moduleSuffixes: ['.windows', '.native', ''],
			customConditions: ['native'],
			lib: ['ESNext'],
		},
	},
}

/** Which environment a platform file suffix belongs to. */
const SUFFIX_ENV = {
	web: 'web',
	ios: 'native',
	android: 'native',
	mobile: 'native',
	native: 'native',
	macos: 'macos',
	windows: 'windows',
	linux: 'linux',
}

/** Strip // and block comments plus trailing commas so authored tsconfig-style files parse. */
function parseJsonc(text, path) {
	let out = ''
	let i = 0
	let inString = false
	while (i < text.length) {
		const ch = text[i]
		if (inString) {
			out += ch
			if (ch === '\\') {
				out += text[++i] ?? ''
			} else if (ch === '"') {
				inString = false
			}

			i++
			continue
		}

		if (ch === '"') {
			inString = true
			out += ch
			i++
			continue
		}

		if (ch === '/' && text[i + 1] === '/') {
			while (i < text.length && text[i] !== '\n') {
				i++
			}

			continue
		}

		if (ch === '/' && text[i + 1] === '*') {
			const end = text.indexOf('*/', i + 2)
			if (end === -1) {
				throw new Error(`${path}: unterminated block comment`)
			}

			i = end + 2
			continue
		}

		out += ch
		i++
	}

	out = out.replace(/,(\s*[}\]])/g, '$1')
	try {
		return JSON.parse(out)
	} catch (e) {
		throw new Error(`${path}: invalid JSON — ${e.message}`)
	}
}

export function loadEnvManifest(dir) {
	const path = join(dir, ENV_MANIFEST)
	if (!existsSync(path)) {
		return null
	}

	const manifest = parseJsonc(readFileSync(path, 'utf8'), path)
	if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
		throw new Error(`${path}: expected a JSON object`)
	}

	const envs = manifest.environments
	if (!envs || typeof envs !== 'object' || Array.isArray(envs) || !Object.keys(envs).length) {
		throw new Error(`${path}: expected a non-empty "environments" object`)
	}

	return { path, manifest }
}

// Extensions tsc accepts in `files`/`include` — glob results are filtered the
// same way include patterns are (styles, assets and other non-source files
// never enter the program).
const SOURCE_EXT = /\.(?:ts|tsx|mts|cts|tsrx|js|jsx|mjs|cjs)$/

function expandGlobs(dir, patterns, label, { required = true, sourcesOnly = true } = {}) {
	const files = new Set()
	for (const pattern of patterns ?? []) {
		let matched
		try {
			matched = globSync(pattern, { cwd: dir })
		} catch (e) {
			throw new Error(`${label}: bad pattern "${pattern}" — ${e.message}`)
		}

		const keep = sourcesOnly ? matched.filter((rel) => SOURCE_EXT.test(rel)) : matched
		if (required && !keep.length) {
			throw new Error(`${label}: pattern "${pattern}" matched no source files`)
		}

		for (const rel of keep) {
			files.add(resolve(dir, rel))
		}
	}

	return files
}

/**
 * Resolve one environment entry to its concrete root files.
 * entry = { files?: [...], include?: [...], exclude?: [...] } — paths are
 * relative to the manifest directory; include/exclude are glob patterns.
 */
function resolveEnvFiles(dir, entry, label) {
	const files = expandGlobs(dir, entry.include, label)
	for (const file of entry.files ?? []) {
		const abs = resolve(dir, file)
		if (!existsSync(abs)) {
			throw new Error(`${label}: file "${file}" does not exist`)
		}

		files.add(abs)
	}

	const excluded = expandGlobs(dir, entry.exclude, label, {
		required: false,
		sourcesOnly: false,
	})

	for (const file of files) {
		for (const abs of excluded) {
			if (file === abs || file.startsWith(`${abs}/`)) {
				files.delete(file)
				break
			}
		}
	}

	if (!files.size) {
		throw new Error(`${label}: resolved no files — an empty program would pass vacuously`)
	}

	return [...files].sort()
}

/** Map a `src/index[.<suffix>].*` barrel to the environment that must claim it. */
function barrelEnv(rel) {
	const match = /^src\/index(?:\.([A-Za-z]+))?\.(?:ts|tsx|mts|cts)$/.exec(rel)
	if (!match) {
		return null
	}

	const suffix = match[1]
	if (!suffix) {
		return 'any' // unsuffixed default barrel — any environment may carry it
	}

	return SUFFIX_ENV[suffix] ?? null
}

const arraysEqual = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i])

/** Fixed-order union: known keys first in `order`, extras appended in insertion order. */
function orderedUnion(set, order) {
	return [...order.filter((v) => set.has(v)), ...[...set].filter((v) => !order.includes(v))]
}

const LIB_ORDER = ['ESNext', 'DOM', 'DOM.Iterable']

/**
 * Expand a tsconfig.envs.json manifest into the package's single combined
 * typecheck program. Returns [{ env: 'all', configPath, files }].
 *
 * Environments no longer select programs — each entry declares the slice of
 * the checked surface it claims (files/include/exclude, plus `types` for
 * host-global packages that slice needs). The generated program unions every
 * declared environment's files, merges lib/customConditions/types across
 * them, and compiles under PLATFORM_MODULE_SUFFIXES. Renderer selection is
 * per-file via @jsxImportSource pragmas; the program default is `octane`.
 * Everything else program-wide (paths, target, a different default
 * jsxImportSource) belongs in the manifest's top-level compilerOptions.
 */
export function expandEnvPrograms(dir, { path: manifestPath, manifest }) {
	const errors = []
	const resolved = {}
	const files = new Set()
	// Ambient host-globals come FIRST in the program: where ambient and
	// package-shipped declarations collide (the AppKit globals vs
	// @nativescript/types' ObjC classes) the earlier declaration wins, and
	// the ambient copy is the tolerant one.
	const ambient = new Set()
	const lib = new Set()
	const types = new Set()

	for (const [env, entry] of Object.entries(manifest.environments)) {
		const preset = TYPECHECK_ENVIRONMENTS[env]
		if (!preset) {
			errors.push(
				`${ENV_MANIFEST}: unknown environment "${env}" — expected one of: ${Object.keys(TYPECHECK_ENVIRONMENTS).join(', ')}`,
			)

			continue
		}

		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
			errors.push(`${ENV_MANIFEST}: environment "${env}" must be an object`)
			continue
		}

		for (const key of Object.keys(entry.compilerOptions ?? {})) {
			if (key === 'types') {
				continue
			}

			errors.push(
				`${ENV_MANIFEST}: environment "${env}" sets compilerOptions.${key}, but all environments share one program now — move it to the top-level compilerOptions (or a per-file pragma for jsxImportSource)`,
			)
		}

		const label = `${ENV_MANIFEST} environment "${env}"`
		const envFiles = resolveEnvFiles(dir, entry, label)
		resolved[env] = envFiles
		for (const file of envFiles) {
			files.add(file)
		}

		for (const rel of preset.ambient ?? []) {
			const abs = resolve(MODULE_DIR, rel)
			// Consumer installs won't have the repo-relative renderer source —
			// they get these globals through the package's types instead.
			if (existsSync(abs)) {
				ambient.add(abs)
			}
		}

		for (const value of preset.compilerOptions.lib ?? []) {
			lib.add(value)
		}

		for (const value of entry.compilerOptions?.types ?? []) {
			types.add(value)
		}
	}

	// Every platform barrel must be claimed by a declared environment so a
	// new index.<platform>.* can never ship without coverage.
	const barrels = globSync('src/index*.ts', { cwd: dir })
	for (const rel of barrels) {
		const env = barrelEnv(rel)
		if (!env) {
			continue
		}

		const abs = `/${rel}`
		if (env === 'any') {
			const claimed = Object.values(resolved).some((files) =>
				files.some((f) => f.endsWith(abs)),
			)

			if (!claimed) {
				errors.push(
					`${ENV_MANIFEST}: ${rel} is not checked by any declared environment`,
				)
			}

			continue
		}

		const claimed = resolved[env]?.some((f) => f.endsWith(abs))
		if (!claimed) {
			errors.push(
				`${ENV_MANIFEST}: ${rel} exists but is not claimed by the "${env}" environment`,
			)
		}
	}

	const top = manifest.compilerOptions ?? {}
	if (top.moduleSuffixes !== undefined && !arraysEqual(top.moduleSuffixes, PLATFORM_MODULE_SUFFIXES)) {
		errors.push(
			`${ENV_MANIFEST}: compilerOptions.moduleSuffixes is fixed — use the platform precedence order ${JSON.stringify(PLATFORM_MODULE_SUFFIXES)} or omit it (inherited)`,
		)
	}

	for (const value of top.lib ?? []) {
		lib.add(value)
	}

	for (const value of top.types ?? []) {
		types.add(value)
	}

	if (errors.length) {
		throw new Error(errors.join('\n'))
	}

	const compilerOptions = {
		jsxImportSource: 'octane',
		lib: orderedUnion(lib, LIB_ORDER),
		...top,
		moduleSuffixes: PLATFORM_MODULE_SUFFIXES,
	}

	if (types.size) {
		compilerOptions.types = [...types]
	}

	const allFiles = [...ambient, ...[...files].sort()]

	const program = {
		env: 'all',
		config: {
			extends: manifestPath,
			compilerOptions,
			files: allFiles,
			include: [],
			exclude: [],
		},
		files: allFiles,
	}

	const outDir = join(dir, 'node_modules', '.cache', 'xplat-typecheck')
	mkdirSync(outDir, { recursive: true })
	program.configPath = join(outDir, 'all.json')
	writeFileSync(program.configPath, JSON.stringify(program.config, null, '\t') + '\n')
	delete program.config

	return [program]
}
