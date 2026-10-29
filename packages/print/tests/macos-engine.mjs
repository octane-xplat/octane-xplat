import assert from 'node:assert/strict'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const directory = await mkdtemp(join(tmpdir(), 'xplat-print-engine-'))
try {
	// Swift requires the executable's top-level statements in a file named main.swift.
	const main = join(directory, 'main.swift')
	await copyFile(fileURLToPath(new URL('macos-main.swift', import.meta.url)), main)
	const build = spawnSync(
		'xcrun',
		[
			'swiftc',
			'-swift-version',
			'5',
			'-target',
			'arm64-apple-macos13.5',
			'-framework',
			'AppKit',
			'-framework',
			'WebKit',
			'-framework',
			'PDFKit',
			fileURLToPath(new URL('../platforms/macos/src/XplatPrintEngine.swift', import.meta.url)),
			main,
			'-o',
			join(directory, 'case'),
		],
		{ encoding: 'utf8', timeout: 60000 },
	)
	assert.equal(build.status, 0, build.stdout + build.stderr)
	const result = spawnSync(join(directory, 'case'), { encoding: 'utf8', timeout: 30000 })
	assert.equal(
		result.status,
		0,
		`${result.stdout}${result.stderr} signal=${result.signal} error=${result.error?.message}`,
	)
	assert.match(result.stdout, /PRINT_ENGINE_OK assertions=19/)
	console.log(result.stdout.trim())
} finally {
	await rm(directory, { recursive: true, force: true })
}
