import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Declarative source reference. Discovery reads types/source, never executes it. */
export interface RouteExportReference {
	module: string
	export: string
}

/** Optional xplat.routes.json, shared by explicit and automatic route generation. */
export interface RoutingConfig {
	directory?: string
	out?: string
	manifests?: RouteExportReference[]
	context?: RouteExportReference
	transitions?: RouteExportReference
	stacks?: string[]
	base?: string
	allowedOrigins?: string[]
	allowedSchemes?: string[]
}

const object = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value)

/** Validate configuration before writing generated files. A missing file means
 * conventional file discovery; malformed configuration is never ignored. */
export function loadRoutingConfig(
	cwd: string,
	options: { allowMissingSources?: boolean } = {},
): RoutingConfig | undefined {
	const path = resolve(cwd, 'xplat.routes.json')
	if (!existsSync(path)) {
		return undefined
	}
	const fail = (field: string, expected: string): never => {
		throw new Error(`xplat.routes.json ${field}: expected ${expected}`)
	}
	const input: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!object(input)) {
		return fail('config', 'an object')
	}
	const fields = [
		'directory',
		'out',
		'manifests',
		'context',
		'transitions',
		'stacks',
		'base',
		'allowedOrigins',
		'allowedSchemes',
	]
	for (const field of Object.keys(input)) {
		if (!fields.includes(field)) {
			fail(field, `one of ${fields.join(', ')}`)
		}
	}
	for (const field of ['directory', 'out']) {
		if (input[field] !== undefined && (typeof input[field] !== 'string' || !input[field])) {
			fail(field, 'a nonempty path')
		}
	}
	const reference = (value: unknown, field: string) => {
		if (!object(value) || Object.keys(value).some((key) => !['module', 'export'].includes(key))) {
			return fail(field, '{ module: "./source", export: "exportName" }')
		}
		if (typeof value.module !== 'string' || !value.module.startsWith('./')) {
			fail(`${field}.module`, 'a source path starting with ./')
		}
		if (typeof value.export !== 'string' || !/^[$A-Z_a-z][$\w]*$/.test(value.export)) {
			fail(`${field}.export`, 'an exported identifier')
		}
		const source = resolve(cwd, value.module as string)
		if (
			!options.allowMissingSources &&
			!['', '.ts', '.tsx', '.tsrx', '.mts', '.js', '.mjs'].some((ext) => existsSync(source + ext))
		) {
			fail(`${field}.module`, `an existing source module (${value.module})`)
		}
	}
	if (input.manifests !== undefined) {
		if (!Array.isArray(input.manifests)) {
			fail('manifests', 'an array of source references')
		}

		;(input.manifests as unknown[]).forEach((value, i) => reference(value, `manifests[${i}]`))
	}
	for (const field of ['context', 'transitions']) {
		if (input[field] !== undefined) {
			reference(input[field], field)
		}
	}
	if (
		input.stacks !== undefined &&
		(!Array.isArray(input.stacks) ||
			input.stacks.some((value) => typeof value !== 'string' || !/^[\w-]+$/.test(value)))
	) {
		fail('stacks', 'an array of URL-safe flow names')
	}
	if (
		input.base !== undefined &&
		(typeof input.base !== 'string' ||
			!input.base.startsWith('/') ||
			input.base.startsWith('//') ||
			/[?#\\]/.test(input.base))
	) {
		fail('base', 'an application path beginning with /')
	}
	for (const field of ['allowedOrigins', 'allowedSchemes']) {
		if (
			input[field] !== undefined &&
			(!Array.isArray(input[field]) ||
				(input[field] as unknown[]).some((value) => typeof value !== 'string' || !value))
		) {
			fail(field, 'an array of nonempty strings')
		}
	}
	return input as RoutingConfig
}
