import process from 'node:process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { compileFunction } from 'node:vm'
import { ModuleKind, transpileModule } from 'typescript'

/** Evaluate the trusted app config as NativeScript does, with a fresh module per call. */
export async function readNativeConfig(root: string): Promise<Record<string, any>> {
	const override = process.env.NATIVESCRIPT_CONFIG_NAME
	const defaults = ['nativescript.config.ts', 'nativescript.config.js', 'nsconfig.json']
	const candidates =
		override === 'false'
			? ['nsconfig.json']
			: override
				? [
						override.endsWith('.ts') || override.endsWith('.js') || override.endsWith('.json')
							? override
							: override + '.ts',
						override + '.js',
						override + '.json',
						...defaults,
					]
				: defaults
	const file = candidates.map((name) => resolve(root, name)).find(existsSync)
	if (!file) {
		return {}
	}
	try {
		const modules = new Map<string, { exports: any }>()
		const quiet = { log() {}, info() {}, warn() {}, error() {}, debug() {} }
		function load(path: string): any {
			const previous = modules.get(path)
			if (previous) {
				return previous.exports
			}
			const module = { exports: {} as any }
			modules.set(path, module)
			const source = readFileSync(path, 'utf8')
			if (path.endsWith('.json')) {
				module.exports = JSON.parse(source)
			} else {
				const code = path.endsWith('.ts')
					? transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText
					: source
				const require = createRequire(path)
				const localRequire = Object.assign(
					(name: string) =>
						name.startsWith('.') || name.startsWith('/')
							? load(require.resolve(name))
							: require(name),
					{ resolve: require.resolve },
				)
				compileFunction(
					code,
					['exports', 'require', 'module', '__filename', '__dirname', 'console'],
					{ filename: path },
				)(module.exports, localRequire, module, path, dirname(path), quiet)
			}
			return module.exports
		}
		const exported = load(file)
		const value: unknown = exported.default ?? exported
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error()
		}
		return value as Record<string, any>
	} catch {
		throw new Error(
			'Cannot evaluate NativeScript configuration; supply a valid exported configuration object',
		)
	}
}
/** Stable, value-only config. Unserializable settings fail instead of silently disappearing. */
export function configValue(value: unknown, root: string, resources: string): unknown {
	if (value === undefined) {
		return null
	}
	if (value === null || typeof value === 'boolean' || typeof value === 'number') {
		if (typeof value === 'number' && !Number.isFinite(value)) {
			throw new Error('Native build settings must be finite JSON values')
		}
		return value
	}
	if (typeof value === 'string') {
		return value.replaceAll(resources, '<App_Resources>').replaceAll(root, '<project>')
	}
	if (Array.isArray(value)) {
		return value.map((item) => configValue(item, root, resources))
	}
	if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
		throw new Error('Native build settings must contain serializable values')
	}
	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => [key, configValue(item, root, resources)]),
	)
}
