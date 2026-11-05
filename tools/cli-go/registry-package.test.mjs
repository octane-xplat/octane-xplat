import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, realpathSync, renameSync, copyFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { packNativeConsumer } from './pack.mjs'
import { scratchRun } from './scratch.mjs'
import { sha256 } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(root, `research/go-cli/xplat-go-${target}-cli-onnx${process.platform === 'win32' ? '.exe' : ''}`)
function run(exe, args, options = {}) {
	return spawnSync(exe, args, { encoding: 'utf8', timeout: 60000, ...options })
}
function success(result) {
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result
}

test('registry layout selects only the host payload and installs a direct native bin', async (t) => {
	const scratch = realpathSync(scratchRun(root, 'go-registry-consumer'))
	let registry, closed
	t.after(async () => {
		if (registry && registry.exitCode === null && registry.signalCode === null) {registry.kill('SIGKILL')}
		if (closed) {await closed}
		rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
	})
	const packaged = packNativeConsumer(root, binary, scratch, { registryLayout: true })
	const packages = [{ manifest: packaged.pkg, archive: packaged.tarball }, ...packaged.platforms.packages]
	const retained = join(root, 'research/go-cli/retained')
	mkdirSync(retained, { recursive: true })
	const artifacts = packages.map(({ manifest, archive }) => {
		const bytes = readFileSync(archive), hash = sha256(bytes)
		const path = join(retained, `registry-${manifest.name.split('/')[1]}-${hash}.tgz`)
		copyFileSync(archive, path)
		return { name: manifest.name, bytes: bytes.length, sha256: hash, path }
	})
	assert.equal(packaged.pkg.private, true)
	assert.equal(packaged.pkg.os, undefined)
	assert.equal(packaged.pkg.cpu, undefined)
	assert.equal(packaged.pkg.scripts.postinstall, 'node install-native.mjs')
	const ready = join(scratch, 'ready.json'), requests = join(scratch, 'requests.json')
	const input = join(scratch, 'registry.json')
	writeFileSync(input, JSON.stringify({ packages, ready, requests }))
	registry = spawn(process.execPath, [join(root, 'tools/cli-go/upgrade-registry-fixture.mjs'), input], { stdio: 'ignore' })
	closed = once(registry, 'close')
	const deadline = Date.now() + 10000
	while (!existsSync(ready)) {
		assert.equal(registry.exitCode, null, 'Private registry exited before readiness')
		assert.ok(Date.now() < deadline, 'Private registry readiness timeout')
		await delay(20)
	}
	const port = JSON.parse(readFileSync(ready)).port
	const expected = `@octane-xplat/cli-native-${process.platform}-${process.arch}`
	const selected = artifacts.find((item) => item.name === expected)
	assert.ok(selected)
	for (const ignoreScripts of [false, true]) {
		const consumer = join(scratch, ignoreScripts ? 'manual Ω' : 'automatic Ω')
		mkdirSync(consumer)
		writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, dependencies: { '@octane-xplat/cli': packaged.pkg.version }, trustedDependencies: ['@octane-xplat/cli'] }))
		writeFileSync(join(consumer, '.npmrc'), `@octane-xplat:registry=http://127.0.0.1:${port}/\n`)
		const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', BUN_INSTALL_CACHE_DIR: join(consumer, 'cache') }
		for (const name of Object.keys(env)) {
			if (['npm_config_registry', 'bun_config_registry'].includes(name.toLowerCase())) {delete env[name]}
		}
		success(run('bun', ['install', '--linker', 'isolated', ...(ignoreScripts ? ['--ignore-scripts'] : [])], { cwd: consumer, env }))
		const installed = realpathSync(join(consumer, 'node_modules/@octane-xplat/cli'))
		const image = join(installed, 'bin/xplat.exe'), installer = join(installed, 'install-native.mjs')
		if (ignoreScripts) {
			assert.notEqual(sha256(readFileSync(image)), packaged.build.sha256, 'Disabled scripts must not masquerade as installed native selection')
			success(run(process.execPath, [installer], { cwd: consumer, env }))
		}
		assert.equal(sha256(readFileSync(image)), packaged.build.sha256)
		assert.equal(success(run(image, ['--version'], { env: { ...env, PATH: '' } })).stdout.trim(), packaged.pkg.version)
		assert.equal(success(run('bun', ['run', '--silent', 'xplat', '--version'], { cwd: consumer, env })).stdout.trim(), packaged.pkg.version)
		const require = createRequire(join(installed, 'package.json'))
		const payload = dirname(require.resolve(expected + '/package.json'))
		for (const foreign of artifacts.filter((item) => item.name !== expected && item.name !== packaged.pkg.name)) {
			assert.throws(() => require.resolve(foreign.name + '/package.json'))
		}
		if (ignoreScripts) {
			const source = join(payload, 'xplat.exe'), original = source + '.original'
			renameSync(source, original)
			try {
				writeFileSync(source, Buffer.alloc(packaged.build.bytes))
				const bad = run(process.execPath, [installer], { cwd: consumer, env })
				assert.notEqual(bad.status, 0)
				assert.match(bad.stderr, /checksum mismatch/)
				assert.equal(sha256(readFileSync(image)), packaged.build.sha256)
			} finally { rmSync(source, { force: true }); renameSync(original, source) }
			const manifest = join(payload, 'package.json')
			renameSync(manifest, manifest + '.original')
			try {
				const missing = run(process.execPath, [installer], { cwd: consumer, env })
				assert.notEqual(missing.status, 0)
				assert.match(missing.stderr, /optional dependencies enabled/)
				assert.equal(sha256(readFileSync(image)), packaged.build.sha256)
			} finally { renameSync(manifest + '.original', manifest) }
		}
	}
	const seen = JSON.parse(readFileSync(requests))
	assert.ok(seen.includes('/package-0.tgz'), 'The main package must be downloaded from the private registry')
	const selectedIndex = packages.findIndex((item) => item.manifest.name === expected)
	assert.ok(seen.includes(`/package-${selectedIndex}.tgz`), 'The host binary must be downloaded')
	for (let index = 1; index < packages.length; index++) {
		if (index !== selectedIndex) {assert.ok(!seen.includes(`/package-${index}.tgz`), 'Do not download foreign native payloads')}
	}
	writeFileSync(join(root, `research/go-cli/registry-consumer-${target}.json`), JSON.stringify({ target, passed: true, sourceInputs: packaged.build.inputs, executableSha256: packaged.build.sha256, mainBytes: artifacts[0].bytes, selectedBytes: selected.bytes, totalDownloadBytes: artifacts[0].bytes + selected.bytes, artifacts, requests: seen, scope: 'Actual Bun registry selection, trusted install hook, ignored-script repair and integrity/missing-payload controls; private local fixtures, no publication, model initialization or unexecuted platform qualification.' }, null, 2) + '\n')
})
