import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'
import ts from 'typescript'
import { macOSExecutable } from '../../cli/src/macos/executables.ts'
import {
	macOSHostArch,
	hostBundle,
	hostRoot,
} from '../../cli/src/macos/jsc-host/runtime.ts'

// No panel, window, image view, camera, Photos access or desktop input.
// Actual AppKit image decoding/JPEG encoding and Foundation IO; the panel and
// the photo sheet class are injected — no OS permission or camera hardware.
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
	// Transpile each AppKit leaf in dependency order and give CommonJS output a
	// sibling-only require: the JSC shim allows no relative requires.
	const transpileOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	}

	const leaves = await Promise.all(
		[
			['media', 'photo-capture.macos'],
			['media', 'media.macos'],
			['files', 'file-types.macos'],
			['files', 'file-pick-filter.macos'],
			['files', 'file-bytes'],
			['files', 'files.macos'],
		].map(async ([pkg, base]) => {
			const source = await readFile(new URL(`../../${pkg}/src/${base}.ts`, import.meta.url), 'utf8')

			return `registry[${JSON.stringify(`./${base}`)}] = (() => { const exports = {}; ${ts.transpile(
				source,
				transpileOptions,
			)}; return exports; })();`
		}),
	)

	const modules = [
		`const registry = (() => { const registry = {}; const require = (spec) => { const found = registry[spec]; if (!found) { throw new Error('unsupported fixture require: ' + spec); } return found; };`,
		// The camera leaf is imported as a real dependency: stand in a fake
		// sheet class with the same surface, recorded events, caller replies.
		`registry['@octane-xplat/camera/photo-sheet.macos'] = { XplatPhotoCaptureSheet: class { constructor() {
  const sheet = {
    permissionStatus() { return sheetState.status; },
    presentReply(options, reply) { this.options = options; this.reply = reply; sheetEvents.push('present'); },
    dispose() { sheetEvents.push('dispose'); },
    discard(uri) { sheetEvents.push('discard ' + uri); },
  };
  sheets.push(sheet);
  return sheet;
} } };`,
		...leaves,
		'return registry; })();',
		"const media = registry['./media.macos'].media;",
		"const files = registry['./files.macos'].files;",
	]

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
// The fake sheet class is registered into the fixture's module registry
// above, bound to the recorded event/state fixtures declared here.
const sheets = [];
const sheetEvents = [];
const sheetState = { status: 'notDetermined' };
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
  check(image.dataUrl === undefined, 'file handle only — no data URL');
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
    // Still-photo leaf: passive ensure, option rejection, null settles, a
    // successful shot registered for files.release, and late-reply discard.
    check((await media.requestPermissions('photos')).status === 'unsupported', 'photos ensure unsupported');
    check((await media.requestPermissions('camera')).status === 'unsupported', 'undecided camera ensure unsupported');
    check(sheetEvents.length === 1 && sheetEvents[0] === 'dispose', 'ensure allocates and disposes without present');
    sheetState.status = 'granted';
    check((await media.requestPermissions('camera')).status === 'granted', 'granted camera ensure');
    sheetState.status = 'denied';
    check((await media.requestPermissions('camera')).status === 'denied', 'denied camera ensure');
    // saveToGallery presents normally and requests an add-only Photos write
    // with the captured file; the shot still resolves. PhotoKit is stubbed —
    // the lane proves option flow and the write request, not library access.
    const galleryWrites = [];
    Object.defineProperty(globalThis, 'PHAccessLevelAddOnly', { configurable: true, value: 1 });
    Object.defineProperty(globalThis, 'PHPhotoLibrary', { configurable: true, value: {
      sharedPhotoLibrary: () => ({
        performChangesCompletionHandler: (change, reply) => { change(); reply(true, null); },
      }),
      authorizationStatusForAccessLevel: () => 3,
    } });
    Object.defineProperty(globalThis, 'PHAssetChangeRequest', { configurable: true, value: {
      creationRequestForAssetFromImageAtFileURL: (url) => galleryWrites.push(String(url.path)),
    } });
    const manager = NSFileManager.defaultManager;
    const jpegType = globalThis.NSBitmapImageFileTypeJPEG ?? 3;
    const galleryName = 'octane-capture-' + NSUUID.UUID().UUIDString + '.jpg';
    const galleryUri = String(manager.temporaryDirectory.URLByAppendingPathComponent(galleryName).path);
    const galleryData = NSBitmapImageRep.imageRepWithData(NSData.dataWithContentsOfURL(sourceURLs[0]))
      .representationUsingTypeProperties(jpegType, {});
    check(galleryData.writeToFileAtomically(galleryUri, true), 'gallery fixture shot written');
    const galleryPending = media.capturePhoto({ saveToGallery: true });
    check(sheets.length === 4, 'saveToGallery allocates the sheet');
    check(sheets[3].options.saveToGallery === true, 'saveToGallery reaches the sheet');
    sheets[3].reply(JSON.stringify({ name: galleryName, uri: galleryUri,
      dataUrl: 'data:image/jpeg;base64,' + galleryData.base64EncodedStringWithOptions(0) }));
    const galleryShot = await galleryPending;
    check(galleryShot.uri === galleryUri, 'saveToGallery resolves the shot');
    check(galleryWrites.length === 1 && galleryWrites[0] === galleryUri, 'add-only Photos write requested');
    check(globalThis.__xplatTemporaryFiles.has(galleryUri), 'gallery shot registered for release');
    files.release(galleryShot);
    check(!manager.fileExistsAtPath(galleryUri), 'released gallery shot deleted');
    const cancelled = media.capturePhoto();
    check(sheets.length === 5, 'sheet allocated');
    sheets[4].reply(null);
    check(await cancelled === null, 'cancel resolves null');
    check(sheetEvents.at(-1) === 'dispose', 'cancel disposes');
    const shotName = 'octane-capture-' + NSUUID.UUID().UUIDString + '.jpg';
    const shotUri = String(manager.temporaryDirectory.URLByAppendingPathComponent(shotName).path);
    const shotData = NSBitmapImageRep.imageRepWithData(NSData.dataWithContentsOfURL(sourceURLs[0]))
      .representationUsingTypeProperties(jpegType, {});
    check(shotData.writeToFileAtomically(shotUri, true), 'fixture shot written');
    const replyJSON = JSON.stringify({ name: shotName, uri: shotUri,
      dataUrl: 'data:image/jpeg;base64,' + shotData.base64EncodedStringWithOptions(0) });
    const pendingShot = media.capturePhoto({ width: 6, height: 4 });
    check(sheets[5].options.width === 6 && sheets[5].options.height === 4, 'options reach the sheet');
    const concurrent = await media.capturePhoto();
    check(concurrent === null, 'overlap resolves null without a second sheet');
    check(sheets.length === 6, 'overlap allocates nothing');
    sheets[5].reply(replyJSON);
    const shot = await pendingShot;
    check(shot.name === shotName && shot.uri === shotUri, 'shot fields');
    check(globalThis.__xplatTemporaryFiles.has(shotUri), 'shot registered for release');
    check(shot.dataUrl === undefined, 'shot returns a file handle only');
    const shotBitmap = NSBitmapImageRep.imageRepWithData(NSData.dataWithContentsOfFile(shotUri));
    check(shotBitmap.pixelsWide === 6 && shotBitmap.pixelsHigh === 4, 'shot pixel dimensions');
    const stray = String(manager.temporaryDirectory.URLByAppendingPathComponent('octane-capture-' + NSUUID.UUID().UUIDString + '.jpg').path);
    sheets[5].reply(JSON.stringify({ name: stray, uri: stray,
      dataUrl: 'data:image/jpeg;base64,' + shotData.base64EncodedStringWithOptions(0) }));
    check(sheetEvents.at(-1) === 'discard ' + stray, 'late shot discarded');
    files.release(shot);
    check(!manager.fileExistsAtPath(shotUri), 'released shot deleted');
    check(!globalThis.__xplatTemporaryFiles.has(shotUri), 'release unregisters');
    console.log('APPKIT_MEDIA_RUNTIME_OK: ' + assertions + ' assertions; injected panel and sheet; actual PNG/JPEG/file bridge');
  } catch (error) {
    console.error('APPKIT_MEDIA_RUNTIME_FAIL: ' + (error && error.message) + ' @ ' + error.stack);
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
		await macOSExecutable(packageRoot, 'macos/host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			script,
			join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`),
			bootstrap,
		],
		{ cwd: directory, encoding: 'utf8', timeout: 15_000 },
	)

	const output = result.stdout + result.stderr
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /APPKIT_MEDIA_RUNTIME_FAIL/)
	assert.match(output, /APPKIT_MEDIA_RUNTIME_OK/)
	console.log(output.trim())
	console.log(
		'Real panel selection, OS permission, camera hardware and visual display remain unqualified.',
	)
} finally {
	await rm(directory, { recursive: true, force: true })
}
