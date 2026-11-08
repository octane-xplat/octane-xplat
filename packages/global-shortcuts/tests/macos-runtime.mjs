// Real JSC host check for @octane-xplat/global-shortcuts on macOS: Carbon
// registration, delivery through the posted-event path, conflict and reserved
// handling, unregister cleanup — all inside the packaged NativeScript macOS
// host on this machine. Modeled on packages/tray/tests/appkit-runtime.mjs.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'

const repo = fileURLToPath(new URL('../../..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-global-shortcuts-runtime-'))

try {
  const modules = join(directory, 'node_modules/@octane-xplat')
  await mkdir(modules, { recursive: true })
  for (const name of ['platform', 'global-shortcuts']) {
    await symlink(join(repo, 'packages', name), join(modules, name), 'dir')
  }

  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({ name: 'global-shortcuts-runtime', private: true, type: 'module' }),
  )

  const caseFile = join(directory, 'case.ts')
  await writeFile(
    caseFile,
    `
import {
	CGEventCreateKeyboardEvent,
	CGEventSetFlags,
	CGEventPost,
} from '@octane-xplat/platform/macos'
import { createGlobalShortcuts, getGlobalShortcutSupport } from ${JSON.stringify(join(repo, 'packages/global-shortcuts/src/index.macos.ts'))}

const settled = (ms) => new Promise((r) => setTimeout(r, ms))
let assertions = 0
const check = (value, name) => { assertions++; if (!value) throw new Error('ASSERT ' + name) }

// Real HID-level input: CGEventPost sends Ctrl+Alt+Shift+G (kVK_G = 0x05)
// through the WindowServer to Carbon hotkey dispatch.
const FLAGS = 0x20000 | 0x40000 | 0x80000 // kCGEventFlagMaskShift | Control | Alternate
const post = () => {
	for (const down of [true, false]) {
		const event = CGEventCreateKeyboardEvent(null, 0x05, down)
		CGEventSetFlags(event, FLAGS)
		CGEventPost(0 /* kCGHIDEventTap */, event)
	}
}

setTimeout(async () => {
	try {
		const support = await getGlobalShortcutSupport()
		check(support.supported === true && support.mechanism === 'carbon' && support.assignment === 'exact', 'carbon support')

		const shortcuts = createGlobalShortcuts()
		const fires = []
		const result = await shortcuts.register({
			id: 'probe',
			accelerator: 'Ctrl+Alt+Shift+KeyG',
			description: 'probe',
			onPress: (event) => fires.push(event.id + ':' + event.accelerator),
		})
		check(result.ok, 'register: ' + (result.ok ? '' : result.error.code + ' ' + result.error.message))
		check(result.shortcut.trigger === 'Ctrl+Alt+Shift+KeyG', 'exact trigger')

		post()
		await settled(600)
		check(fires.length === 1 && fires[0] === 'probe:Ctrl+Alt+Shift+KeyG', 'delivered: ' + fires.join(','))

		const clash = await shortcuts.register({ id: 'probe2', accelerator: 'Ctrl+Alt+Shift+KeyG', onPress() {} })
		check(!clash.ok && clash.error.code === 'conflict', 'duplicate accelerator conflicts')

		const reserved = await shortcuts.register({ id: 'res', accelerator: 'Meta+Tab', onPress() {} })
		check(!reserved.ok && reserved.error.code === 'reserved', 'Meta+Tab reserved')

		const parsed = await shortcuts.register({ id: 'bad', accelerator: 'k', onPress() {} })
		check(!parsed.ok && parsed.error.code === 'invalid-accelerator', 'bare letter rejected')

		check(await result.shortcut.unregister() === true, 'unregister')
		post()
		await settled(600)
		check(fires.length === 1, 'no delivery after unregister: ' + fires.length)

		check(shortcuts.list().length === 0, 'list emptied')
		await shortcuts.dispose()
		check(shortcuts.disposed === true, 'disposed')
		const late = await shortcuts.register({ id: 'x', accelerator: 'Ctrl+Alt+Shift+KeyG', onPress() {} })
		check(!late.ok && late.error.code === 'disposed', 'disposed refusal')

		console.log('GHK_MACOS_OK ' + assertions + ' assertions, fires=' + fires.join(','))
	} catch (error) {
		console.error('GHK_MACOS_FAIL ' + (error && error.message ? error.message + ' | ' + error.stack : error))
	} finally {
		globalThis.__xplatStopHost()
	}
}, 0)
`,
  )

  const artifact = await buildMacOSNative(directory)
  assert.deepEqual(artifact.leaves, [])
  const bootstrap = join(directory, 'bootstrap.js')
  await writeNativeBootstrap(artifact, bootstrap)

  await build({
    root: directory,
    configFile: false,
    logLevel: 'error',
    resolve: { conditions: ['macos'], extensions: ['.macos.ts', '.ts', '.js'] },
    build: {
      outDir: join(directory, 'dist'),
      target: 'es2022',
      lib: { entry: caseFile, formats: ['cjs'], fileName: () => 'case.cjs' },
      minify: false,
    },
  })

  const host = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos')
  const result = await new Promise((resolve) => {
    const child = spawn(
      join(host, 'host'),
      [
        join(host, 'NativeScript.framework/Versions/A/NativeScript'),
        join(directory, 'dist/case.cjs'),
        artifact.metadata[process.arch === 'x64' ? 'x86_64' : 'arm64'],
        bootstrap,
      ],
      { timeout: 60_000 },
    )
    let output = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => (output += chunk))
    child.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk))
    child.on('close', (status) => resolve({ status, output }))
    child.on('error', (error) => resolve({ status: 1, output: String(error) }))
  })

  const output = result.output
  assert.equal(result.status, 0, output)
  assert.doesNotMatch(output, /GHK_MACOS_FAIL/)
  assert.match(output, /GHK_MACOS_OK/)
  console.log(output.trim())
} finally {
  if (process.env.GHK_TEST_KEEP_TMP) {
    console.log('kept ' + directory)
  } else {
    await rm(directory, { recursive: true, force: true })
  }
}
