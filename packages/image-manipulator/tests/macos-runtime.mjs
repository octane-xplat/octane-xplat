import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { png, redsOf, checkOrientations } from './png-fixture.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = resolve(process.env.XPLAT_NATIVE_TEST_REPO ?? join(packageRoot, '../..'))
const requireRepo = createRequire(join(repoRoot, 'package.json'))
const ts = requireRepo('typescript')
const hostRoot = join(repoRoot, 'packages/cli/src/macos/jsc-host')
const bundle = join(hostRoot, 'prebuilt/macos')
const temporary = await mkdtemp(join(tmpdir(), 'xplat-image-native-'))

try {
	const orientations = JSON.parse(
		await readFile(join(packageRoot, 'tests/orientation-fixtures.json'), 'utf8'),
	)
	const image = join(temporary, 'source.png')
	await writeFile(image, png())
	const modules = []
	for (const name of ['types', 'geometry', 'backend.macos', 'core']) {
		const source = await readFile(join(packageRoot, 'src', `${name}.ts`), 'utf8')
		const code = ts.transpile(source, {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		})
		modules.push(
			`registry[${JSON.stringify(`./${name}`)}] = (() => { const exports = {}; ${code}; return exports })();`,
		)
	}
	// The existing native runtime/metadata is reused. No app window, screenshots,
	// platform rebuild, or mutations of the remote repository are needed.
	const fixture = join(temporary, 'fixture.cjs')
	await writeFile(
		fixture,
		`
(function () {
const registry = {};
const require = spec => {
  if (spec === '@octane-xplat/platform/macos') return globalThis;
  if (spec === '@octane-xplat/lib/capability') return { UnavailabilityError: class extends Error {} };
  if (!(spec in registry)) throw new Error('Unknown fixture import: ' + spec);
  return registry[spec];
};
${modules.join('\n')}
NSApplication.sharedApplication;
const { ImageManipulator, releaseImage } = registry['./core'].createImageManipulator(registry['./backend.macos'].backend);
const outputs = [];
const retained = [];
const contexts = [];
let assertions = 0;
function check(value, message) { assertions++; if (!value) throw new Error(message); }
function pixels(result) {
  const data = NSData.dataWithContentsOfURL(NSURL.URLWithString(result.uri));
  const bitmap = NSBitmapImageRep.imageRepWithData(data);
  return { width: bitmap.pixelsWide, height: bitmap.pixelsHigh, reds: result.base64 };
}
function near(actual, expected, message) {
  check(typeof actual === 'string', 'PNG base64 is present');
  console.log('IMAGE_PIXELS ' + JSON.stringify({ base64: actual, expected, message }));
}
async function save(ref, options = { format: 'png', base64: true }) {
  const result = await ref.saveAsync(options);
  outputs.push(result);
  const decoded = pixels(result);
  check(result.width === decoded.width && result.height === decoded.height, 'encoded dimensions');
  return { result, ...decoded };
}
setTimeout(async () => {
  try {
    check(ImageManipulator.supported, 'backend availability');
    const ctx = ImageManipulator.manipulate(${JSON.stringify(image)}); contexts.push(ctx);
    const source = await ctx.renderAsync(); retained.push(source);
    near((await save(source)).reds, [20,40,60,80,100,120], 'source pixels');
    ctx.crop({ originX: 1, originY: 0, width: 2, height: 2 }).rotate(90);
    const crop = await ctx.renderAsync(); retained.push(crop);
    near((await save(crop)).reds, [100,40,120,60], 'crop then clockwise rotation');
    ctx.reset().flip('vertical');
    const flipped = await ctx.renderAsync(); retained.push(flipped);
    near((await save(flipped)).reds, [80,100,120,20,40,60], 'vertical flip');
    ctx.reset().resize({ width: 6 });
    const resized = await ctx.renderAsync(); retained.push(resized);
    const resizedOutput = await save(resized);
    check(resizedOutput.width === 6 && resizedOutput.height === 4, 'aspect resize');
    ctx.release();
    near((await save(source)).reds, [20,40,60,80,100,120], 'snapshot survives context disposal');
    const child = ImageManipulator.manipulate(source).flip('horizontal'); contexts.push(child);
    source.release();
    const derived = await child.renderAsync(); retained.push(derived);
    near((await save(derived)).reds, [60,40,20,120,100,80], 'ref reuse after original release');
    const jpeg = await save(derived, { format: 'jpeg', compress: 0.8, base64: true });
    check(jpeg.result.base64.startsWith('/9j/'), 'JPEG encoding/base64');
    let rejected = false;
    try { await derived.saveAsync({ format: 'webp' }); } catch { rejected = true; }
    check(rejected, 'unavailable WebP rejects');
    const first = outputs[0];
    releaseImage(first); releaseImage(first);
    check(!NSFileManager.defaultManager.fileExistsAtPath(NSURL.URLWithString(first.uri).path), 'output cleanup is idempotent');
    for (const fixture of ${JSON.stringify(orientations)}) {
      const context = ImageManipulator.manipulate(fixture.source); contexts.push(context);
      const ref = await context.renderAsync(); retained.push(ref);
      const result = await ref.saveAsync({ format: 'png', base64: true }); outputs.push(result);
      console.log('IMAGE_ORIENTATION ' + JSON.stringify({ orientation: fixture.orientation, width: result.width, height: result.height, base64: result.base64 }));
    }
    console.log('IMAGE_APPKIT_OK ' + assertions + ' assertions; real decoding, bitmap transforms, PNG/JPEG encoding and files');
  } catch (error) {
    console.error('IMAGE_APPKIT_FAIL ' + error.message + ' @ ' + error.stack);
  } finally {
    for (const ref of retained) ref.release();
    for (const ctx of contexts) ctx.release();
    for (const result of outputs) releaseImage(result);
    globalThis.__xplatStopHost();
  }
}, 0);
})();
`,
	)
	const bootstrap = join(temporary, 'bootstrap.js')
	await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js')))
	const manifest = JSON.parse(await readFile(join(hostRoot, 'prebuilt/manifest.json'), 'utf8'))
	const bytes = await readFile(join(bundle, 'host'))
	assert.equal(
		createHash('sha256').update(bytes).digest('hex'),
		manifest.sha256['macos/host'],
	)
	const executable = join(temporary, 'host')
	await writeFile(executable, bytes, { mode: 0o755 })
	const result = spawnSync(
		executable,
		[
			join(bundle, 'NativeScript.framework/Versions/A/NativeScript'),
			fixture,
			join(bundle, `metadata.macos.${process.arch === 'x64' ? 'x86_64' : 'arm64'}.nsmd`),
			bootstrap,
		],
		{ cwd: temporary, encoding: 'utf8', timeout: 20_000 },
	)
	const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /IMAGE_APPKIT_FAIL/)
	assert.match(output, /IMAGE_APPKIT_OK/)
	const samples = output.split('\n').filter((line) => line.startsWith('IMAGE_PIXELS '))
	assert.equal(samples.length, 5)
	for (const line of samples) {
		const sample = JSON.parse(line.slice('IMAGE_PIXELS '.length))
		const actual = redsOf(sample.base64)
		assert.ok(
			actual.length === sample.expected.length &&
				actual.every((value, index) => Math.abs(value - sample.expected[index]) <= 1),
			`${sample.message}: ${JSON.stringify(actual)}`,
		)
	}
	checkOrientations(
		output
			.split('\n')
			.filter((line) => line.startsWith('IMAGE_ORIENTATION '))
			.map((line) => JSON.parse(line.slice('IMAGE_ORIENTATION '.length))),
	)
	console.log(
		output
			.split('\n')
			.filter((line) => !line.startsWith('IMAGE_PIXELS ') && !line.startsWith('IMAGE_ORIENTATION '))
			.join('\n')
			.trim(),
	)
	console.log('Eight EXIF orientations passed independently decoded pixel and dimension checks.')
} finally {
	await rm(temporary, { recursive: true, force: true })
}
