import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createFingerprintAsync, NATIVE_FINGERPRINT_FORMAT } from '@octane-xplat/fingerprint'

test('publisher dry run gates production payloads by their actual recorded native inputs', async (t) => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-publisher-'))
	t.after(() => rm(root, { recursive: true, force: true }))
	const app = join(root, 'output')
	await mkdir(app)
	await mkdir(join(root, 'App_Resources/iOS'), { recursive: true })
	await mkdir(join(root, '.xplat/fingerprints'), { recursive: true })
	await writeFile(join(root, 'package.json'), '{}')
	await writeFile(
		join(root, 'pnpm-lock.yaml'),
		'lockfileVersion: 9.0\nimporters: {.: {}}\npackages: {}\n',
	)
	await writeFile(join(root, 'App_Resources/iOS/Bridge.swift'), 'func bridge() {}')
	await writeFile(join(app, 'package.json'), '{"main":"bundle"}')
	await writeFile(join(app, 'bundle.mjs'), 'export const version = 2')
	const toolchain = { configuration: 'release', fixtureCompiler: '1' }
	const fingerprint = await createFingerprintAsync(root, { platforms: ['ios'], toolchain })
	const metadata = {
		format: NATIVE_FINGERPRINT_FORMAT,
		hash: fingerprint.hash,
		platform: 'ios',
		release: true,
	}
	await writeFile(join(app, 'xplat-native.json'), JSON.stringify(metadata))
	await writeFile(
		join(root, '.xplat/fingerprints/ios.json'),
		JSON.stringify({ ...metadata, toolchain, sources: fingerprint.sources }),
	)
	const publish = () =>
		spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL('scripts/publish-bundle.ts', import.meta.url)),
				'--dir',
				app,
				'--project-dir',
				root,
				'--platform',
				'ios',
				'--version',
				'2.0.0',
				'--dry-run',
			],
			{ encoding: 'utf8', timeout: 30000 },
		)
	let result = publish()
	assert.equal(result.status, 0, result.stderr)
	assert.ok(result.stdout.includes('channels/stable/ios/' + fingerprint.hash + '.json'))
	await writeFile(join(app, 'bundle.mjs'), 'export const version = 3')
	result = publish()
	assert.equal(result.status, 0, result.stderr)
	await writeFile(join(root, 'App_Resources/iOS/Bridge.swift'), 'func changedNativeAPI() {}')
	result = publish()
	assert.equal(result.status, 1)
	assert.match(result.stderr, /Native inputs changed/)
	await writeFile(join(app, 'xplat-native.json'), JSON.stringify({ ...metadata, release: false }))
	result = publish()
	assert.equal(result.status, 1)
	assert.match(result.stderr, /prepared release payload/)
})
