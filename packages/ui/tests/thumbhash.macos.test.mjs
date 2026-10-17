import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { macOSExecutable } from '../../cli/src/macos/executables.ts'
import { hostBundle, hostRoot } from '../../cli/src/macos/jsc-host/runtime.ts'

// Real AppKit/JSC host: NSBitmapImageRep decode, CGBitmapContext scale to
// ≤100px, premultiplied readback, JS unpremultiply, reference-port encode.
// No window, view, or desktop input — data flow only.
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-thumbhash-runtime-'))

// 16x12 opaque gradient PNG + the hash the reference encoder produces over
// its exact pixels; 8x8 alpha ramp + reference hash (premultiply round-trip
// is not byte-exact, so alpha is compared by decoded-image distance).
const GRADIENT_PNG =
	'iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAYAAABr5z2BAAADTklEQVR4AQBBAL7/AAAAAP8RAAn/IgAS/zMAG/9EACT/VQAt/2YANv93AD//iABI/5kAUf+qAFr/uwBj/8wAbP/dAHX/7gB+//8Ah/8AQQC+/wAAFQn/ERUS/yIVG/8zFST/RBUt/1UVNv9mFT//dxVI/4gVUf+ZFVr/qhVj/7sVbP/MFXX/3RV+/+4Vh///FZD/AEEAvv8AACoS/xEqG/8iKiT/Myot/0QqNv9VKj//ZipI/3cqUf+IKlr/mSpj/6oqbP+7KnX/zCp+/90qh//uKpD//yqZ/wBBAL7/AAA/G/8RPyT/Ij8t/zM/Nv9EPz//VT9I/2Y/Uf93P1r/iD9j/5k/bP+qP3X/uz9+/8w/h//dP5D/7j+Z//8/ov8AQQC+/wAAVCT/EVQt/yJUNv8zVD//RFRI/1VUUf9mVFr/d1Rj/4hUbP+ZVHX/qlR+/7tUh//MVJD/3VSZ/+5Uov//VKv/AEEAvv8AAGkt/xFpNv8iaT//M2lI/0RpUf9VaVr/Zmlj/3dpbP+IaXX/mWl+/6pph/+7aZD/zGmZ/91pov/uaav//2m0/wBBAL7/AAB+Nv8Rfj//In5I/zN+Uf9Eflr/VX5j/2Z+bP93fnX/iH5+/5l+h/+qfpD/u36Z/8x+ov/dfqv/7n60//9+vf8AQQC+/wAAkz//EZNI/yKTUf8zk1r/RJNj/1WTbP9mk3X/d5N+/4iTh/+Zk5D/qpOZ/7uTov/Mk6v/3ZO0/+6Tvf//k8b/AEEAvv8AAKhI/xGoUf8iqFr/M6hj/0SobP9VqHX/Zqh+/3eoh/+IqJD/maiZ/6qoov+7qKv/zKi0/92ovf/uqMb//6jP/wBBAL7/AAC9Uf8RvVr/Ir1j/zO9bP9EvXX/Vb1+/2a9h/93vZD/iL2Z/5m9ov+qvav/u720/8y9vf/dvcb/7r3P//+92P8AQQC+/wAA0lr/EdJj/yLSbP8z0nX/RNJ+/1XSh/9m0pD/d9KZ/4jSov+Z0qv/qtK0/7vSvf/M0sb/3dLP/+7S2P//0uH/AUEAvv8AAOdj/xHnbP8i53X/M+d+/0Tnh/9V55D/ZueZ/3fnov+I56v/mee0/6rnvf+758b/zOfP/93n2P/u5+H//+fq/7mpzVA4zGGPAAAAAElFTkSuQmCC'
const GRADIENT_HASH = 'thumbhash:HhgODZxwd3dxeHiHiHiHiIuAB+eI'
const ALPHA_PNG =
	'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAABNklEQVR4AQAhAN7/AMg8WkC+PFpYtDxacKo8WoigPFqgljxauIw8WtCCPFroACEA3v8AyFBaQL5QWli0UFpwqlBaiKBQWqCWUFq4jFBa0IJQWugAIQDe/wDIZFpAvmRaWLRkWnCqZFqIoGRaoJZkWriMZFrQgmRa6AAhAN7/AMh4WkC+eFpYtHhacKp4WoigeFqglnhauIx4WtCCeFroACEA3v8AyIxaQL6MWli0jFpwqoxaiKCMWqCWjFq4jIxa0IKMWugAIQDe/wDIoFpAvqBaWLSgWnCqoFqIoKBaoJagWriMoFrQgqBa6AAhAN7/AMi0WkC+tFpYtLRacKq0WoigtFqglrRauIy0WtCCtFroASEA3v8AyMhaQL7IWli0yFpwqshaiKDIWqCWyFq4jMha0ILIWugZd4VBWb9+hAAAAABJRU5ErkJggg=='
const ALPHA_HASH = 'thumbhash:nzmGFQopa3iQh3h4iGuQt/aGcId4iIeIhw=='

try {
	await writeFile(join(directory, 'gradient.png'), Buffer.from(GRADIENT_PNG, 'base64'))

	// hash-image.ts is dependency-free; thumbhash.macos.ts imports only it.
	const transpile = (source) =>
		ts.transpile(source, {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		})

	const leaves = await Promise.all(
		['hash-image', 'thumbhash.macos'].map(async (base) => {
			const source = await readFile(new URL(`../src/${base}.ts`, import.meta.url), 'utf8')
			return `registry[${JSON.stringify(`./${base}`)}] = (() => { const exports = {}; ${transpile(
				source,
			)}; return exports; })();`
		}),
	)

	const script = join(directory, 'fixture.cjs')
	await writeFile(
		script,
		`const registry = (() => { const registry = {}; const require = (spec) => { const found = registry[spec]; if (!found) { throw new Error('unsupported fixture require: ' + spec); } return found; }
${leaves.join('\n')}
	return registry; })();
NSApplication.sharedApplication;
const hashImage = registry['./hash-image'];
const thumbHashUri = registry['./thumbhash.macos'].thumbHashUri;
let assertions = 0;
function check(value, message) { assertions++; if (!value) throw new Error(message); }
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64decode(input) {
	const clean = input.replace(/=+$/, '');
	const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
	for (let i = 0, j = 0; i < clean.length; i += 4, j += 3) {
		const chunk = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i+1]) << 12) | ((B64.indexOf(clean[i+2]) & 63) << 6) | (B64.indexOf(clean[i+3]) & 63);
		out[j] = (chunk >> 16) & 255;
		if (j + 1 < out.length) { out[j+1] = (chunk >> 8) & 255; }
		if (j + 2 < out.length) { out[j+2] = chunk & 255; }
	}
	return out;
}
function maxDelta(actual, expected) {
	const a = hashImage.thumbHashToRGBA(b64decode(actual.slice(10)));
	const b = hashImage.thumbHashToRGBA(b64decode(expected.slice(10)));
	if (!a || !b || a.w !== b.w || a.h !== b.h) { return Infinity; }
	let max = 0;
	for (let i = 0; i < a.rgba.length; i++) { max = Math.max(max, Math.abs(a.rgba[i] - b.rgba[i])); }
	return max;
}
setTimeout(async () => {
	try {
		const gradient = await thumbHashUri('data:image/png;base64,${GRADIENT_PNG}');
		check(gradient === '${GRADIENT_HASH}', 'data URI decodes to reference thumbhash');
		const fromFile = await thumbHashUri(${JSON.stringify(join(directory, 'gradient.png'))});
		check(fromFile === '${GRADIENT_HASH}', 'file path decodes to reference thumbhash');
		const alpha = await thumbHashUri('data:image/png;base64,${ALPHA_PNG}');
		check(alpha.startsWith('thumbhash:'), 'alpha produces a thumbhash URI');
		// Premultiply round-trip quantum at min alpha 64: 255/64 ≈ 4/channel.
		check(maxDelta(alpha, '${ALPHA_HASH}') <= 8, 'alpha decodes within premultiply tolerance');
		let rejected = false;
		try { await thumbHashUri('data:image/png;base64,aGVsbG8='); } catch (error) { rejected = /decode/.test(error.message); }
		check(rejected, 'undecodable src rejects');
		console.log('APPKIT_THUMBHASH_RUNTIME_OK: ' + assertions + ' assertions; real AppKit decode + CGContext readback');
	} catch (error) {
		console.error('APPKIT_THUMBHASH_RUNTIME_FAIL: ' + (error && error.message) + ' @ ' + error.stack);
	} finally {
		globalThis.__xplatStopHost();
	}
}, 0);
`,
	)

	const bootstrap = join(directory, 'bootstrap.js')
	await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js')))
	const result = spawnSync(
		await macOSExecutable(packageRoot, 'macos-arm64/host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			script,
			join(hostBundle, 'metadata.nsmd'),
			bootstrap,
		],
		{ cwd: directory, encoding: 'utf8', timeout: 15_000 },
	)

	const output = result.stdout + result.stderr
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /APPKIT_THUMBHASH_RUNTIME_FAIL/)
	assert.match(output, /APPKIT_THUMBHASH_RUNTIME_OK/)
	console.log(output.trim())
	console.log('Remote fetch, res://, and visual display remain unqualified.')
} finally {
	await rm(directory, { recursive: true, force: true })
}
