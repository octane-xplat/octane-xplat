import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	buildMacOSNative,
	discoverMacOSNative,
	writeNativeBootstrap,
} from '../src/macos/native.mjs'

import { hostBundle } from '../src/macos/jsc-host/runtime.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const scratch = join(repo, 'research')
await mkdir(scratch, { recursive: true })
const app = await mkdtemp(join(scratch, 'macos-native-'))
const fixtures = join(repo, 'packages/cli/test/fixtures/macos-native-leaves')
await mkdir(join(app, 'node_modules'))
for (const name of ['c', 'objc', 'swift', 'zig']) {
	const root = join(app, `leaf-${name}`)
	await cp(join(fixtures, name), root, { recursive: true })
	const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	await symlink(root, join(app, 'node_modules', manifest.name))
}

// C is transitive, with an isolated pnpm-style dependency link below ObjC.
await mkdir(join(app, 'leaf-objc/node_modules'))
await symlink(join(app, 'leaf-c'), join(app, 'leaf-objc/node_modules/xplat-native-c-fixture'))
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: 'native-app',
		dependencies: {
			'xplat-native-objc-fixture': '1.0.0',
			'xplat-native-swift-fixture': '1.0.0',
			'xplat-native-zig-fixture': '1.0.0',
		},
	}),
)

assert.equal(discoverMacOSNative(app).leaves.length, 4)
const [first, concurrent] = await Promise.all([buildMacOSNative(app), buildMacOSNative(app)])
assert.equal(first.key, concurrent.key)
assert.equal((await buildMacOSNative(app)).cached, true)
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(first, bootstrap)
const script = join(app, 'probe.cjs')
await writeFile(
	script,
	`
if (xplat_c_value() !== 40 || XplatObjCProbe.value() !== 42 || XplatSwiftProbe.value() !== 43 || xplat_zig_value() !== 44) throw Error('Native values differ');
if (typeof NSView === 'undefined' || typeof sqlite3_open !== 'function' || typeof dlopen !== 'function') throw Error('SDK surface lost');
if (!dlopen('/usr/lib/libsqlite3.dylib', 2)) throw Error('sqlite dylib missing');
const ref = new interop.Reference();
if (sqlite3_open(':memory:', ref) !== 0) throw Error('sqlite regression');
sqlite3_close(ref.value);
console.log('MACOS_NATIVE_LANGUAGES_OK');
`,
)

const result = spawnSync(
	join(hostBundle, 'host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		script,
		first.metadata,
		bootstrap,
	],
	{ encoding: 'utf8', timeout: 10_000 },
)

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
assert.match(result.stderr, /MACOS_NATIVE_LANGUAGES_OK/)
const source = join(app, 'leaf-c/platforms/macos/src/XplatC.c')
await writeFile(
	source,
	'#include "XplatC.h"\nint xplat_c_value(void) { return XPLAT_VALUE + 1; }\n',
)

const changed = await buildMacOSNative(app)
assert.notEqual(changed.key, first.key)
assert.equal(changed.cached, false)
await writeFile(source, 'int xplat_c_value(void) { this is not valid C; }\n')
await assert.rejects(buildMacOSNative(app), /xplat-native-c-fixture: compile/)
await writeFile(source, '#include "XplatC.h"\nint xplat_c_value(void) { return XPLAT_VALUE; }\n')
await writeFile(
	join(app, 'leaf-c/platforms/macos/include/Invalid.h'),
	'#error invalid unused public header\n',
)

await assert.rejects(
	buildMacOSNative(app),
	/validate public headers.*[\s\S]*invalid unused public header/,
)

// A failed build does not damage the last successful artifact.
assert.equal(
	(await readFile(join(first.directory, 'manifest.json'), 'utf8')).includes(first.key),
	true,
)

console.log(
	`macOS native compilation, concurrency, cache, invalidation, and failure preservation passed: ${app}`,
)
