import assert from 'node:assert/strict'
import { mkdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = process.env.XPLAT_NATIVE_TEST_REPO
assert.ok(repo, 'Select the skymac.local checkout')
const app = join(root, 'tests/.runtime/macos-consumer')
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
try {
	await symlink(await realpath(root), join(app, 'node_modules/@octane-xplat/print'), 'dir')
} catch (error) {
	if (error.code !== 'EEXIST') {
		throw error
	}
}
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: '@xplat/print-macos-consumer',
		private: true,
		version: '1.0.0',
		type: 'module',
		dependencies: { '@octane-xplat/print': 'workspace:*' },
	}),
)
const { buildMacOSNative, writeNativeBootstrap } = await import(
	pathToFileURL(join(repo, 'packages/cli/src/macos/native.ts')).href
)
const artifact = await buildMacOSNative(app)
assert.equal(artifact.libraries.length, 1, 'Only the print leaf should compile')
assert.deepEqual(artifact.leaves, ['@octane-xplat/print'])
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const entry = join(app, 'case.ts')
await writeFile(
	entry,
	`
import { Print, printToFileAsync, releasePrintFile } from '@octane-xplat/print'
NSApplication.sharedApplication;
setTimeout(async () => {
 const files = [];
 try {
  if (!Print.supported || !Print.capabilities.printToFile) throw new Error('Print bridge is unavailable');
  const first = await printToFileAsync({ html: '<html><body>Consumer first page<div style="page-break-before:always">Consumer second page</div></body></html>', width: 360, height: 540, base64: true }); files.push(first);
  if (first.numberOfPages !== 2 || !first.base64.startsWith('JVBERi0')) throw new Error('Invalid PDF export');
  const url = NSURL.URLWithString(first.uri);
  if (!NSFileManager.defaultManager.fileExistsAtPath(url.path)) throw new Error('Missing PDF file');
  const data = NSData.dataWithContentsOfURL(url);
  if (String(data.base64EncodedStringWithOptions(0)) !== first.base64) throw new Error('File/base64 mismatch');
  const second = await printToFileAsync({ html: '<p>Second export</p>' }); files.push(second);
  if (second.numberOfPages !== 1 || first.uri === second.uri) throw new Error('Independent export failed');
  if (!NSFileManager.defaultManager.fileExistsAtPath(url.path)) throw new Error('Earlier export was lost');
  releasePrintFile(first); releasePrintFile(first);
  if (NSFileManager.defaultManager.fileExistsAtPath(url.path)) throw new Error('Export was not released');
  console.log('PRINT_MACOS_CONSUMER_OK');
 } catch (error) { console.error('PRINT_MACOS_CONSUMER_FAIL ' + error.message); }
 finally { for (const file of files) releasePrintFile(file); globalThis.__xplatStopHost(); }
}, 0);
`,
)
const require = createRequire(join(repo, 'apps/mobile/package.json'))
const { build } = await import(pathToFileURL(require.resolve('vite')).href)
await build({
	root: app,
	configFile: false,
	logLevel: 'error',
	resolve: { conditions: ['macos'], extensions: ['.macos.ts', '.ts', '.js'] },
	build: {
		outDir: join(app, 'dist'),
		emptyOutDir: true,
		target: 'es2022',
		lib: { entry, formats: ['cjs'], fileName: () => 'case.cjs' },
		minify: false,
	},
})
const hostRoot = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos-arm64')
const run = spawnSync(
	join(hostRoot, 'host'),
	[
		join(hostRoot, 'NativeScript.framework/Versions/A/NativeScript'),
		join(app, 'dist/case.cjs'),
		artifact.metadata,
		bootstrap,
	],
	{ encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
)
assert.equal(
	run.status,
	0,
	`${run.stdout}${run.stderr} signal=${run.signal} error=${run.error?.message}`,
)
assert.match(run.stdout + run.stderr, /PRINT_MACOS_CONSUMER_OK/)
console.log(
	'AppKit JavaScript consumer: CLI-built print dylib and metadata, async callback, repeated real PDF exports, base64 and release passed.',
)
