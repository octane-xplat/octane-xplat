// Native graph/metadata qualification only; does not request OS location access.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'

import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'
const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = await mkdtemp(join(tmpdir(), 'xplat-location-host-'))
try {
	await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
	await symlink(leaf, join(app, 'node_modules/@octane-xplat/geolocation'))
	await writeFile(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'location-fixture',
			dependencies: { '@octane-xplat/geolocation': '0.10.0' },
		}),
	)

	const artifact = await buildMacOSNative(app)
	assert.equal(artifact.leaves.length, 1)
	const bootstrap = join(app, 'bootstrap.js')
	await writeNativeBootstrap(artifact, bootstrap)
	const script = join(app, 'fixture.cjs')
	await writeFile(
		script,
		`
if (typeof XplatGeolocation === 'undefined') throw Error('Geolocation metadata missing');
if (typeof XplatGeolocation.ensure !== 'function' || typeof XplatGeolocation.positionTimeoutMaximumAgeCompletion !== 'function') throw Error('Selectors missing');
if (XplatGeolocation.isAvailable()) throw Error('Unconfigured command-line host must remain unsupported');
console.log('MACOS_GEOLOCATION_HOST_BOUNDARY_OK');
`,
	)

	const run = spawnSync(
		join(hostBundle, 'host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			script,
			artifact.metadata,
			bootstrap,
		],
		{ encoding: 'utf8', timeout: 10000 },
	)

	assert.equal(run.status, 0, run.stdout + run.stderr)
	assert.match(run.stdout + run.stderr, /MACOS_GEOLOCATION_HOST_BOUNDARY_OK/)
	console.log(
		'MACOS_GEOLOCATION_HOST_BOUNDARY_OK: compiled facade and selectors loaded; unconfigured host unsupported',
	)
} finally {
	await rm(app, { recursive: true, force: true })
}
