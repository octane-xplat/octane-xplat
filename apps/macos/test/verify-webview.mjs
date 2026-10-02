import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createMacOSConfig } from '../vite.shared.mjs'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.mjs'
import {
	hostBundle,
	hostRoot,
	validateHostBundle,
} from '../../../packages/cli/src/macos/jsc-host/runtime.mjs'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = resolve(appRoot, '../../research')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-webview-'))
const bootstrap = join(directory, 'bootstrap.js')
await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js'), 'utf8'))
const config = await createMacOSConfig({
	packaged: true,
	rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
})({ mode: 'production' })

const first = join(directory, 'first.html')
const second = join(directory, 'second.html')
await writeFile(first, '<html><body style="height:800px">first</body></html>')
await writeFile(second, '<html><body style="height:1000px">second</body></html>')
const urls = [first, second, join(directory, 'missing.html')].map(
	(file) => pathToFileURL(file).href,
)

const entry = join(directory, 'main.mjs')
await writeFile(
	entry,
	[
		`import { runWebViewFixture } from ${JSON.stringify(join(appRoot, 'test/webview-fixture.macos.tsx'))}`,
		`NSApplication.sharedApplication`,
		`runWebViewFixture(...${JSON.stringify(urls)})`,
	].join('\n'),
)

await build({
	...config,
	configFile: false,
	logLevel: 'error',
	build: {
		...config.build,
		outDir: directory,
		emptyOutDir: false,
		lib: { entry, formats: ['cjs'], fileName: 'fixture' },
	},
})

const bundle = join(directory, 'fixture.cjs')
await validateHostBundle(bundle, appRoot)
const appBundle = join(directory, 'WebViewFixture.app/Contents')
await mkdir(join(appBundle, 'MacOS'), { recursive: true })
const executable = join(appBundle, 'MacOS/Fixture')
await copyFile(await macOSExecutable(appRoot, 'macos-arm64/host'), executable)
await writeFile(
	join(appBundle, 'Info.plist'),
	`<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>Fixture</string><key>CFBundleIdentifier</key><string>org.octane.webview-fixture</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>`,
)

const result = spawnSync(
	executable,
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		bundle,
		join(hostBundle, 'metadata.nsmd'),
		bootstrap,
	],
	{
		cwd: directory,
		env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
		encoding: 'utf8',
		timeout: 45_000,
	},
)

const output = result.stdout + result.stderr
assert.equal(result.status, 0, output)
assert.doesNotMatch(output, /WEBVIEW_FIXTURE_FAIL|uncaught render error/)
assert.match(output, /WEBVIEW_RUNTIME_OK/)

console.log(
	'AppKit WKWebView real loads, reload, HTML replacement, file history, errors, measurement and disposal pass',
)
