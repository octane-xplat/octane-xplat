// Explicit project-toolchain operations. No CLI selection or orchestration.
import { readFileSync, writeFileSync, statSync, realpathSync, existsSync } from 'node:fs'
import { resolve, join, relative, dirname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { Console } from 'node:console'
import { routeSourceMetadata } from './route-source.ts'
import { assertRouteDataJson } from './route-data.ts'

const protocol = 'octane-build-worker'
const version = 1
function projectViteEntry(): string {
	let current = process.cwd()
	for (;;) {
		const packageRoot = join(current, 'node_modules/vite')
		if (existsSync(join(packageRoot, 'package.json'))) {
			const require = createRequire(join(current, 'package.json'))
			const entry = realpathSync(require.resolve('vite'))
			if (!entry.startsWith(realpathSync(packageRoot) + sep)) throw new Error('Vite must resolve from the selected project')
			return entry
		}
		const parent = dirname(current)
		if (parent === current) throw new Error('Install vite in the selected project (for example: bun add --dev vite).')
		current = parent
	}
}
const [, , requestFile, resultFile] = process.argv
if (!requestFile || !resultFile) throw new Error('Usage: node build-worker.js REQUEST.json RESULT.json')
// Libraries/loaders may log. Results travel separately from diagnostics.
globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })
let id: unknown = null
let file: string | undefined
try {
	if (statSync(requestFile).size > 64 * 1024 * 1024) throw new Error('Worker request exceeds 64 MiB')
	const request = JSON.parse(readFileSync(requestFile, 'utf8'))
	id = request.id
	if (request.protocol !== protocol || request.version !== version || typeof id !== 'string') {
		throw new Error('Unsupported build worker protocol')
	}
	if (typeof request.project !== 'string' || realpathSync(request.project) !== realpathSync(process.cwd())) {
		throw new Error('Worker project must match the selected working directory')
	}
	let data: unknown
	if (request.operation === 'route-analyze') {
		if (!Array.isArray(request.files)) throw new Error('route-analyze requires files')
		data = request.files.map((entry: { file: string; source: string }) => {
			if (typeof entry.file !== 'string' || typeof entry.source !== 'string') throw new Error('Expected route source strings')
			file = entry.file
			return { file, sha256: createHash('sha256').update(entry.source).digest('hex'), metadata: routeSourceMetadata(entry.source, file) }
		})
	} else if (request.operation === 'route-bake') {
		if (!Array.isArray(request.loaders) || !Array.isArray(request.markdown)) throw new Error('route-bake requires loaders and markdown arrays')
		const { mdToDoc } = await import('./markdown.ts')
		const result: Record<string, unknown> = Object.create(null)
		for (const entry of request.markdown) {
			if (typeof entry.name !== 'string' || typeof entry.file !== 'string' || typeof entry.source !== 'string') throw new Error('Expected Markdown source strings')
			file = entry.file
			const value = mdToDoc(entry.source)
			assertRouteDataJson(value, entry.name, entry.file)
			result[entry.name] = value
		}
		if (request.loaders.length) {
			const vite = await import(pathToFileURL(projectViteEntry()).href)
			const server = await vite.createServer({ root: process.cwd(), configFile: false, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' })
			try {
				for (const entry of request.loaders) {
					if (typeof entry.name !== 'string' || typeof entry.file !== 'string') throw new Error('Expected loader references')
					file = entry.file
					const module = await server.ssrLoadModule(resolve(process.cwd(), entry.file))
					const loader = module?.loader ?? module?.default
					if (typeof loader !== 'function') throw new Error(`baked route '${entry.name}' — ${relative(process.cwd(), resolve(entry.file))} must export a 'loader' function`)
					const value = await loader({})
					assertRouteDataJson(value, entry.name, entry.file)
					result[entry.name] = value
				}
			} finally { await server.close() }
		}
		data = result
	} else throw new Error(`Unsupported build operation: ${String(request.operation)}`)
	writeFileSync(resultFile, JSON.stringify({ protocol, version, id, ok: true, data }))
} catch (error) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`${file ? `${file}: ` : ''}${message}`)
	writeFileSync(resultFile, JSON.stringify({ protocol, version, id, ok: false, error: { code: 'build-operation-failed', message, file } }))
	process.exitCode = 1
}
