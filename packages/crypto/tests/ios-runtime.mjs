import { linkDependencies } from './native-fixture.mjs'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = process.env.XPLAT_NATIVE_TEST_REPO,
	device = process.env.XPLAT_IOS_DEVICE
assert.ok(repo && device, 'Select skymac.local checkout and a task-owned simulator')
await linkDependencies(root, repo)
const resources = join(root, 'tests/.runtime/App_Resources')
await cp(join(repo, 'apps/mobile/App_Resources'), resources, {
	recursive: true,
	filter: (path) => !path.endsWith('google-services.json'),
})
await mkdir(join(resources, 'iOS/src'), { recursive: true })
await cp(
	join(root, 'platforms/ios/src/XplatCryptoEngine.swift'),
	join(resources, 'iOS/src/XplatCryptoEngine.swift'),
)
const result = spawnSync(
	'bun',
	[
		'probe',
		'run',
		join(root, 'tests/conformance.ts'),
		'--target',
		'ios',
		'--device',
		device,
		'--deps',
		'@octane-xplat/lib,@octane-xplat/platform',
		'--resources',
		resources,
		'--timeout',
		'25000',
		'--startup-timeout',
		'180000',
	],
	{ cwd: repo, encoding: 'utf8', timeout: 240000, maxBuffer: 4 * 1024 * 1024 },
)
assert.equal(result.status, 0, `${result.stdout}${result.stderr} signal=${result.signal}`)
const report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')))
assert.equal(report.results.length, 1)
assert.equal(report.results[0].status, 'pass', JSON.stringify(report.results[0]))
assert.equal(report.results[0].measurements.cryptoConformance, true)
console.log(
	`iOS CryptoKit and Security: ${report.results[0].assertions.length} conformance assertions passed.`,
)
