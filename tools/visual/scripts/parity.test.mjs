import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { sourceIdentity } from './capture-manifest.ts'
import { assertParity, comparePixels, profile, promoteCommon, validateCapture } from './parity.ts'

// Deterministic synthetic pixels test encoding and comparison without a
// screenshot dependency. These fixtures are not host capture evidence.
const reference = new PNG({ width: 96, height: 64 })
for (let y = 0; y < reference.height; y++) {
	for (let x = 0; x < reference.width; x++) {
		const offset = (y * reference.width + x) * 4
		reference.data[offset] = (x * 13) % 256
		reference.data[offset + 1] = (y * 17) % 256
		reference.data[offset + 2] = ((x + y) * 7) % 256
		reference.data[offset + 3] = 255
	}
}

const bytes = PNG.sync.write(reference)
const expected = { runId: 'unit-fixture', revision: 'fixture', scenarioHash: 'fixture' }
const capture = (target) => ({
	...expected,
	target,
	storyId: 'switch--unchecked-light',
	args: { checked: false, stageId: 'switch--unchecked-light' },
	provenance: 'real',
	profile,
	width: 96,
	height: 64,
	runtime: { capture: 'unit fixture, not a host capture' },
	displacement: 0,
	pngBase64: bytes.toString('base64'),
})

test('exact comparator includes every decoded channel and excludes PNG compression', () => {
	const encoded = PNG.sync.write(reference, { deflateLevel: 0 })
	assert.equal(comparePixels(reference, PNG.sync.read(encoded)).differentPixels, 0)
	const mutated = PNG.sync.read(bytes)
	mutated.data[0] ^= 1
	assert.equal(comparePixels(reference, mutated).differentPixels, 1)
})

test('a one-pixel translation fails exact parity', () => {
	const displaced = PNG.sync.read(bytes)
	for (let y = 0; y < 64; y++) {
		for (let x = 95; x > 0; x--) {
			const index = (y * 96 + x) * 4
			displaced.data.set(reference.data.subarray(index - 4, index), index)
		}
	}

	assert.ok(comparePixels(reference, displaced).differentPixels > 0)
})

test('common reference detects a divergent target even when both targets drift together', () => {
	const changed = PNG.sync.read(bytes)
	changed.data[0] ^= 1
	const captures = ['web', 'ios'].map((target) => ({
		...capture(target),
		pngBase64: PNG.sync.write(changed).toString('base64'),
	}))

	assert.deepEqual(
		assertParity(captures, reference, expected).map(({ target, status, differentPixels }) => ({
			target,
			status,
			differentPixels,
		})),
		['web', 'ios'].map((target) => ({ target, status: 'divergence', differentPixels: 1 })),
	)
})

test('rejects partial, duplicate, stale, mock and incompatible capture cohorts', () => {
	assert.throws(() => assertParity([capture('web')], reference, expected), /Incomplete/)
	assert.throws(
		() => assertParity([capture('web'), capture('web')], reference, expected),
		/Incomplete/,
	)

	for (const patch of [
		{ revision: 'stale' },
		{ runId: 'stale' },
		{ scenarioHash: 'stale' },
		{ provenance: 'mock' },
		{ profile: { ...profile, scale: 2 } },
		{ width: 95 },
		{ storyId: 'wrong' },
	]) {
		assert.throws(() => validateCapture({ ...capture('ios'), ...patch }, expected), /Invalid/)
	}
})

test('retained promotion rebinds stale metadata only for byte-identical pixels', async () => {
	const { mkdtempSync, writeFileSync, rmSync, mkdirSync } = await import('node:fs')
	const { tmpdir } = await import('node:os')
	const { join } = await import('node:path')
	const directory = mkdtempSync(join(tmpdir(), 'xplat-promote-unit-'))
	try {
		const common = join(directory, 'common')
		mkdirSync(common)
		const run = { runId: 'retained-run', revision: 'retained-revision' }
		const identity = sourceIdentity()
		const retainedCapture = {
			...capture('web'),
			...run,
			scenarioHash: identity.scenarioHash,
		}

		writeFileSync(
			join(directory, 'manifest.json'),
			JSON.stringify({ ...run, scenarioHash: identity.scenarioHash }),
		)

		writeFileSync(join(directory, 'web-0.json'), JSON.stringify(retainedCapture))
		writeFileSync(join(common, 'reference.png'), bytes)
		writeFileSync(
			join(common, 'reference.json'),
			JSON.stringify({ ...capture('web'), scenarioHash: 'stale' }),
		)

		promoteCommon(directory, common, { retained: true })
		const rebound = JSON.parse(readFileSync(join(common, 'reference.json')))
		assert.equal(rebound.runId, 'retained-run')
		assert.equal(rebound.revision, 'retained-revision')
		assert.equal(rebound.scenarioHash, identity.scenarioHash)
		assert.deepEqual(readFileSync(join(common, 'reference.png')), bytes)

		// Changed pixels are a new appearance, not a metadata refresh.
		const changed = PNG.sync.read(bytes)
		changed.data[0] ^= 1
		writeFileSync(
			join(directory, 'web-0.json'),
			JSON.stringify({ ...retainedCapture, pngBase64: PNG.sync.write(changed).toString('base64') }),
		)

		assert.throws(() => promoteCommon(directory, common, { retained: true }), /byte-identical/)

		// Stale scenario identity and broken run binding both still reject.
		writeFileSync(
			join(directory, 'web-0.json'),
			JSON.stringify({ ...retainedCapture, scenarioHash: 'stale' }),
		)

		assert.throws(() => promoteCommon(directory, common, { retained: true }), /Invalid/)
		writeFileSync(
			join(directory, 'web-0.json'),
			JSON.stringify({ ...retainedCapture, revision: 'other-revision' }),
		)

		assert.throws(() => promoteCommon(directory, common, { retained: true }), /Invalid/)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})

test('CLI divergence and two-target success preserve honest coverage and reference bytes', async () => {
	const { mkdtempSync, writeFileSync, rmSync, mkdirSync } = await import('node:fs')
	const { tmpdir } = await import('node:os')
	const { join } = await import('node:path')
	const { spawnSync } = await import('node:child_process')
	const { runParity } = await import('./parity.ts')
	const directory = mkdtempSync(join(tmpdir(), 'xplat-parity-unit-'))
	try {
		const common = join(directory, 'common')
		mkdirSync(common)
		writeFileSync(
			join(directory, 'manifest.json'),
			JSON.stringify({
				...expected,
				requiredTargets: ['web'],
				scope: 'six-platform-suite',
				fullSuiteCoverage: 'complete',
				missingProductTargets: [],
			}),
		)

		writeFileSync(join(directory, 'web-0.json'), JSON.stringify(capture('web')))
		const changed = PNG.sync.read(bytes)
		changed.data[0] ^= 1
		writeFileSync(
			join(directory, 'ios-0.json'),
			JSON.stringify({ ...capture('ios'), pngBase64: PNG.sync.write(changed).toString('base64') }),
		)

		writeFileSync(join(common, 'reference.png'), bytes)
		writeFileSync(join(common, 'reference.json'), JSON.stringify(capture('web')))
		assert.equal(runParity(directory, common), 1)
		const report = JSON.parse(readFileSync(join(directory, 'parity-report.json')))
		assert.deepEqual(report.requiredTargets, ['web', 'ios'])
		assert.equal(report.scope, 'milestone-3-web-ios-spike')
		assert.equal(report.fullSuiteCoverage, 'incomplete')
		assert.deepEqual(report.missingProductTargets, ['android', 'macos', 'windows', 'linux'])
		assert.deepEqual(
			report.results.map((r) => [r.target, r.status, r.differentPixels]),
			[
				['web', 'pass', 0],
				['ios', 'divergence', 1],
			],
		)

		assert.deepEqual(readFileSync(join(common, 'reference.png')), bytes)
		writeFileSync(join(directory, 'ios-0.json'), JSON.stringify(capture('ios')))
		assert.equal(runParity(directory, common), 0)
		const passingReport = JSON.parse(readFileSync(join(directory, 'parity-report.json')))
		assert.equal(passingReport.status, 'pass')
		assert.equal(passingReport.fullSuiteCoverage, 'incomplete')
		assert.equal(passingReport.scope, 'milestone-3-web-ios-spike')
		assert.deepEqual(passingReport.requiredTargets, ['web', 'ios'])
		assert.deepEqual(passingReport.missingProductTargets, ['android', 'macos', 'windows', 'linux'])
		assert.deepEqual(readFileSync(join(common, 'reference.png')), bytes)
		const result = spawnSync(
			process.execPath,
			[
				new URL('./parity.ts', import.meta.url).pathname,
				`--captures=${directory}`,
				'--diagnostic=opaque-pixel',
			],
			{ encoding: 'utf8' },
		)

		assert.equal(result.status, 1)
		assert.equal(JSON.parse(result.stdout).target, 'web')
		assert.equal(JSON.parse(result.stdout).differentPixels, 1)
		assert.deepEqual(readFileSync(join(common, 'reference.png')), bytes)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})
