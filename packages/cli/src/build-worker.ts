// Explicit project-toolchain operations. No CLI selection or orchestration.
import { readFileSync, writeFileSync, statSync, realpathSync, existsSync, lstatSync, readdirSync } from 'node:fs'
import { resolve, join, relative, dirname, sep, basename } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { Console } from 'node:console'
import { planRoutes } from './route-generator.ts'
import { routeSourceMetadata } from './route-source.ts'
import { assertRouteDataJson } from './route-data.ts'
import { srcUrl } from './env.ts'

const protocol = 'octane-build-worker'
const version = 1
function projectViteEntry(): string {
	let current = process.cwd()
	for (;;) {
		const packageRoot = join(current, 'node_modules/vite')
		if (existsSync(join(packageRoot, 'package.json'))) {
			const require = createRequire(join(current, 'package.json'))
			const entry = realpathSync(require.resolve('vite'))
			if (!entry.startsWith(realpathSync(packageRoot) + sep)) {throw new Error('Vite must resolve from the selected project')}
			return entry
		}
		const parent = dirname(current)
		if (parent === current) {throw new Error('Install vite in the selected project (for example: bun add --dev vite).')}
		current = parent
	}
}
const [, , requestFile, resultFile] = process.argv
if (!requestFile || !resultFile) {throw new Error('Usage: node build-worker.js REQUEST.json RESULT.json')}
// Libraries/loaders may log. Results travel separately from diagnostics.
globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })
let id: unknown = null
let file: string | undefined
const warnings: string[] = []
try {
	if (statSync(requestFile).size > 64 * 1024 * 1024) {throw new Error('Worker request exceeds 64 MiB')}
	const request = JSON.parse(readFileSync(requestFile, 'utf8'))
	id = request.id
	if (request.protocol !== protocol || request.version !== version || typeof id !== 'string') {
		throw new Error('Unsupported build worker protocol')
	}
	if (typeof request.project !== 'string' || realpathSync(request.project) !== realpathSync(process.cwd())) {
		throw new Error('Worker project must match the selected working directory')
	}
	let data: unknown
	if (request.operation === 'route-plan') {
		for (const key of ['directory', 'output']) {
			if (request[key] !== undefined && typeof request[key] !== 'string') {throw new Error(`Expected ${key} string`)}
		}
		if (typeof request.bake !== 'boolean') {throw new Error('Expected bake boolean')}
		const plan = await planRoutes(process.cwd(), request.directory, request.output, {
			bake: request.bake,
			onWarn: message => warnings.push(message),
			onSource: source => { file = source },
		})
		data = { version: 1, count: plan.count, outputs: [...plan.outputs].map(([file, source]) => ({ file, source })) }
	} else if (request.operation === 'linux-package') {
		if (!['darwin', 'linux'].includes(process.platform)) {
			throw new Error('Linux packaging requires a POSIX build host')
		}
		const stage = request.stagingRoot
		const release = join(process.cwd(), 'dist/linux')
		if (typeof stage !== 'string' || !lstatSync(stage).isDirectory() ||
			dirname(realpathSync(stage)) !== realpathSync(release) ||
			!basename(stage).startsWith('.xplat-linux-') || readdirSync(stage).length) {
			throw new Error('Expected an empty native-owned Linux staging directory')
		}
		const { packageLinux } = await import('./linux/package.ts')
		// Full CLI emit keeps payloads in src; curated workers keep this small
		// Linux host beside the emitted module. No host/runtime is embedded.
		const roots = [fileURLToPath(srcUrl(import.meta.url, 'linux/host/')),
			fileURLToPath(new URL('./linux/host/', import.meta.url))]
		const hostRoot = roots.find(root => existsSync(join(root, 'gjs-host.js')))
		if (!hostRoot) { throw new Error('Update the selected CLI: Linux host assets are missing') }
		data = await packageLinux(process.cwd(), { stagingRoot: stage, publish: false, hostRoot })
	} else if (request.operation === 'fmt-plan') {
		if (!Array.isArray(request.inputs) || !request.inputs.every((value: unknown) => typeof value === 'string')) {
			throw new Error('fmt-plan requires input paths')
		}
		if (request.stdin !== null && (!request.stdin || typeof request.stdin.path !== 'string' || typeof request.stdin.source !== 'string')) {
			throw new Error('fmt-plan requires null or text stdin')
		}
		const { planFormat } = await import('./fmt-plan.ts')
		data = await planFormat(process.cwd(), request.inputs, request.stdin, async () => {
			const localRequire = createRequire(join(process.cwd(), 'package.json'))
			let entry: string
			try {
				entry = localRequire.resolve('@octane-xplat/fmt')
			} catch {
				throw new Error('Install @octane-xplat/fmt in the selected project (bun add --dev @octane-xplat/fmt).')
			}
			const { createFormatter } = await import(pathToFileURL(entry).href)
			return createFormatter({ cwd: process.cwd() })
		})
	} else if (request.operation === 'typecheck-config') {
		// Program expansion is the compiler's existing Node/JSONC/glob contract.
		// Its disposable cache writes stay with that engine; CLI process ownership
		// and source/artifact publication do not move into this worker.
		const { loadEnvManifest, expandEnvPrograms } = await import('./tsconfig-envs.ts')
		const project = process.cwd()
		const configs = ['tsconfig.json']
			.filter((name) => existsSync(join(project, name)))
			.map((name) => join(project, name))

		const loaded = loadEnvManifest(project)
		if (loaded) {
			const required = ['native', 'macos'].filter((name) => loaded.manifest.environments[name])
			const roots = [
				fileURLToPath(srcUrl(import.meta.url, '')),
				fileURLToPath(new URL('.', import.meta.url)),
			]

			const ambientRoot = roots.find((root) =>
				required.every((name) => existsSync(join(root, 'typecheck-globals', name + '.d.ts'))),
			)

			if (!ambientRoot) {
				throw new Error(
					"Update the project's @octane-xplat/cli: required typecheck declarations are missing",
				)
			}

			configs.push(
				...expandEnvPrograms(project, loaded, { ambientRoot }).map((program) => program.configPath),
			)
		} else if (existsSync(join(project, 'tsconfig.native.json'))) {
			configs.push(join(project, 'tsconfig.native.json'))
		}

		data = { version: 1, configs }
	} else if (request.operation === 'route-analyze') {
		if (!Array.isArray(request.files)) {throw new Error('route-analyze requires files')}
		data = request.files.map((entry: { file: string; source: string }) => {
			if (typeof entry.file !== 'string' || typeof entry.source !== 'string') {throw new Error('Expected route source strings')}
			file = entry.file
			return { file, sha256: createHash('sha256').update(entry.source).digest('hex'), metadata: routeSourceMetadata(entry.source, file) }
		})
	} else if (request.operation === 'route-bake') {
		if (!Array.isArray(request.loaders) || !Array.isArray(request.markdown)) {throw new Error('route-bake requires loaders and markdown arrays')}
		const { mdToDoc } = await import('./markdown.ts')
		const result: Record<string, unknown> = Object.create(null)
		for (const entry of request.markdown) {
			if (typeof entry.name !== 'string' || typeof entry.file !== 'string' || typeof entry.source !== 'string') {throw new Error('Expected Markdown source strings')}
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
					if (typeof entry.name !== 'string' || typeof entry.file !== 'string') {throw new Error('Expected loader references')}
					file = entry.file
					const module = await server.ssrLoadModule(resolve(process.cwd(), entry.file))
					const loader = module?.loader ?? module?.default
					if (typeof loader !== 'function') {throw new Error(`baked route '${entry.name}' — ${relative(process.cwd(), resolve(entry.file))} must export a 'loader' function`)}
					const value = await loader({})
					assertRouteDataJson(value, entry.name, entry.file)
					result[entry.name] = value
				}
			} finally { await server.close() }
		}
		data = result
	} else if (request.operation === 'action-validate') {
		if (!['input', 'output'].includes(request.phase)) {throw new Error('Expected action validation phase')}
		// Action field contracts specify JavaScript RegExp/default semantics. Keep
		// one validator with the app/reference; this worker performs no invocation.
		const { validateActionDeclaration, validateActionInput, validateActionOutput } = await import('./mcp/contracts/actions.ts')
		const declaration = validateActionDeclaration(request.action)
		data = { declaration, checked: declaration.length ? null :
			(request.phase === 'input' ? validateActionInput(request.action.input, request.value) : validateActionOutput(request.action.result, request.value)) }
	} else {throw new Error(`Unsupported build operation: ${String(request.operation)}`)}
	writeFileSync(resultFile, JSON.stringify({ protocol, version, id, ok: true, data, warnings }))
} catch (error) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(`${file ? `${file}: ` : ''}${message}`)
	writeFileSync(resultFile, JSON.stringify({ protocol, version, id, ok: false, warnings, error: { code: 'build-operation-failed', message, file } }))
	process.exitCode = 1
}
