import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { coreInputs, assertCurrentNativeBuild } from './native-inputs.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const compiler = resolve(repo, `research/nim-cli/core${process.platform === 'win32' ? '.exe' : ''}`)
const runRoot = join(repo, 'research/nim-cli', `${process.platform}-${process.arch}-${Date.now()}`)
mkdirSync(runRoot, { recursive: true })
const nativeInputs = coreInputs(repo).files
const nativeInputHash = createHash('sha256')
for(const file of nativeInputs)nativeInputHash.update(file).update('\0').update(readFileSync(join(repo,file))).update('\0')
const results = { nativeInputs, nimSourceSha256: nativeInputHash.digest('hex'), revision: spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim(), platform: process.platform, arch: process.arch, referenceRuntime: process.version, compiler: 'Nim 2.2.12', checks: [], artifacts: [] }
const check = async (name, action) => {
	try {
		await action()
		results.checks.push({ name, passed: true })
		console.log(`PASS ${name}`)
	} catch (error) {
		results.checks.push({ name, passed: false, error: error.message })
		console.log(`FAIL ${name}: ${error.message.slice(0, 300)}`)
	}
}
const runtimeEnv = {
	...Object.fromEntries(
		Object.entries(process.env).filter(
			([key]) => !['PATH', 'BUN_BE_BUN'].includes(key.toUpperCase()),
		),
	),
	PATH: '',
}
const stage = join(runRoot, 'source')
mkdirSync(stage)
cpSync(join(repo, 'packages/cli/src'), join(stage, 'cli'), { recursive: true })
// Freeze identity at compile time. Every other CLI source file is copied verbatim.
const manifest = JSON.parse(readFileSync(join(repo, 'packages/cli/package.json'), 'utf8'))
writeFileSync(
	join(stage, 'cli/agent/identity.ts'),
	`export const CLI_NAME = ${JSON.stringify(manifest.name)}\nexport const CLI_VERSION = ${JSON.stringify(manifest.version)}\nexport const cliServerIdentity = () => ({ name: CLI_NAME, version: CLI_VERSION })\n`,
)
const require = createRequire(join(repo, 'packages/cli/package.json'))
// Resolve the exact installed dependencies used by the reference CLI.
// Keep compiler caches in the run folder rather than the shared installation.
mkdirSync(join(stage, 'node_modules'))
for (const name of ['yaml', 'jsonc-parser']) {
	symlinkSync(
		dirname(require.resolve(`${name}/package.json`)),
		join(stage, 'node_modules', name),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
}
writeFileSync(
	join(stage, 'package.json'),
	JSON.stringify({ type: 'module', perry: { strict: true } }),
)

const execute = (binary, args, options = {}) =>
	spawnSync(binary, args, {
		cwd: stage,
		encoding: 'utf8',
		timeout: 15000,
		maxBuffer: 8 * 1024 * 1024,
		// No installed Node/Bun is discoverable through PATH by the native program.
		env: { ...runtimeEnv, ...options.env },
		...options,
	})
const parity = (binary, entry, args) => {
	const expected = execute(process.execPath, [entry, ...args])
	assert.equal(expected.status, 0, expected.stderr)
	const actual = execute(binary, args)
	assert.equal(actual.status, expected.status, actual.stderr)
	assert.equal(actual.stderr, expected.stderr)
	const value = JSON.parse(actual.stdout)
	assert.deepEqual(value, JSON.parse(expected.stdout))
	return value
}
const binaries = { core: compiler }
for (const name of ['catalog', 'project', 'io']) {
  cpSync(join(repo, 'tools/cli-perry', `${name}.ts`), join(stage, `${name}.ts`))
  const call = name === 'io' ? 'Io' : name[0].toUpperCase() + name.slice(1)
  writeFileSync(join(stage, `${name}.entry.ts`), readFileSync(join(stage, `${name}.ts`), 'utf8') + `\nrun${call}(process.argv.slice(2))\n`)
}
writeFileSync(join(stage, 'identity.entry.ts'), `
import { resolveInstallations } from './cli/mcp/docs-binding.ts'
import { listCorpusFiles, frameworkRepoRoots } from './cli/mcp/code-scope.ts'
const [operation, root, limit] = process.argv.slice(2)
const value = operation === 'identity' ? resolveInstallations(root)
 : operation === 'files' ? listCorpusFiles(root, { limit: Number(limit) })
 : frameworkRepoRoots(root)
console.log(JSON.stringify(value))
`)
const bytes = readFileSync(compiler)
assertCurrentNativeBuild(repo, JSON.parse(readFileSync(join(repo, 'research/nim-cli/core-build.json'))), bytes, coreInputs)
results.artifacts.push({name:'core',bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')})
if (binaries.core) {
	// Exercise the integrated binary through the same assertions as each slice.
	binaries.catalog = binaries.core
	binaries.project = binaries.core
	binaries.io = binaries.core
	results.behaviorBinary = 'core'
} else {
	results.behaviorBinary = 'individual slices; combined core did not compile'
}

if (binaries.catalog) {
	for (const args of [[], ['schema', 'status'], ['schema', 'catalog']]) {
		await check(`catalog parity ${args.join(' ')}`, () =>
			parity(binaries.catalog, 'catalog.entry.ts', args),
		)
	}
	await check('unknown schema exit', () =>
		assert.equal(execute(binaries.catalog, ['schema', 'missing']).status, 2),
	)
	await check('help parity', () => {
		const expected = execute(process.execPath, ['catalog.entry.ts', '--help'])
		const actual = execute(binaries.catalog, ['--help'])
		assert.equal(actual.status, 0, actual.stderr)
		assert.equal(actual.stdout, expected.stdout)
	})
	await check('startup budget', () => {
		const samples = []
		for (let i = 0; i < 25; i++) {
			const start = performance.now()
			const result = execute(binaries.core ?? binaries.catalog, ['--help'])
			assert.equal(result.status, 0, result.stderr)
			if (i >= 5) samples.push(performance.now() - start)
		}
		samples.sort((a, b) => a - b)
		results.startup = {
			binary: binaries.core ? 'core' : 'catalog',
			command: '--help',
			warmups: 5,
			samples: 20,
			medianMs: samples[10],
			p95Ms: samples[18],
			includesProcessLaunch: true,
		}
		assert.ok(results.startup.medianMs < 50, 'Warm median startup exceeds 50 ms')
	})
}
for (const artifact of results.artifacts) {
	await check(`${artifact.name} download budget`, () =>
		assert.ok(artifact.gzipBytes < 5_000_000, 'Compressed download exceeds 5 MB'),
	)
}

if (binaries.project) {
	const fixture = join(runRoot, 'workspace')
	mkdirSync(join(fixture, 'apps/demo'), { recursive: true })
	writeFileSync(
		join(fixture, 'package.json'),
		JSON.stringify({ name: 'fixture', private: true, workspaces: ['apps/*'] }),
	)
	writeFileSync(
		join(fixture, 'apps/demo/package.json'),
		JSON.stringify({
			name: 'demo',
			dependencies: { '@nativescript/ios': '9.1.0' },
			devDependencies: { '@nativescript/android': '9.1.0', '@nativescript/windows': '9.1.0' },
			xplat: { targets: { macos: { runtime: 'appkit-node-api' }, linux: { runtime: 'gtk' } } },
		}),
	)
	writeFileSync(join(fixture, 'apps/demo/vite.config.ts'), 'export default {}')
	writeFileSync(join(fixture, 'apps/demo/nativescript.config.ts'), 'export default {}')
	for (const args of [
		['discover', fixture],
		['platforms', join(fixture, 'apps/demo')],
		['discover', join(runRoot, 'missing')],
	]) {
		await check(
			`project parity ${args[0]} ${args[1] === fixture ? 'workspace' : 'app-or-missing'}`,
			() => parity(binaries.project, 'project.entry.ts', args),
		)
	}
	await check('all declared platforms', () => {
		assert.deepEqual(
			parity(binaries.project, 'project.entry.ts', ['platforms', join(fixture, 'apps/demo')]),
			['web', 'ios', 'android', 'windows', 'macos', 'linux'],
		)
	})
	const app = join(fixture, 'apps/demo')
	writeFileSync(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'demo',
			dependencies: { '@octane-xplat/ui': '^0.19.0' },
			xplat: { targets: {} },
		}),
	)
	writeFileSync(
		join(fixture, 'pnpm-lock.yaml'),
		"lockfileVersion: '9.0'\nimporters:\n  apps/demo:\n    dependencies:\n      '@octane-xplat/ui':\n        specifier: ^0.19.0\n        version: 0.19.0\n",
	)
	await check('YAML lockfile binding parity', () => {
		const binding = parity(binaries.project, 'project.entry.ts', ['binding', fixture, app])
		assert.equal(binding.status, 'provisional')
		assert.equal(binding.packages[0].version, '0.19.0')
	})
	const installed = join(fixture, 'packages/ui')
	mkdirSync(installed, { recursive: true })
	writeFileSync(
		join(installed, 'package.json'),
		JSON.stringify({ name: '@octane-xplat/ui', version: '0.18.0' }),
	)
	mkdirSync(join(fixture, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(
		installed,
		join(fixture, 'node_modules/@octane-xplat/ui'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	await check('installed symlink and lockfile conflict parity', () => {
		const binding = parity(binaries.project, 'project.entry.ts', ['binding', fixture, app])
		assert.equal(binding.status, 'installed')
		assert.equal(binding.packages[0].version, '0.18.0')
		assert.match(binding.discrepancy, /0\.19\.0/)
	})
	writeFileSync(
		join(fixture, 'bun.lock'),
		'// JSONC lock fixture\n' +
			JSON.stringify({
				lockfileVersion: 1,
				workspaces: { 'apps/demo': { name: 'demo' } },
				packages: { '@octane-xplat/ui': ['@octane-xplat/ui@0.20.0', '', {}, ''] },
			}).replace(/}$/, ',}'),
	)
	await check('Bun JSONC lockfile conflict parity', () => {
		const binding = parity(binaries.project, 'project.entry.ts', ['binding', fixture, app])
		assert.equal(binding.status, 'installed')
		assert.match(binding.discrepancy, /0\.20\.0/)
	})

  for (const [label, yaml] of [
    ['flow-and-peer', "lockfileVersion: '9.0'\nimporters: {apps/demo: {dependencies: {'@octane-xplat/ui': {specifier: '^0.19.0', version: '0.19.0(peer@1.0.0)'}}}}\n"],
    ['alias', "shared: &entry {specifier: '^0.19.0', version: '0.19.0'}\nimporters:\n  apps/demo:\n    dependencies:\n      '@octane-xplat/ui': *entry\n"],
    ['dev-override', "importers:\n  '.':\n    dependencies: {'@octane-xplat/ui': {version: '0.19.0'}}\n    devDependencies: {'@octane-xplat/ui': {version: '0.21.0'}}\n"],
  ]) {
    // Isolate YAML precedence after the Bun-lock check.
    const { unlinkSync } = await import('node:fs')
    try { unlinkSync(join(fixture, 'bun.lock')) } catch {}
    writeFileSync(join(fixture, 'pnpm-lock.yaml'), yaml)
    await check(`YAML ${label} parity`, () => parity(binaries.project, 'project.entry.ts', ['binding', fixture, app]))
  }
	writeFileSync(join(app, 'package.json'), '{')
	await check('malformed project manifest parity', () => {
		assert.deepEqual(parity(binaries.project, 'project.entry.ts', ['platforms', app]), [])
	})
}

if (binaries.io) {
	const server = createServer((request, response) => {
		response.writeHead(request.url === '/missing' ? 404 : 200)
		response.end('perry-probe')
	})
	await new Promise((done) => server.listen(0, '127.0.0.1', done))
	const port = server.address().port
	const asyncExecute = (args) =>
		new Promise((done) => {
			const child = spawn(binaries.io, args, {
				cwd: stage,
				env: runtimeEnv,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			let stdout = '',
				stderr = ''
			const timer = setTimeout(() => child.kill('SIGKILL'), 15000)
			child.stdout.on('data', (data) => {
				stdout += data
			})
			child.stderr.on('data', (data) => {
				stderr += data
			})
			child.on('error', (error) => {
				clearTimeout(timer)
				done({ code: null, stdout, stderr: error.message })
			})
			child.on('close', (code) => {
				clearTimeout(timer)
				done({ code, stdout, stderr })
			})
		})
	try {
		for (const [path, status] of [
			['/', 200],
			['/missing', 404],
		]) {
			await check(`HTTP ${status}`, async () => {
				const result = await asyncExecute(['http', `http://127.0.0.1:${port}${path}`])
				assert.equal(result.code, 0, result.stderr)
				assert.deepEqual(JSON.parse(result.stdout), { status, body: 'perry-probe' })
			})
		}
	} finally {
		await new Promise((done) => server.close(done))
	}
	await check('HTTP connection failure', async () => {
		const result = await asyncExecute(['http', `http://127.0.0.1:${port}/`])
		assert.equal(result.code, 5, result.stderr)
		assert.equal(result.stdout, '')
		assert.match(result.stderr, /HTTP request failed/)
	})
	await check('child streams and exit', () => {
		const result = execute(binaries.io, [
			'child',
			process.execPath,
			'-e',
			'process.stdout.write("out"); process.stderr.write("err"); process.exit(7)',
		])
		assert.equal(result.stdout, 'out')
		assert.equal(result.stderr, 'err')
		assert.equal(result.status, 7)
	})
	await check('child exit codes above signed-char range', () => {
		for (const status of [127,128,130,143,200,255]) {
			const result = execute(binaries.io, ['child',process.execPath,'-e',`process.exit(${status})`])
			assert.equal(result.status,status,result.stderr)
		}
	})
	await check('child spawn failure', () => {
		const result = execute(binaries.io, ['child', join(runRoot, 'not-a-program')])
		assert.equal(result.status, 5)
		assert.match(result.stderr, /Child launch failed/)
	})
	if (process.platform !== 'win32') {
		await check('child cancellation and forwarding', async () => {
			const childEntry = join(runRoot, 'cancel.cjs')
			const stopped = join(runRoot, 'child-stopped')
			writeFileSync(
				childEntry,
				'const fs = require("node:fs"); process.on("SIGTERM", () => { fs.writeFileSync(process.argv[2], "stopped"); process.exit(0) }); console.log("ready:" + process.pid); setTimeout(() => process.exit(9), 12000)\n',
			)
			const parent = spawn(binaries.io, ['child', process.execPath, childEntry, stopped], {
				env: runtimeEnv,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			let ready = false
			let childPid
			let stderr = ''
			parent.stderr.on('data', (data) => {
				stderr += data
			})
			const timer = setTimeout(() => parent.kill('SIGKILL'), 10000)
			try {
				await new Promise((done, reject) => {
					parent.on('error', reject)
					parent.stdout.on('data', (data) => {
						if (!ready && data.toString().includes('ready')) {
							ready = true
							childPid = Number(data.toString().match(/ready:(\d+)/)?.[1])
							parent.kill('SIGTERM')
						}
					})
					parent.on('close', (code, signal) => {
						if (ready && code === 0 && signal === null) done()
						else
							reject(
								new Error(
									`Cancellation failed: ready=${ready}, code=${code}, signal=${signal}, stderr=${stderr}`,
								),
							)
					})
				})
				assert.equal(readFileSync(stopped, 'utf8'), 'stopped')
			} finally {
				clearTimeout(timer)
				parent.kill('SIGKILL')
				if (childPid) {
					try {
						process.kill(childPid, 'SIGKILL')
					} catch (error) {
						if (error.code !== 'ESRCH') throw error
					}
				}
			}
		})
	} else {
		results.unverifiedCancellation =
			'Windows console cancellation needs a native console-control test; POSIX signals do not establish parity.'
	}
}

await check('real repository discovery parity', () => parity(compiler, 'project.entry.ts', ['discover', repo]))
await check('real repository binding parity', () => parity(compiler, 'project.entry.ts', ['binding', repo, join(repo, 'apps/web')]))
await check('real repository installation identity parity', () => parity(compiler, 'identity.entry.ts', ['identity', repo]))
await check('real app installation identity parity', () => parity(compiler, 'identity.entry.ts', ['identity', join(repo, 'apps/web')]))
await check('real repository source enumeration parity', () => parity(compiler, 'identity.entry.ts', ['files', join(repo, 'packages/cli/src'), '20']))
await check('real repository framework corpus parity', () => parity(compiler, 'identity.entry.ts', ['repo-roots', repo]))
await check('all generated schemas parity', () => {
  // Discover names from the source descriptors rather than a second hardcoded list.
  const names = execute(process.execPath, ['catalog.entry.ts', '--help']).stdout.split('\n').filter(Boolean).map(line => line.split(':')[0])
  for (const name of names) parity(compiler, 'catalog.entry.ts', ['schema', name])
})

results.passed = results.checks.every((check) => check.passed)
const sourceHash = createHash('sha256')
for (const file of readdirSync(stage, { recursive: true })
	.filter((file) => file.endsWith('.ts') && !file.startsWith('node_modules'))
	.sort()) {
	sourceHash.update(file).update(readFileSync(join(stage, file)))
}
results.sourceSha256 = sourceHash.digest('hex')
writeFileSync(join(runRoot, 'results.json'), JSON.stringify(results, null, 2) + '\n')
console.log(`Evidence: ${runRoot}`)
process.exitCode = results.passed ? 0 : 1
