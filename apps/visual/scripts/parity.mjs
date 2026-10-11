import { sourceIdentity } from './capture-manifest.mjs'
import { PNG } from 'pngjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const profile = {
	id: 'switch-light-96x64@1',
	width: 96,
	height: 64,
	scale: 1,
	crop: { x: 0, y: 0 },
	appearance: 'light',
	format: 'png',
}

const storyId = 'switch--unchecked-light'
const args = { checked: false, stageId: storyId }

export function validateCapture(capture, expected) {
	for (const key of ['runId', 'revision', 'scenarioHash']) {
		if (!expected[key] || capture[key] !== expected[key]) {
			throw new Error(`Invalid ${capture.target} capture: ${key}`)
		}
	}

	if (
		!['web', 'ios'].includes(capture.target) ||
		capture.provenance !== 'real' ||
		capture.storyId !== storyId ||
		JSON.stringify(capture.args) !== JSON.stringify(args) ||
		JSON.stringify(capture.profile) !== JSON.stringify(profile) ||
		capture.width !== 96 ||
		capture.height !== 64 ||
		!capture.runtime?.capture
	) {
		throw new Error(`Invalid ${capture.target} capture: identity, provenance, inputs or profile`)
	}

	const png = PNG.sync.read(Buffer.from(capture.pngBase64, 'base64'))
	if (png.width !== 96 || png.height !== 64) {
		throw new Error(`Invalid ${capture.target} capture: decoded dimensions`)
	}

	let varied = false
	for (let i = 0; i < png.data.length; i += 4) {
		if (png.data[i + 3] !== 255) {
			throw new Error(`Invalid ${capture.target} capture: nonopaque stage`)
		}

		if (!png.data.subarray(i, i + 4).equals(png.data.subarray(0, 4))) {
			varied = true
		}
	}

	if (!varied) {
		throw new Error(`Invalid ${capture.target} capture: blank stage`)
	}

	return png
}

export function comparePixels(reference, actual) {
	if (reference.width !== actual.width || reference.height !== actual.height) {
		throw new Error('Incompatible pixel dimensions')
	}

	const diff = new PNG({ width: actual.width, height: actual.height })
	let differentPixels = 0
	for (let i = 0; i < actual.data.length; i += 4) {
		const different = !actual.data.subarray(i, i + 4).equals(reference.data.subarray(i, i + 4))
		if (different) {
			differentPixels++
		}

		diff.data.set(different ? [255, 0, 0, 255] : [255, 255, 255, 255], i)
	}

	return { differentPixels, diff }
}

/** Both current targets compare to one immutable reference, including its source target. */
export function assertParity(captures, reference, expected) {
	if (
		captures.length !== 2 ||
		new Set(captures.map((c) => c.target)).size !== 2 ||
		!['web', 'ios'].every((t) => captures.some((c) => c.target === t))
	) {
		throw new Error('Incomplete real parity cohort: required web, ios')
	}

	return captures.map((capture) => {
		const actual = validateCapture(capture, expected)
		if (capture.displacement !== 0) {
			throw new Error(`Invalid ${capture.target} ordinary capture: displacement`)
		}

		const comparison = comparePixels(reference, actual)
		return {
			target: capture.target,
			status: comparison.differentPixels ? 'divergence' : 'pass',
			...comparison,
		}
	})
}

export function runParity(directory, commonDirectory = join(root, 'vis/common/switch')) {
	const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')))
	const captures = ['web-0', 'ios-0'].map((name) =>
		JSON.parse(readFileSync(join(directory, `${name}.json`))),
	)

	const commonMeta = JSON.parse(readFileSync(join(commonDirectory, 'reference.json')))
	if (
		commonMeta.storyId !== storyId ||
		commonMeta.provenance !== 'real' ||
		commonMeta.target !== 'web' ||
		commonMeta.scenarioHash !== manifest.scenarioHash ||
		JSON.stringify(commonMeta.profile) !== JSON.stringify(profile)
	) {
		throw new Error('Invalid common reference identity or profile')
	}

	const reference = PNG.sync.read(readFileSync(join(commonDirectory, 'reference.png')))
	const results = assertParity(captures, reference, manifest)
	for (const result of results) {
		writeFileSync(join(directory, `${result.target}-parity-diff.png`), PNG.sync.write(result.diff))
	}

	const report = {
		requiredTargets: ['web', 'ios'],
		scope: 'milestone-3-web-ios-spike',
		fullSuiteCoverage: 'incomplete',
		missingProductTargets: ['android', 'macos', 'windows', 'linux'],
		...manifest,
		results: results.map(({ diff: _diff, ...result }) => result),
		status: results.some((r) => r.status !== 'pass') ? 'divergence' : 'pass',
	}

	writeFileSync(join(directory, 'parity-report.json'), JSON.stringify(report, null, 2))
	console.log(JSON.stringify(report, null, 2))
	return report.status === 'pass' ? 0 : 1
}

export function runSensitivity(directory, kind) {
	const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')))
	const target = kind === 'opaque-pixel' ? 'web' : kind.split('-')[0]
	if (!['opaque-pixel', 'web-displacement', 'ios-displacement'].includes(kind)) {
		throw new Error('Unknown diagnostic')
	}

	const unchanged = JSON.parse(readFileSync(join(directory, `${target}-0.json`)))
	const reference = validateCapture(unchanged, manifest)
	let actual
	if (kind === 'opaque-pixel') {
		actual = PNG.sync.read(Buffer.from(unchanged.pngBase64, 'base64'))
		actual.data[0] ^= 1
	} else {
		const displaced = JSON.parse(
			readFileSync(join(directory, `${target}-${target === 'ios' ? 3 : 1}.json`)),
		)

		if (displaced.displacement !== 1) {
			throw new Error(`Missing ${target} rendered one-pixel displacement`)
		}

		actual = validateCapture(displaced, manifest)
	}

	const { differentPixels, diff } = comparePixels(reference, actual)
	writeFileSync(join(directory, `${kind}-diff.png`), PNG.sync.write(diff))
	const report = {
		diagnostic: kind,
		target,
		differentPixels,
		status: differentPixels ? 'divergence' : 'pass',
		exitStatus: differentPixels ? 1 : 0,
	}

	writeFileSync(join(directory, `${kind}-report.json`), JSON.stringify(report, null, 2))
	console.log(JSON.stringify(report))
	return report.exitStatus
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const promote = process.argv.includes('--promote-common')
		const directory = resolve(
			process.env.VIS_CAPTURE_DIR ||
				process.argv.find((a) => a.startsWith('--captures='))?.slice(11) ||
				'artifacts/latest',
		)

		if (promote) {
			const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json')))
			const capture = JSON.parse(readFileSync(join(directory, 'web-0.json')))
			validateCapture(capture, { runId: manifest.runId, ...sourceIdentity() })
			if (capture.target !== 'web' || capture.displacement !== 0) {
				throw new Error('Only the unchanged real web capture may be promoted')
			}

			const common = join(root, 'vis/common/switch')
			mkdirSync(common, { recursive: true })
			writeFileSync(join(common, 'reference.png'), Buffer.from(capture.pngBase64, 'base64'))
			const { pngBase64: _pngBase64, ...metadata } = capture
			writeFileSync(join(common, 'reference.json'), JSON.stringify(metadata, null, 2) + '\n')
			console.log(
				'Explicit common-reference candidate generated; review and commit separately from target regression baselines',
			)
		} else {
			const diagnostic = process.argv.find((a) => a.startsWith('--diagnostic='))?.slice(13)
			process.exitCode = diagnostic ? runSensitivity(directory, diagnostic) : runParity(directory)
		}
	} catch (error) {
		console.error(`Parity failure: ${error.message}`)
		process.exitCode = 1
	}
}
