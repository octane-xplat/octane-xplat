import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'darwin') {
	throw new Error('Movie storage checks require macOS')
}

const root = fileURLToPath(new URL('..', import.meta.url))
const directory = mkdtempSync(join(tmpdir(), 'xplat-packed-movie-storage-'))
const run = (command, args, options = {}) => execFileSync(command, args, {
	stdio: 'inherit', timeout: 120_000, ...options,
})

try {
	const extracted = join(directory, 'extracted')
	mkdirSync(extracted)
	run('pnpm', ['pack', '--pack-destination', directory], { cwd: root })
	const tarball = readdirSync(directory).find((name) => name.endsWith('.tgz'))
	run('tar', ['-xzf', join(directory, tarball), '-C', extracted])
	const fixture = join(directory, 'fixture.mp4')
	// A playable generated movie fixture qualifies bytes/storage, not camera capture.
	run('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=black:s=64x48:r=10',
		'-t', '0.3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', fixture])

	const binary = join(directory, 'movie-storage')
	run('xcrun', ['swiftc', '-suppress-warnings',
		join(extracted, 'package/platforms/macos/src/XplatWebViewHost.swift'),
		join(root, 'tests/macos/movie-storage.swift'), '-o', binary])

	run(binary, [fixture])
} finally {
	rmSync(directory, { recursive: true, force: true })
}
