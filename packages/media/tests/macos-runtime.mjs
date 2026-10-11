import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'
import ts from 'typescript'
import { macOSExecutable } from '../../cli/src/macos/executables.mjs'
import { hostBundle, hostRoot } from '../../cli/src/macos/jsc-host/runtime.mjs'

// No panel, window, image view, camera, Photos access or desktop input.
// Actual AppKit image decoding/JPEG encoding and Foundation IO; only the panel is injected.
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-macos-picker-runtime-'))

function png(width, height) {
	const chunk = (name, data) => {
		const type = Buffer.from(name)
		const length = Buffer.alloc(4)
		length.writeUInt32BE(data.length)
		let crc = 0xffffffff
		for (const byte of Buffer.concat([type, data])) {
			crc ^= byte
			for (let bit = 0; bit < 8; bit++) {
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
			}
		}

		const checksum = Buffer.alloc(4)
		checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
		return Buffer.concat([length, type, data, checksum])
	}

	const header = Buffer.alloc(13)
	header.writeUInt32BE(width)
	header.writeUInt32BE(height, 4)
	header[8] = 8
	header[9] = 2 // RGB; no generated image is opened or visually inspected.
	const pixels = Buffer.alloc(height * (1 + width * 3), 80)
	for (let row = 0; row < height; row++) {
		pixels[row * (1 + width * 3)] = 0
	}

	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(pixels)),
		chunk('IEND', Buffer.alloc(0)),
	])
}

try {
	const sources = [join(directory, 'landscape.png'), join(directory, 'portrait.png')]
	await writeFile(sources[0], png(6, 4))
	await writeFile(sources[1], png(4, 6))
	const invalid = join(directory, 'invalid.png')
	await writeFile(invalid, 'invalid image bytes')
	const modules = await Promise.all(
		['media', 'files'].map(async (name) => {
			const source = await readFile(
				new URL(`../../${name}/src/${name}.macos.ts`, import.meta.url),
				'utf8',
			)

			return `const ${name} = (() => { const exports = {}; ${ts.transpile(source, {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
			})}; return exports.${name}; })();`
		}),
	)

	const script = join(directory, 'fixture.cjs')
	await writeFile(
		script,
		`${modules.join('\n')}
NSApplication.sharedApplication;
const queue = [];
Object.defineProperty(globalThis, 'NSOpenPanel', { configurable: true, value: { openPanel() {
  const selection = queue.shift();
  return { URL: selection.urls[0], URLs: NSArray.arrayWithArray(selection.urls),
    runModal() { return selection.cancel ? 0 : 1; } };
} } });
const sourcePaths = ${JSON.stringify(sources)};
const sourceURLs = sourcePaths.map(path => NSURL.fileURLWithPath(path));
const invalidURL = NSURL.fileURLWithPath(${JSON.stringify(invalid)});
const retained = [];
let assertions = 0;
function check(value, message) { assertions++; if (!value) throw new Error(message); }
function verify(image, width, height) {
  retained.push(image);
  check(image.uri.startsWith(String(NSFileManager.defaultManager.temporaryDirectory.path)), 'temporary path');
  check(!sourcePaths.includes(image.uri), 'original path is not returned');
  const data = NSData.dataWithContentsOfFile(image.uri);
  const bitmap = NSBitmapImageRep.imageRepWithData(data);
  check(bitmap.pixelsWide === width && bitmap.pixelsHigh === height, 'pixel dimensions/aspect ratio');
  const bytes = new Uint8Array(interop.bufferFromData(data));
  check(bytes[0] === 255 && bytes[1] === 216, 'JPEG signature');
  const payload = NSData.alloc().initWithBase64EncodedStringOptions(image.dataUrl.split(',')[1], 0);
  check(payload.isEqualToData(data), 'file bytes equal data URL');
}
setTimeout(async () => {
  try {
    queue.push({ urls: [], cancel: true }, { urls: [], cancel: true });
    check(await media.pickImage() === null, 'single cancel');
    check((await media.pickImages()).length === 0, 'multiple cancel');
    queue.push({ urls: [sourceURLs[0]] });
    const first = await media.pickImage();
    check(first.name === 'landscape.png', 'single name');
    verify(first, 6, 4);
    queue.push({ urls: sourceURLs });
    const multiple = await media.pickImages();
    check(multiple.length === 2, 'multiple count');
    verify(multiple[0], 6, 4);
    verify(multiple[1], 4, 6);
    check(new Set(retained.map(image => image.uri)).size === 3, 'repeated outputs unique');
    queue.push({ urls: [sourceURLs[0], invalidURL] });
    let rejected = false;
    try { await media.pickImages(); } catch (error) { rejected = /decode/.test(error.message); }
    check(rejected, 'invalid batch rejects');
    check(globalThis.__xplatTemporaryFiles.size === 3, 'failed batch leaves no owned output');
    for (const image of retained) { files.release(image); check(!NSFileManager.defaultManager.fileExistsAtPath(image.uri), 'preview released'); }
    check(globalThis.__xplatTemporaryFiles.size === 0, 'ownership cleared');
    check(sourcePaths.every(path => NSFileManager.defaultManager.fileExistsAtPath(path)), 'originals retained');
    console.log('APPKIT_PICKER_CODEC_OK: ' + assertions + ' assertions; injected panel; actual PNG/JPEG/file bridge');
  } catch (error) {
    console.error('APPKIT_PICKER_CODEC_FAIL: ' + error.stack);
  } finally {
    for (const uri of Array.from(globalThis.__xplatTemporaryFiles || [])) {
      files.release({ uri });
    }
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
	assert.doesNotMatch(output, /APPKIT_PICKER_CODEC_FAIL/)
	assert.match(output, /APPKIT_PICKER_CODEC_OK/)
	console.log(output.trim())
	console.log(
		'Real panel selection, sandbox scope, HEIC/orientation and visual display remain unqualified.',
	)
} finally {
	await rm(directory, { recursive: true, force: true })
}
