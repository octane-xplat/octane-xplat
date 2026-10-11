import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'darwin') {
	throw new Error('The photo hardware checks require macOS')
}

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'xplat-photo-hardware-'))
const leaf = (name) => join(root, 'platforms/macos/src', name)
const sources = [
	leaf('CameraOwnership.swift'),
	leaf('PhotoCaptureLifecycle.swift'),
	leaf('XplatCameraHost.swift'),
	leaf('XplatPhotoCaptureSheet.swift'),
	join(root, 'tests/macos', 'photo-hardware.swift'),
]

try {
	// Two variants share the same production code: a binary that declares
	// NSCameraUsageDescription exercises the granted-configure path, and one
	// without it exercises the undeclared non-granted settle. Neither mutates
	// TCC state or answers an OS prompt.
	const plist = join(dir, 'Info.plist')
	writeFileSync(
		plist,
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
			'<plist version="1.0"><dict>' +
			'<key>NSCameraUsageDescription</key><string>Photo hardware checks.</string>' +
			'</dict></plist>\n',
	)

	for (const [fixture, extra] of [
		['declared', ['-Xlinker', '-sectcreate', '-Xlinker', '__TEXT', '-Xlinker', '__info_plist', '-Xlinker', plist]],
		['undeclared', []],
	]) {
		// Each binary gets its own directory: Bundle.main can read a sibling
		// Info.plist, which would leak the declaration between variants.
		const output = join(dir, fixture, 'photo-hardware')
		mkdirSync(join(dir, fixture), { recursive: true })
		execFileSync('xcrun', ['swiftc', ...sources, ...extra, '-o', output], { stdio: 'inherit' })
		execFileSync(output, [], { stdio: 'inherit', timeout: 120_000 })
	}
} finally {
	rmSync(dir, { recursive: true, force: true })
}
