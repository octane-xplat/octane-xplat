#!/usr/bin/env node
// WebKitGTK camera conformance driver.
//
// Builds the conformance harness page with the real Linux suffix resolution
// chain and runs it inside the shipped GJS/WebKitGTK host (--self-test) under
// xvfb, with WebKit's mock capture devices and the host's allow permission
// policy. Three phases share an isolated XDG profile:
//
//   record  — permission grant, live preview, capabilities, silent+audio
//             MP4/WebM capture, duration limit, hidden/background
//             interruption, preview detach, destinationFileUrl commit,
//             same-origin playback, disposal, then an in-page reload that
//             reopens the stored output through a fresh session.
//   reopen  — a second host process reopens the phase-1 output, proving
//             the file survives recorder disposal AND app restart.
//   deny    — a fresh profile with XPLAT_MEDIA_POLICY=deny asserts the
//             session reports blocked instead of fabricating a grant.
//
// Requires a Linux host with gjs + WebKitGTK 6.0 + xvfb and the GStreamer
// recording plugins for at least one container (video/mp4 on Ubuntu 24.04
// needs h264/aac encoders+parsers; video/webm needs GStreamer >= 1.24.9).

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const harnessDir = join(packageRoot, 'tests', 'webkitgtk')
const hostScript = join(repoRoot, 'packages/cli/src/linux/host/gjs-host.js')
const conformanceScript = join(harnessDir, 'camera-conformance.linux.js')

if (process.platform !== 'linux') {
	throw new Error('WebKitGTK conformance requires a Linux host with gjs and WebKitGTK 6.0.')
}

for (const binary of ['gjs', 'xvfb-run', 'dbus-run-session']) {
	try {
		execFileSync('which', [binary], { stdio: 'pipe' })
	} catch {
		throw new Error(`${binary} is required for WebKitGTK conformance`)
	}
}

// Build the harness bundle.
const require = createRequire(join(packageRoot, 'package.json'))
const vitePackage = JSON.parse(readFileSync(require.resolve('vite/package.json'), 'utf8'))
const viteBin = join(dirname(require.resolve('vite/package.json')), vitePackage.bin.vite)
const bundleDir = mkdtempSync(join(tmpdir(), 'camera-webkitgtk-bundle-'))
execFileSync(
	process.execPath,
	[viteBin, 'build', '--config', join(harnessDir, 'vite.config.ts'), '--outDir', bundleDir],
	{ cwd: harnessDir, stdio: 'inherit' },
)

assert.ok(existsSync(join(bundleDir, 'index.html')), 'harness bundle built')

const runPhase = (label, extraEnv = {}, args = []) => {
	const xdg = mkdtempSync(join(tmpdir(), `camera-xdg-${label}-`))
	const result = spawnSync(
		'xvfb-run',
		['-a', 'dbus-run-session', '--', 'gjs', hostScript, '--bundle', bundleDir, '--self-test', ...args],
		{
			env: {
				...process.env,
				XDG_DATA_HOME: xdg,
				XDG_CONFIG_HOME: xdg,
				XPLAT_CAMERA_MOCK: '1',
				XPLAT_MEDIA_POLICY: 'allow',
				XPLAT_SELFTEST_SCRIPT: conformanceScript,
				GSK_RENDERER: 'cairo',
				LIBGL_ALWAYS_SOFTWARE: '1',
				...extraEnv,
			},
			encoding: 'utf8',
			timeout: 240_000,
			maxBuffer: 32 * 1024 * 1024,
		},
	)

	process.stdout.write(result.stdout ?? '')
	process.stderr.write(result.stderr ?? '')
	if (result.error) {
		throw result.error
	}

	assert.equal(result.status, 0, `${label} host exited ${result.status}`)
	const selftest = (result.stdout ?? '').match(/SELFTEST_RESULT (\{.*\})/)
	assert.ok(selftest, `${label} produced no SELFTEST_RESULT`)
	const parsed = JSON.parse(selftest[1])
	assert.deepEqual(parsed.failed, [], `${label} failures: ${parsed.failed.join(', ')}`)
	return { stdout: result.stdout ?? '', xdg }
}

// Phase 1 — record + in-page reload reopen.
const record = runPhase('record')
const outputLine = record.stdout.match(/CAMERA_OUTPUT (\{.*\})/)
assert.ok(outputLine, 'record phase produced no CAMERA_OUTPUT')
const output = JSON.parse(outputLine[1])
assert.equal(output.kind, 'nativeFile')
assert.ok(output.fileUrl.startsWith('file://'))

// Phase 2 — a fresh host process reopens the phase-1 output. The movie lives
// under the app data dir, so the phases share one XDG profile; this proves
// the clip survives recorder disposal AND a full app restart.
runPhase(
	'reopen',
	{ XDG_DATA_HOME: record.xdg, XDG_CONFIG_HOME: record.xdg },
	[`xplat://localhost/?phase=reopen&output=${encodeURIComponent(JSON.stringify(output))}`],
)

// Phase 3 — denial policy on a clean profile reports blocked honestly.
runPhase('deny', { XPLAT_MEDIA_POLICY: 'deny' }, ['xplat://localhost/?phase=deny'])

console.log('WebKitGTK camera conformance passed (record, reload-reopen, restart-reopen, deny).')
