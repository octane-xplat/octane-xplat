import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import picomatch from 'picomatch'

// A project config replaces this preset; existing configurations keep their
// own rule choices. Projects can extend the shipped config.json explicitly.
const DEFAULT_CONFIG = createRequire(import.meta.url)('../config.json')

type Config = {
	rules?: Record<string, unknown>
	extends?: string[]
	ignorePatterns?: string[]
	overrides?: { files: string[]; rules?: Record<string, unknown> }[]
}

export function readConfig(cwd: string) {
	const path = join(cwd, '.oxlintrc.json')
	if (!existsSync(path)) {
		for (const name of ['.oxlintrc.jsonc', 'oxlint.config.ts', 'oxlint.config.mts']) {
			if (existsSync(join(cwd, name))) {
				throw new Error(
					`use .oxlintrc.json (strict JSON) for the shared Oxlint/TSRX configuration; found ${name}`,
				)
			}
		}

		const plugin = fileURLToPath(
			new URL(
				import.meta.url.endsWith('.ts') ? './oxlint-plugin.ts' : './oxlint-plugin.js',
				import.meta.url,
			),
		)

		return {
			path: undefined as string | undefined,
			defaults: { ...DEFAULT_CONFIG, jsPlugins: [plugin] },
			ignorePatterns: DEFAULT_CONFIG.ignorePatterns as string[],
			rulesFor: (_file: string) => DEFAULT_CONFIG.rules as Record<string, unknown>,
		}
	}

	const layers: { config: Config; directory: string }[] = []
	const loading = new Set<string>()
	const load = (file: string) => {
		if (loading.has(file)) {
			throw new Error(`circular lint config extends: ${file}`)
		}
		loading.add(file)
		const config: Config = JSON.parse(readFileSync(file, 'utf8'))
		if (!config || typeof config !== 'object' || Array.isArray(config)) {
			throw new Error(`lint config must be an object: ${file}`)
		}
		for (const parent of config.extends ?? []) {
			const parentPath =
				parent.startsWith('.') || isAbsolute(parent)
					? resolve(dirname(file), parent)
					: createRequire(file).resolve(parent)

			load(parentPath)
		}
		layers.push({ config, directory: dirname(file) })
		loading.delete(file)
		return config
	}
	const root = load(path)
	const rules = Object.assign({}, ...layers.map(({ config }) => config.rules))
	return {
		path,
		defaults: undefined,
		// Oxlint uses the root's ignorePatterns rather than inheriting them.
		ignorePatterns: root.ignorePatterns ?? [],
		rulesFor(file: string): Record<string, unknown> {
			const selected = { ...rules }
			for (const { config, directory } of layers) {
				const rel = relative(directory, file).replaceAll('\\', '/')
				for (const override of config.overrides ?? []) {
					// Oxlint's globset includes dotfiles and lets a single star
					// cross path separators; Node's matchesGlob does neither.
					if (
						picomatch.isMatch(rel, override.files, {
							bash: true,
							dot: true,
							noext: true,
							nonegate: true,
						})
					) {
						Object.assign(selected, override.rules)
					}
				}
			}
			return selected
		},
	}
}

export function ruleConfig(entry: unknown) {
	if (entry === undefined) {
		return undefined
	}
	const [severity, options] = Array.isArray(entry) ? entry : [entry, undefined]
	if (severity === 'off' || severity === 'allow' || severity === 0) {
		return undefined
	}
	if (severity === 'warn' || severity === 1) {
		return { severity: 'warn', options }
	}
	if (severity === 'error' || severity === 'deny' || severity === 2) {
		return { severity: 'error', options }
	}
	throw new Error(`invalid lint severity: ${JSON.stringify(severity)}`)
}
