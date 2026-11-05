// Private host-specific consumer artifact; never changes the production package.
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { nativeInputs, sha256 } from './native-inputs.mjs'
import { nativeCliPin } from '../../packages/cli/src/cli-channel.ts'
import { stagePlatformPackages } from './pack-platforms.mjs'

export function packNativeConsumer(root, binary, directory, { registryLayout = false } = {}) {
	const build = JSON.parse(readFileSync(binary + '.json'))
	const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
	assert.equal(build.cli, true)
	assert.equal(build.onnx, true, 'Consumer qualification includes native inference support')
	assert.equal(build.target, target, 'Consumer gate requires an actual host binary')
	assert.deepEqual(build.inputs, nativeInputs(root), 'Rebuild stale native inputs')
	assert.equal(sha256(readFileSync(binary)), build.sha256)
	const source = JSON.parse(readFileSync(join(root, 'packages/cli/package.json')))
	assert.equal(nativeCliPin(build.cliVersion, source.version), build.cliVersion)
	const archive = readFileSync(binary + '.tgz')
	assert.equal(sha256(archive), build.download.sha256)
	assert.equal(archive.length, build.download.bytes)
	const stage = join(directory, 'stage')
	mkdirSync(stage) // A caller must supply a fresh owned directory.
	mkdirSync(join(stage, 'bin'))
	cpSync(binary, join(stage, 'bin/xplat.exe'))
	for (const name of ['LICENSE', 'THIRD-PARTY-NOTICES.txt']) {
		const extracted = spawnSync('tar', ['-xOf', binary + '.tgz', name], { encoding: 'utf8' })
		assert.equal(extracted.status, 0, extracted.stderr)
		writeFileSync(join(stage, name), extracted.stdout)
	}
	const worker = build.releaseWorker
	assert.equal(worker.cliVersion, build.cliVersion)
	for (const [file, record] of Object.entries(worker.files)) {
		assert.ok(!file.split('/').some((part) => part === '..' || part === ''))
		assert.ok(!file.startsWith('/') && !file.includes('\\'))
		const bytes = readFileSync(join(root, 'research/go-cli/release-worker', file))
		assert.equal(sha256(bytes), record.sha256, file)
		assert.equal(bytes.length, record.bytes, file)
		const output = join(stage, 'native-worker', file)
		mkdirSync(dirname(output), { recursive: true })
		writeFileSync(output, bytes)
	}
	writeFileSync(join(stage, 'native-worker/manifest.json'), JSON.stringify(worker))
	const plugins = JSON.parse(readFileSync(join(root, 'packages/build/package.json')))
	const peers = { ...plugins.dependencies, ...plugins.peerDependencies }
	for (const [name, range] of Object.entries(peers)) {
		if (range === 'workspace:*') {
			peers[name] = JSON.parse(readFileSync(join(root, 'packages', name.split('/')[1], 'package.json'))).version
		}
	}
	cpSync(join(root, 'packages/build/dist'), join(stage, 'dist'), { recursive: true })
	const pkg = {
		name: source.name,
		version: build.cliVersion,
		private: true,
		description: source.description,
		license: source.license,
		repository: source.repository,
		type: 'module',
		os: [process.platform],
		cpu: [process.arch],
		engines: plugins.engines,
		bin: { xplat: './bin/xplat.exe' },
		files: ['bin', 'dist', 'native-worker', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'],
		exports: plugins.exports,
		peerDependencies: peers,
		peerDependenciesMeta: Object.fromEntries(Object.keys(peers).map((name) => [name, { optional: true }])),
	}
	let platforms
	if (registryLayout) {
		platforms = stagePlatformPackages(root, directory, build)
		delete pkg.os
		delete pkg.cpu
		pkg.optionalDependencies = Object.fromEntries(platforms.packages.map(({ manifest }) => [manifest.name, build.cliVersion]))
		pkg.scripts = { postinstall: 'node install-native.mjs' }
		pkg.files.push('install-native.mjs', 'native-platforms.json')
		cpSync(join(root, 'tools/cli-go/install-native.mjs'), join(stage, 'install-native.mjs'))
		writeFileSync(join(stage, 'native-platforms.json'), JSON.stringify(platforms.manifest, null, 2) + '\n')
		// Bun's Windows bin shim remembers a shebang before postinstall runs.
		// Keep this native .exe slot empty until installation selects its image.
		writeFileSync(join(stage, 'bin/xplat.exe'), '', { mode: 0o755 })
	}
	writeFileSync(join(stage, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
	const packed = spawnSync('bun', ['pm', 'pack', '--destination', directory], {
		cwd: stage, encoding: 'utf8', timeout: 60000,
	})
	assert.equal(packed.status, 0, packed.stdout + packed.stderr)
	const tarball = resolve(directory, `octane-xplat-cli-${build.cliVersion}.tgz`)
	return { stage, tarball, pkg, build, platforms, bytes: readFileSync(tarball).length, sha256: sha256(readFileSync(tarball)) }
}
