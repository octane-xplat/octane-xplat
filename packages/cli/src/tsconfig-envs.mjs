// Shared TypeScript environment presets + tsconfig.envs.json expansion.
//
// Every platform is intended to expose the same API surface at the type
// level, so a package declares its checked surface once in tsconfig.envs.json
// and this module synthesizes the per-environment programs. The options in
// TYPECHECK_ENVIRONMENTS are the program-wide half of platform runtime/build
// selection — moduleSuffixes, customConditions, jsxImportSource and lib must
// match the vite resolve chain for that target. They select which leaf files
// fill each specifier; they do not define a divergent type surface.
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

export const ENV_MANIFEST = 'tsconfig.envs.json'

/**
 * Options one program needs to compile sources for a target. `ambient` lists
 * narrow host-global declaration files (relative to this module) injected
 * into every program for that environment — JS-engine globals the runtime
 * provides but upstream types do not declare.
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
		ambient: ['typecheck-globals/macos.d.ts'],
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

/** Map a `src/index[.<suffix>].*` barrel to the environment that must check it. */
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

/**
 * Expand a tsconfig.envs.json manifest into concrete per-environment
 * programs. Returns [{ env, configPath, files }]; each config extends the
 * manifest (so package compilerOptions and paths keep their directory) and
 * overrides the environment options from the shared preset.
 */
export function expandEnvPrograms(dir, { path: manifestPath, manifest }) {
	const programs = []
	const resolved = {}
	const errors = []

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

		const label = `${ENV_MANIFEST} environment "${env}"`
		const files = resolveEnvFiles(dir, entry, label)
		resolved[env] = files
		for (const ambient of preset.ambient ?? []) {
			files.push(resolve(MODULE_DIR, ambient))
		}

		const config = {
			extends: manifestPath,
			compilerOptions: {
				...preset.compilerOptions,
				...entry.compilerOptions,
			},
			files,
			include: [],
			exclude: [],
		}

		programs.push({ env, config, files })
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
				`${ENV_MANIFEST}: ${rel} exists but is not checked by the "${env}" environment`,
			)
		}
	}

	if (errors.length) {
		throw new Error(errors.join('\n'))
	}

	const outDir = join(dir, 'node_modules', '.cache', 'xplat-typecheck')
	mkdirSync(outDir, { recursive: true })
	for (const program of programs) {
		program.configPath = join(outDir, `${program.env}.json`)
		writeFileSync(program.configPath, JSON.stringify(program.config, null, '\t') + '\n')
		delete program.config
	}

	return programs
}
