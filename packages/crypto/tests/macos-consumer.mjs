import { linkDependencies } from './native-fixture.mjs'
import assert from 'node:assert/strict'
import { mkdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
const root = fileURLToPath(new URL('..', import.meta.url)),
	repo = process.env.XPLAT_NATIVE_TEST_REPO
assert.ok(repo, 'Select the skymac.local checkout')
await linkDependencies(root, repo)
const app = join(root, 'tests/.runtime/macos-consumer')
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
try {
	await symlink(await realpath(root), join(app, 'node_modules/@octane-xplat/crypto'), 'dir')
} catch (error) {
	if (error.code !== 'EEXIST') {
		throw error
	}
}
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: '@xplat/crypto-macos-consumer',
		private: true,
		version: '1.0.0',
		type: 'module',
		dependencies: { '@octane-xplat/crypto': 'workspace:*' },
	}),
)
const { buildMacOSNative, writeNativeBootstrap } = await import(
	pathToFileURL(join(repo, 'packages/cli/src/macos/native.ts')).href
)
const artifact = await buildMacOSNative(app)
assert.ok(artifact.leaves.includes('@octane-xplat/crypto'))
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const entry = join(app, 'case.ts')
await writeFile(
	entry,
	`
import { run } from '${join(root, 'tests/conformance.ts')}'
import { Crypto } from '@octane-xplat/crypto'
NSApplication.sharedApplication;
setTimeout(async () => {
 let count = 0;
 try {
  if (!Crypto.capabilities.random) throw new Error('Missing secure entropy metadata');
  await run({ assert(name,actual,expected) { if(actual !== expected) throw new Error(name); count++; }, record() {} });
  console.log('CRYPTO_MACOS_OK assertions=' + count);
 } catch(error) { console.error('CRYPTO_MACOS_FAIL ' + error.message); }
 finally { globalThis.__xplatStopHost(); }
},0);
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
const host = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos')
const result = spawnSync(
	join(host, 'host'),
	[
		join(host, 'NativeScript.framework/Versions/A/NativeScript'),
		join(app, 'dist/case.cjs'),
		artifact.metadata[process.arch === 'x64' ? 'x86_64' : 'arm64'],
		bootstrap,
	],
	{ encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
)
assert.equal(result.status, 0, `${result.stdout}${result.stderr} signal=${result.signal}`)
const match = /CRYPTO_MACOS_OK assertions=(\d+)/.exec(result.stdout + result.stderr)
assert.ok(match, result.stdout + result.stderr)
assert.ok(Number(match[1]) >= 61)
console.log(
	`AppKit JavaScript/CryptoKit/Security consumer: ${match[1]} real-engine conformance assertions passed.`,
)
