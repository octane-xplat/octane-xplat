// Private registry-layout qualification. No publishing or production edits.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { sha256 } from './native-inputs.mjs'

export const distributionTargets = [
	['darwin-arm64', 'darwin', 'arm64'],
	['linux-amd64', 'linux', 'x64'],
	['windows-amd64', 'win32', 'x64'],
]

export function stagePlatformPackages(root, directory, mainBuild) {
	const packages = [], targets = {}
	for (const [target, os, cpu] of distributionTargets) {
		const binary = join(root, `research/go-cli/xplat-go-${target}-cli-onnx${os === 'win32' ? '.exe' : ''}`)
		const build = JSON.parse(readFileSync(binary + '.json'))
		assert.equal(build.target, target)
		assert.equal(build.cli, true)
		assert.equal(build.onnx, true)
		assert.equal(build.cliVersion, mainBuild.cliVersion)
		assert.deepEqual(build.inputs, mainBuild.inputs)
		const bytes = readFileSync(binary)
		assert.equal(sha256(bytes), build.sha256)
		assert.equal(sha256(readFileSync(binary + '.tgz')), build.download.sha256)
		const npmTarget = `${os}-${cpu}`
		const name = `@octane-xplat/cli-native-${npmTarget}`
		const stage = join(directory, npmTarget)
		mkdirSync(stage)
		copyFileSync(binary, join(stage, 'xplat.exe'))
		for (const file of ['LICENSE', 'THIRD-PARTY-NOTICES.txt']) {
			const result = spawnSync('tar', ['-xOf', binary + '.tgz', file], { encoding: 'utf8' })
			assert.equal(result.status, 0, result.stderr)
			writeFileSync(join(stage, file), result.stdout)
		}
		const manifest = {
			name, version: build.cliVersion, private: true,
			os: [os], cpu: [cpu], license: 'MIT',
			files: ['xplat.exe', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'],
			exports: { './package.json': './package.json' },
		}
		writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
		const packed = spawnSync('bun', ['pm', 'pack', '--destination', directory], { cwd: stage, encoding: 'utf8', timeout: 60000 })
		assert.equal(packed.status, 0, packed.stdout + packed.stderr)
		const archive = join(directory, `${name.slice(1).replace('/', '-')}-${build.cliVersion}.tgz`)
		packages.push({ manifest, archive })
		targets[npmTarget] = { package: name, bytes: bytes.length, sha256: build.sha256 }
	}
	return { packages, manifest: { version: 1, cliVersion: mainBuild.cliVersion, targets } }
}
