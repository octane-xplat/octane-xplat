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
const temporary = mkdtempSync(join(tmpdir(), 'xplat-app-menu-consumer-'))
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
  symlinkSync(join(temporary, 'package'), join(scope, 'app-menu'), 'dir')
  // The leaf's only runtime dependency — resolved like an installed package.
  symlinkSync(join(root, '..', 'lib'), join(scope, 'lib'), 'dir')

  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `
import { appMenu, type AppMenu, type AppMenuEntry, type AppMenuOptions, type AppMenuService, type AppMenuSubmenu } from '@octane-xplat/app-menu'
export const service: AppMenuService = appMenu
export const entry: AppMenuEntry = { type: 'separator', key: 's' }
export function install(menus: readonly AppMenuSubmenu[], options?: AppMenuOptions): AppMenu {
 return appMenu.install(menus, options)
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
        'declare const console: { log(...args: unknown[]): void; error(...args: unknown[]): void }\n',
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
      "console.log(import.meta.resolve('@octane-xplat/app-menu'))",
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
      "console.log(import.meta.resolve('@octane-xplat/app-menu'))",
    ])

    assert.ok(
      resolved.trim().endsWith(`index.${condition}.js`),
      'Native host must win over Vite browser defaults',
    )
  }

  run(process.execPath, [
    '--input-type=module',
    '-e',
    `
import {appMenu} from '@octane-xplat/app-menu'
if (appMenu.supported !== false) throw Error('expected unsupported default host')
await appMenu.isAvailable().then(ok => { if (ok !== false) throw Error('expected isAvailable false') })
try { appMenu.install([]); throw Error('unexpected support') }
catch(error) { if (!/appMenu is unavailable/.test(error.message)) throw error }
`,
  ])

  console.log(
    'Packed consumer: six conditions × Bundler/NodeNext, closed ambient-free declarations, ESM resolution and unsupported-host failure passed.',
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
