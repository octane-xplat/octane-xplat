import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'darwin') {
	throw new Error('The photo native checks require macOS')
}

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'xplat-photo-tests-'))
try {
	for (const [fixture, sources] of [
		['photo-lifecycle', ['CameraOwnership.swift', 'PhotoCaptureLifecycle.swift']],
		['photo-sheet', ['PhotoCaptureLifecycle.swift', 'XplatPhotoCaptureSheet.swift']],
	]) {
		const output = join(dir, fixture)
		execFileSync(
			'xcrun',
			[
				'swiftc',
				...sources.map((name) => join(root, 'platforms/macos/src', name)),
				join(root, 'tests/macos', `${fixture}.swift`),
				'-o',
				output,
			],
			{ stdio: 'inherit' },
		)

		execFileSync(output, [], { stdio: 'inherit', timeout: 30_000 })
	}
} finally {
	rmSync(dir, { recursive: true, force: true })
}
