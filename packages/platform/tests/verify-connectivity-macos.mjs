// Non-visual real Network.framework + JavaScriptCore smoke. No network settings are changed.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.mjs'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.mjs'
import { macOSExecutable } from '../../cli/src/macos/executables.mjs'

const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(leaf, '../..')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/macos-connectivity-'))
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
await symlink(leaf, join(app, 'node_modules/@octane-xplat/platform'))
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: 'connectivity-fixture',
		private: true,
		dependencies: { '@octane-xplat/platform': '0.10.0' },
	}),
)

const executable = join(app, 'native-connectivity')
const compiled = spawnSync(
	'xcrun',
	[
		'clang',
		'-fobjc-arc',
		'-fblocks',
		'-framework',
		'Foundation',
		'-framework',
		'Network',
		'-I',
		join(leaf, 'platforms/macos/include'),
		join(leaf, 'tests/native-connectivity.m'),
		'-o',
		executable,
	],
	{ encoding: 'utf8', timeout: 30_000 },
)

assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr)
const mapped = spawnSync(executable, [], { encoding: 'utf8', timeout: 10_000 })
assert.equal(mapped.status, 0, mapped.stdout + mapped.stderr)
assert.match(mapped.stdout, /NATIVE_CONNECTIVITY_MAPPING_OK/)
console.log(mapped.stdout.trim())
const artifact = await buildMacOSNative(app)
assert.deepEqual(artifact.leaves, ['@octane-xplat/platform'])
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const script = join(app, 'fixture.cjs')
const source = ts.transpile(await readFile(join(leaf, 'src/connectivity.macos.ts'), 'utf8'), {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

await writeFile(
	script,
	`var app = NSApplication.sharedApplication; var exports = {};\n${source}\n
function check(state) {
  if (state.supported !== true) throw Error('Real host did not provide a Network path sample');
  if (typeof state.online !== 'boolean') throw Error('Missing online status');
  if (!state.online && state.type !== 'none') throw Error('Offline path must have type none');
  console.log('NATIVE_CONNECTIVITY_SAMPLE ' + JSON.stringify(state));
}
var api = exports.connectivity;
check(api.getState());
var initial = 0;
var callbacks = 0;
var stop = api.subscribe(function(state) { check(state); callbacks++; });
initial = callbacks;
if (initial !== 1) throw Error('Initial subscription notification missing');
setTimeout(function() {
  if (callbacks <= initial) throw Error('Native monitor did not deliver an initial path callback');
  stop(); stop();
  var before = callbacks;
  var restarted = 0;
  var stopAgain = api.subscribe(function(state) { check(state); restarted++; });
  setTimeout(function() {
    stopAgain();
    if (callbacks !== before) throw Error('Cancelled subscription delivered a late callback');
    if (restarted < 2) throw Error('Restarted monitor did not deliver a path callback');
    var settled = restarted;
    setTimeout(function() {
      if (restarted !== settled) throw Error('Stopped monitor delivered a callback');
      console.log('MACOS_CONNECTIVITY_OK: real read, main-thread callbacks, cancellation and restart');
      globalThis.__xplatStopHost();
    }, 100);
  }, 1000);
}, 1000);
`,
)

const result = spawnSync(
	await macOSExecutable(resolve(repo, 'apps/macos'), 'macos-arm64/host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		script,
		artifact.metadata,
		bootstrap,
	],
	{ cwd: app, encoding: 'utf8', timeout: 15_000 },
)

const output = result.stdout + result.stderr
assert.equal(result.status, 0, output)
assert.match(output, /MACOS_CONNECTIVITY_OK/)
console.log(output.trim())
console.log(
	'Physical offline/reconnect, VPN/Bluetooth, and signed sandbox policy remain manual checks.',
)
