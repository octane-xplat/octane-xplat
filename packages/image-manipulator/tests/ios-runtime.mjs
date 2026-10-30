import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, realpath, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { redsOf, checkOrientations } from './png-fixture.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = resolve(process.env.XPLAT_NATIVE_TEST_REPO ?? join(packageRoot, '../..'))
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(device, 'Select a task-owned booted simulator with XPLAT_IOS_DEVICE')

// Allow the task-owned source copy to use the installed host dependencies.
for (const [name, source] of [
	['@nativescript/core', join(repoRoot, 'apps/mobile/node_modules/@nativescript/core')],
	['@octane-xplat/lib', process.env.XPLAT_IMAGE_LIB_ROOT ?? join(repoRoot, 'packages/lib')],
]) {
	const destination = join(packageRoot, 'node_modules', name)
	await mkdir(resolve(destination, '..'), { recursive: true })
	try {
		await symlink(await realpath(source), destination, 'dir')
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}
	}
}

const result = spawnSync(
	'bun',
	[
		'probe',
		'run',
		join(packageRoot, 'tests/runtime.ios.ts'),
		'--target',
		'ios',
		'--device',
		device,
		'--deps',
		'@octane-xplat/lib',
	],
	{ cwd: repoRoot, encoding: 'utf8', timeout: 600_000, maxBuffer: 8 * 1024 * 1024 },
)
assert.equal(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`)
const output = result.stdout.slice(result.stdout.indexOf('{'))
const report = JSON.parse(output)
assert.equal(report.results.length, 1)
const run = report.results[0]
assert.equal(run.status, 'pass', JSON.stringify(run))
const samples = Object.values(run.measurements).filter((value) => value?.base64 && value?.expected)
assert.equal(samples.length, 5)
for (const sample of samples) {
	const actual = redsOf(sample.base64)
	assert.ok(
		actual.length === sample.expected.length &&
			actual.every((value, index) => Math.abs(value - sample.expected[index]) <= 1),
		`Encoded pixels: ${JSON.stringify(actual)}`,
	)
}
checkOrientations(Object.values(run.measurements).filter((value) => value?.orientation))
console.log(
	`iOS ${device}: ${run.assertions.length} native assertions, ${samples.length} independently decoded PNG samples, and eight EXIF orientations passed.`,
)
