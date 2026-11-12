import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-global-shortcuts-consumer-'))
const run = (command, args, cwd = temporary) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 90_000,
    maxBuffer: 4 * 1024 * 1024,
  })

try {
  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', temporary], root)

  const tarball = readdirSync(temporary).find((name) => name.endsWith('.tgz'))

  run('tar', ['-xzf', join(temporary, tarball), '-C', temporary])

  const scope = join(temporary, 'node_modules/@octane-xplat')

  mkdirSync(scope, { recursive: true })
  symlinkSync(join(temporary, 'package'), join(scope, 'global-shortcuts'), 'dir')

  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `
import {
	createGlobalShortcuts,
	getGlobalShortcutSupport,
	parseAccelerator,
	type Accelerator,
	type AcceleratorPlatform,
	type CreateGlobalShortcutsOptions,
	type GlobalShortcut,
	type GlobalShortcutCode,
	type GlobalShortcutError,
	type GlobalShortcutErrorCode,
	type GlobalShortcutEvent,
	type GlobalShortcutMechanism,
	type GlobalShortcutOptions,
	type GlobalShortcutPlatform,
	type GlobalShortcutResult,
	type GlobalShortcuts,
	type GlobalShortcutSupport,
} from '@octane-xplat/global-shortcuts'

const parsed = parseAccelerator('Mod+Shift+Space', {platform: 'windows'})
if (!parsed.ok) throw new Error(parsed.error.message)
const accelerator: Accelerator = parsed.accelerator
const code: GlobalShortcutCode = accelerator.code
const platform: AcceleratorPlatform = 'linux'
const mechanism: GlobalShortcutMechanism = 'xdg-portal'
const errorCode: GlobalShortcutErrorCode = 'conflict'
const error: GlobalShortcutError = {code: errorCode, message: 'x'}
const createOptions: CreateGlobalShortcutsOptions = {appId: 'com.example.App', onError: (e: unknown) => {void e}}
const shortcuts: GlobalShortcuts = createGlobalShortcuts(createOptions)
const options: GlobalShortcutOptions = {
	id: 'quick-entry',
	accelerator: 'Mod+Shift+Space',
	description: 'Show quick entry',
	onPress: (event: GlobalShortcutEvent) => {void event.timestamp},
}
export async function probe(): Promise<GlobalShortcutSupport> {
	const support: GlobalShortcutSupport = await getGlobalShortcutSupport()
	const hostPlatform: GlobalShortcutPlatform = support.platform
	const result: GlobalShortcutResult = await shortcuts.register(options)
	if (result.ok) {
		const shortcut: GlobalShortcut = result.shortcut
		console.log(shortcut.id, shortcut.accelerator, shortcut.trigger)
		await shortcut.unregister()
	} else {
		console.log(result.error.code, result.error.message, error)
	}
	await shortcuts.unregisterAll()
	console.log(shortcuts.list().length, shortcuts.disposed, hostPlatform, code, platform, mechanism)
	await shortcuts.dispose()
	return support
}
`,
  )

  for (const condition of ['web', 'browser', 'macos', 'gtk', 'windows', 'native']) {
    for (const mode of ['Bundler', 'NodeNext']) {
      writeFileSync(
        join(temporary, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            target: 'ES2022',
            lib: ['ES2022'],
            types: [],
            module: mode === 'Bundler' ? 'ESNext' : 'NodeNext',
            moduleResolution: mode,
            customConditions: [condition],
            skipLibCheck: false,
          },
          files: ['consumer.ts'],
        }),
      )

      // The consumer intentionally has no DOM or platform ambient types.
      writeFileSync(
        join(temporary, 'console.d.ts'),
        'declare const console: { log(...args: unknown[]): void }\n',
      )

      const config = JSON.parse(readFileSync(join(temporary, 'tsconfig.json')))

      config.files.push('console.d.ts')
      writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify(config))
      run(process.execPath, [
        join(root, 'node_modules/typescript/bin/tsc'),
        '-p',
        join(temporary, 'tsconfig.json'),
      ])
    }

    const resolved = run(process.execPath, [
      `--conditions=${condition}`,
      '--input-type=module',
      '-e',
      "console.log(import.meta.resolve('@octane-xplat/global-shortcuts'))",
    ])

    assert.match(
      resolved,
      new RegExp(
        `index${condition === 'native' ? '' : condition === 'browser' ? '\\.web' : `\\.${condition}`}\\.js`,
      ),
    )
  }

  for (const condition of ['macos', 'gtk', 'windows']) {
    const resolved = run(process.execPath, [
      '--conditions=browser',
      `--conditions=${condition}`,
      '--input-type=module',
      '-e',
      "console.log(import.meta.resolve('@octane-xplat/global-shortcuts'))",
    ])

    assert.ok(
      resolved.trim().endsWith(`index.${condition}.js`),
      'Native host must win over Vite browser defaults',
    )
  }

  await run(process.execPath, [
    '--input-type=module',
    '-e',
    `
import {createGlobalShortcuts,getGlobalShortcutSupport} from '@octane-xplat/global-shortcuts'
const support = await getGlobalShortcutSupport()
if (support.supported) throw Error('default consumer must be unsupported')
const shortcuts = createGlobalShortcuts()
const result = await shortcuts.register({id:'x',accelerator:'Ctrl+Alt+KeyK',onPress(){}})
if (result.ok || result.error.code !== 'unsupported') throw Error('expected unsupported refusal')
`,
  ])

  console.log(
    'Packed consumer: six conditions × Bundler/NodeNext, closed ambient-free declarations, ESM resolution and unsupported-host failure passed.',
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
