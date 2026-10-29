// Isolated intercepted-picker/metadata fixture. Never opens OS share UI or sends content.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(leaf, '../..')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/macos-share-'))
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
await symlink(leaf, join(app, 'node_modules/@octane-xplat/share'))
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: 'share-fixture',
		dependencies: { '@octane-xplat/share': '0.18.0' },
	}),
)

const executable = join(app, 'native-picker')
const compiled = spawnSync(
	'xcrun',
	[
		'clang',
		'-fobjc-arc',
		'-fblocks',
		'-framework',
		'Foundation',
		'-framework',
		'AppKit',
		'-I',
		join(leaf, 'platforms/macos/include'),
		join(leaf, 'platforms/macos/src/XplatShare.m'),
		join(leaf, 'tests/native-picker.m'),
		'-o',
		executable,
	],
	{ encoding: 'utf8', timeout: 30_000 },
)

assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr)
const dispatched = spawnSync(executable, [], { encoding: 'utf8', timeout: 10_000 })
assert.equal(dispatched.status, 0, dispatched.stdout + dispatched.stderr)
assert.match(dispatched.stdout, /NATIVE_SHARE_CONTRACT_OK/)
console.log(dispatched.stdout.trim())
const artifact = await buildMacOSNative(app)
assert.deepEqual([...artifact.leaves].sort(), [
	'@octane-xplat/platform',
	'@octane-xplat/share',
])

const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const script = join(app, 'fixture.cjs')
await writeFile(
	script,
	`
if (typeof XplatShare === 'undefined' || typeof XplatShare.shareKindValueSubjectCompletion !== 'function') throw Error('Share selector missing');
// This plain host has no NSApplication/presenter. Do not create one or show UI.
let outcome = null;
XplatShare.shareKindValueSubjectCompletion('text', 'fixture', 'subject', (result) => {
    if (!NSThread.isMainThread) throw Error('Share callback must reach main thread');
    outcome = String(result);
});
const deadline = Date.now() + 3000;
while (outcome === null && Date.now() < deadline)
    NSRunLoop.currentRunLoop.runUntilDate(NSDate.dateWithTimeIntervalSinceNow(0.01));
if (outcome !== 'unavailable') throw Error('No-presenter share must be unavailable');
console.log('MACOS_SHARE_CALLBACK_OK');
`,
)

const result = spawnSync(
	join(hostBundle, 'host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		script,
		artifact.metadata,
		bootstrap,
	],
	{ encoding: 'utf8', timeout: 10_000 },
)

assert.equal(result.status, 0, result.stdout + result.stderr)
assert.match(result.stdout + result.stderr, /MACOS_SHARE_CALLBACK_OK/)
console.log('AppKit share metadata and no-presenter callback checked; no OS share UI or delivery evidence.')
