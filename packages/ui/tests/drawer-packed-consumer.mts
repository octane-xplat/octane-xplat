import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { tsrx } from '@octane-xplat/cli/vite'
import { octane } from 'octane/compiler/vite'

const { nativeScriptRenderer } = await import('@octane-xplat/nativescript-octane/config')

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')

mkdirSync(join(repoRoot, 'node_modules/.cache'), { recursive: true })

const temporary = mkdtempSync(join(repoRoot, 'node_modules/.cache/drawer-consumer-'))
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })

  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
}

function pack(source, destination) {
  mkdirSync(destination, { recursive: true })
  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', destination], source)

  const tarball = readdirSync(destination).find((file) => file.endsWith('.tgz'))

  run('tar', ['-xzf', join(destination, tarball), '-C', destination], destination)
  return join(destination, 'package')
}

try {
  const packed = pack(packageRoot, join(temporary, 'drawer'))
  const installed = join(temporary, 'node_modules/@octane-xplat/ui')

  mkdirSync(dirname(installed), { recursive: true })
  cpSync(packed, installed, { recursive: true })

  const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))

  // Install only declared dependencies/peers. No UI workspace dev plugins leak
  // into this consumer's node_modules.
  for (const dependency of new Set([
    ...Object.keys(manifest.dependencies),
    ...Object.keys(manifest.peerDependencies),
    '@nativescript/types',
  ])) {
    const target = join(temporary, 'node_modules', dependency)

    mkdirSync(dirname(target), { recursive: true })
    symlinkSync(join(packageRoot, 'node_modules', dependency), target, 'dir')
  }

  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}')
  writeFileSync(
    join(temporary, 'consumer.tsx'),
    `import { Drawer, type DrawerProps } from '@octane-xplat/ui'
const props: DrawerProps = { open: false, onOpenChange: (open) => void open, width: 320 }
export const view = <Drawer {...props} />
void view
`,
  )

  for (const target of ['web', 'native', 'macos', 'windows', 'linux', 'gtk']) {
    writeFileSync(
      join(temporary, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          jsx: 'react-jsx',
          jsxImportSource:
            target === 'web' || target === 'linux' ? '@octane-xplat/jsx/dom' : '@octane-xplat/jsx',
          module: 'esnext',
          moduleResolution: 'bundler',
          target: 'esnext',
          customConditions: [target],
          types: [],
        },
        files: ['consumer.tsx'],
      }),
    )

    run('bun', ['run', 'tsc', '-p', join(temporary, 'tsconfig.json')], packageRoot)
  }

  const webEntry = join(temporary, 'web-entry.ts')

  writeFileSync(webEntry, "export { Drawer } from '@octane-xplat/ui'\n")

  const bundle = await build({
    configFile: false,
    root: temporary,
    logLevel: 'error',
    plugins: [tsrx('web'), octane({ ssr: false })],
    resolve: {
      conditions: ['web'],
      extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.mjs', '.js', '.json'],
    },
    build: { write: false, lib: { entry: webEntry, formats: ['es'] } },
  })

  for (const chunk of (Array.isArray(bundle) ? bundle : [bundle]).flatMap(
    (result) => result.output,
  )) {
    if (chunk.type === 'chunk') {
      assert.match(chunk.code, /vx-drawer/)
      assert.doesNotMatch(chunk.code, /ui-drawer|gesturehandler|GestureHandlerDelegate/)
    }
  }

  // Compile the packed native Drawer root export with host runtimes external.
  // This checks mobile suffix selection without evaluating a device runtime.
  const nativeCompiler = () =>
    octane({
      ssr: false,
      renderers: {
        registry: { nativescript: nativeScriptRenderer },
        rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
      },
    })

  for (const platform of ['ios', 'android']) {
    writeFileSync(
      join(temporary, 'widget.ts'),
      `export { Drawer } from '${join(installed, 'src/index.ts')}'`,
    )

    const output = await build({
      configFile: false,
      root: temporary,
      logLevel: 'error',
      plugins: [tsrx(platform), nativeCompiler()],
      resolve: {
        conditions: ['native'],
        alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
        extensions: [
          `.${platform}.tsrx`,
          '.mobile.tsrx',
          '.native.tsrx',
          '.tsrx',
          `.${platform}.ts`,
          '.mobile.ts',
          '.native.ts',
          '.ts',
          '.mjs',
          '.js',
          '.json',
        ],
      },
      build: {
        write: false,
        lib: { entry: join(temporary, 'widget.ts'), formats: ['es'] },
        rollupOptions: { external: (id) => !id.startsWith('.') && !id.startsWith('/') },
      },
    })

    for (const chunk of (Array.isArray(output) ? output : [output]).flatMap(
      (result) => result.output,
    )) {
      if (chunk.type === 'chunk') {
        assert.match(chunk.code, /vx-drawer--mobile/)
        assert.doesNotMatch(chunk.code, /ui-drawer|gesturehandler|xplatDrawer/)
      }
    }
  }

  console.log(
    'Drawer packed declarations: six targets; web bundle excludes native plugins; native Drawer bundles exclude retired engines.',
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
