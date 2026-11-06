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

import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { octane } from 'octane/compiler/vite'
// oxlint-disable-next-line xplat/no-nativescript-import -- Node test reads compiler metadata; it does not load a native UI runtime.
import { nativeScriptRenderer } from '@nativescript-community/octane/config'
import { xplatTsrx } from '@octane-xplat/cli/vite'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = join(homedir(), 'agent-scratch/octane-xplat/tanstack-form')
mkdirSync(scratch, { recursive: true })
const temporary = mkdtempSync(join(scratch, 'packed-'))
function run(command, args, cwd = temporary) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
}

const source = `import { useField, useForm, useFormStore } from '@octane-xplat/form'
export function Consumer() {
  const form = useForm({defaultValues: {profile: {name: ''}, enabled: false}})
  const field = useField({form, name: 'profile.name', validators: {onBlur: ({value}) => value ? undefined : 'Required'}})
  const name: string = field.state.value
  const dirty: boolean = useFormStore(form.store, state => state.isDirty)
  // @ts-expect-error nested names remain checked through packed declarations
  useField({form, name: 'profile.missing'})
  // @ts-expect-error field values remain typed through packed declarations
  field.handleChange(false)
  void name; void dirty
  return null
}`

try {
  mkdirSync(join(temporary, 'pack'))
  run(
    'bun',
    ['pm', 'pack', '--ignore-scripts', '--destination', join(temporary, 'pack')],
    packageRoot,
  )

  const tarballs = readdirSync(join(temporary, 'pack'))
  assert.equal(tarballs.length, 1)
  run('tar', ['-xzf', join(temporary, 'pack', tarballs[0])])
  const packed = join(temporary, 'node_modules/@octane-xplat/form')
  mkdirSync(dirname(packed), { recursive: true })
  cpSync(join(temporary, 'package'), packed, { recursive: true })
  const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'))
  assert.equal(manifest.dependencies['@tanstack/form-core'], '1.33.5')
  assert.ok(!manifest.dependencies.react)
  assert.ok(readFileSync(join(packed, 'NOTICE'), 'utf8').includes('Tanner Linsley'))
  for (const dependency of ['octane', '@tanstack/form-core', '@octane-xplat/jsx']) {
    const destination = join(temporary, 'node_modules', dependency)
    mkdirSync(dirname(destination), { recursive: true })
    symlinkSync(join(packageRoot, 'node_modules', dependency), destination, 'dir')
  }

  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}')
  writeFileSync(join(temporary, 'consumer.tsx'), source)
  for (const mode of ['bundler', 'nodenext']) {
    writeFileSync(
      join(temporary, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          target: 'esnext',
          module: mode === 'bundler' ? 'esnext' : 'nodenext',
          moduleResolution: mode,
        },
        files: ['consumer.tsx'],
      }),
    )

    run(process.execPath, [
      join(packageRoot, '../../node_modules/typescript/bin/tsc'),
      '-p',
      join(temporary, 'tsconfig.json'),
    ])
  }

  for (const target of ['web', 'ios']) {
    await build({
      configFile: false,
      root: temporary,
      logLevel: 'error',
      plugins: [
        xplatTsrx(target),
        octane({
          ssr: false,
          ...(target === 'ios'
            ? {
                renderers: {
                  registry: { nativescript: nativeScriptRenderer },
                  rules: [{ include: '**/*.{ts,tsx,tsrx}', renderer: 'nativescript' }],
                },
              }
            : {}),
        }),
      ],
      resolve: {
        conditions: [target === 'web' ? 'web' : 'native'],
        alias:
          target === 'ios' ? [{ find: /^octane$/, replacement: 'octane/universal/native' }] : [],
      },
      build: {
        write: false,
        minify: false,
        lib: { entry: join(temporary, 'consumer.tsx'), formats: ['es'] },
        rollupOptions: {
          external: ['octane', 'octane/universal/native', '@nativescript-community/octane'],
        },
      },
    })
  }

  console.log('form packed consumer: Bundler/NodeNext types and web/native compilation pass')
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
