import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, realpathSync, copyFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packNativeConsumer } from './pack.mjs'
import { scratchRun } from './scratch.mjs'
import { sha256 } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(root, `research/go-cli/xplat-go-${target}-cli-onnx${process.platform === 'win32' ? '.exe' : ''}`)
function run(exe, args, options = {}) {
	const result = spawnSync(exe, args, { encoding: 'utf8', timeout: 60000, ...options })
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result
}

test('private npm consumer uses the native bin with opt-in engines and a real project worker', (t) => {
	const scratch = realpathSync(scratchRun(root, 'go-npm-consumer'))
	t.after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
	const packaged = packNativeConsumer(root, binary, scratch)
	const { tarball, pkg, build } = packaged
	const retained = join(root, 'research/go-cli/retained')
	mkdirSync(retained, { recursive: true })
	const retainedTarball = join(retained, `npm-consumer-${target}-${packaged.sha256}.tgz`)
	copyFileSync(tarball, retainedTarball)
	assert.equal(pkg.private, true)
	for (const field of ['dependencies', 'optionalDependencies', 'devDependencies', 'scripts', 'publishConfig']) {
		assert.equal(pkg[field], undefined)
	}
	assert.deepEqual(Object.keys(pkg.exports).sort(), ['./linux-gtk/vite', './macos/vite', './vite', './worker'])
	assert.ok(Object.values(pkg.peerDependenciesMeta).every((value) => value.optional))
	const inventory = run('tar', ['-tzf', tarball]).stdout.split(/\r?\n/).filter(Boolean)
	assert.ok(inventory.includes('package/bin/xplat.exe'))
	assert.ok(inventory.includes('package/native-worker/manifest.json'))
	for (const file of Object.keys(build.releaseWorker.files)) {
		assert.ok(inventory.includes('package/native-worker/' + file), 'Packed release worker missing ' + file)
	}
	assert.ok(inventory.every((name) => /^package\/(package\.json|LICENSE|THIRD-PARTY-NOTICES\.txt|bin\/xplat\.exe|dist\/.+|native-worker\/.+)$/.test(name)))
	for (const path of ['dist/cli.js', 'dist/commands/dev.js', 'dist/mcp/docs-service.js', 'dist/macos/jsc-host/prebuilt/macos/host']) {
		assert.ok(!inventory.includes('package/' + path), path)
	}
	const consumer = join(scratch, 'consumer Ω')
	mkdirSync(consumer)
	writeFileSync(join(consumer, 'package.json'), JSON.stringify({
		private: true, dependencies: { '@octane-xplat/cli': `file:${tarball}` },
	}))
	run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
		cwd: consumer,
		env: { ...process.env, NODE_PATH: '', HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1', NO_PROXY: '' },
	})
	const installed = join(consumer, 'node_modules/@octane-xplat/cli')
	assert.deepEqual(readdirSync(join(consumer, 'node_modules')).filter((name) => !name.startsWith('.')), ['@octane-xplat'])
	assert.deepEqual(readdirSync(join(consumer, 'node_modules/@octane-xplat')), ['cli'])
	const native = join(installed, 'bin/xplat.exe')
	assert.equal(sha256(readFileSync(native)), build.sha256)
	assert.equal(run(native, ['--version'], { env: { ...process.env, PATH: '' } }).stdout.trim(), pkg.version)
	const catalog = JSON.parse(run(native, ['catalog', '--json'], { env: { ...process.env, PATH: '' } }).stdout)
	assert.equal(catalog.ok, true)
	assert.equal(run('bun', ['run', '--silent', 'xplat', '--version'], { cwd: consumer }).stdout.trim(), pkg.version)
	// Resolve through this isolated project, then execute a bounded JS-only operation.
	const worker = run(process.execPath, ['--input-type=module', '-e', 'console.log(import.meta.resolve("@octane-xplat/cli/worker"))'], { cwd: consumer }).stdout.trim()
	assert.ok(worker.startsWith('file:'))
	const request = join(scratch, 'request.json'), response = join(scratch, 'response.json')
	writeFileSync(request, JSON.stringify({ protocol: 'octane-build-worker', version: 1, id: 'packed-worker', project: consumer, operation: 'action-validate', phase: 'input', action: { id: 'packed.action', title: 'Packed action', description: 'Validates fixture input only', effects: { summary: 'No side effects' }, input: { fields: { value: { type: 'string', default: 'packed' } } } }, value: {} }))
	run(process.execPath, [fileURLToPath(worker), request, response], { cwd: consumer, env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' } })
	const result = JSON.parse(readFileSync(response))
	assert.equal(result.ok, true, JSON.stringify(result))
	assert.equal(result.id, 'packed-worker')
	assert.deepEqual(result.data.declaration, [])
	assert.equal(result.data.checked.ok, true, JSON.stringify(result))
	assert.deepEqual(result.data.checked.value, { value: 'packed' })
	// Upgrade policy belongs to the invoked release, even in an older project
	// with no installed helpers. Exercise it from the actual installed tarball.
	const older = join(scratch, 'older project')
	mkdirSync(older)
	writeFileSync(join(older, 'package.json'), JSON.stringify({ name: 'older', private: true, packageManager: 'bun@1.4.4', dependencies: { '@octane-xplat/ui': '0.18.0' }, devDependencies: { '@octane-xplat/cli': '0.18.0' } }))
	run(native, ['upgrade', '--no-install'], { cwd: older, env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' } })
	assert.equal(JSON.parse(readFileSync(join(older, 'package.json'))).workspaces.catalogs.xplat['@octane-xplat/cli'], build.releaseWorker.frameworkVersion)
	writeFileSync(join(root, `research/go-cli/npm-consumer-${target}.json`), JSON.stringify({ target, passed: true, sourceInputs: build.inputs, executableSha256: build.sha256, tarballBytes: packaged.bytes, tarballSha256: packaged.sha256, retainedTarball, scope: 'Private host npm tarball, real isolated Bun install, direct native bin and bounded Node worker; no production publish, Vite engine execution, model loading or other host qualification.' }, null, 2) + '\n')
})
