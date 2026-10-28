// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const temporaryRoot = mkdtempSync(join(tmpdir(), 'xplat-vis-web-'))
function run(label, env, expectedStatus, expectedMessage) {
	const result = spawnSync('pnpm', ['exec', 'vitest', 'run', 'web.test'], {
		shell: process.platform === 'win32',
		encoding: 'utf8',
		timeout: 120000,
		env: { ...process.env, ...env },
	})

	const output = result.stdout + result.stderr
	process.stdout.write(output)
	if (
		result.error ||
		(expectedStatus === 0 ? result.status !== 0 : result.status === 0 || result.status === null)
	) {
		throw new Error(`${label}: unexpected exit ${result.status}`, { cause: result.error })
	}

	if (expectedMessage && !expectedMessage.test(output)) {
		throw new Error(`${label}: failure reason was not demonstrated`)
	}

	console.log(`${label}: expected exit ${result.status}`)
}

try {
	// Three fresh launches must each produce decoded captures identical to the
	// committed baseline at zero tolerance.
	for (let launch = 1; launch <= 3; launch++) {
		run(`fresh launch ${launch}`, { VIS_WEB_ALTERED: '0', VIS_ROOT: 'vis/web' }, 0)
	}

	run('controlled visual change', { VIS_WEB_ALTERED: '1', VIS_ROOT: 'vis/web' }, 1, /differ by/)

	run(
		'missing baseline',
		{ VIS_WEB_ALTERED: '0', VIS_ROOT: temporaryRoot },
		1,
		/has no baseline image/,
	)

	function pngFiles(directory) {
		return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? pngFiles(join(directory, entry.name))
				: entry.name.endsWith('.png')
					? [entry.name]
					: [],
		)
	}

	const baselineDir = join(temporaryRoot, '__baselines__')
	try {
		if (pngFiles(baselineDir).length) {
			throw new Error('Ordinary run wrote a missing baseline')
		}
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error
		}
	}
} finally {
	rmSync(temporaryRoot, { recursive: true, force: true })
	console.log('Owned temporary snapshot directory released')
}
