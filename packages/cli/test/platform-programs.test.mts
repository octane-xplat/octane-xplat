import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertPlatformIsolation,
  expandEnvPrograms,
  loadEnvManifest,
  envSolution,
} from '../src/tsconfig-envs.ts'

import { nativeLsp } from './native-lsp.mts'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const compiler = join(repo, 'node_modules/typescript/bin/tsc')
const targets = ['web', 'ios', 'android', 'macos', 'windows']

function fixture(t) {
  const dir = mkdtempSync(join(repo, 'research-platform-types-'))

  t.after(() => rmSync(dir, { recursive: true, force: true }))

  const put = (name, value) => {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(
      join(dir, name),
      typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    )
  }

  for (const name of [
    '@nativescript/core',
    '@nativescript/types',
    'octane',
    '@octane-xplat/jsx',
    '@tsrx/content-mapper',
  ]) {
    mkdirSync(dirname(join(dir, 'node_modules', name)), { recursive: true })
    symlinkSync(
      join(repo, 'packages/ui/node_modules', name),
      join(dir, 'node_modules', name),
      'dir',
    )
  }

  // CLI's mapper is the public integration for libraries. Use its manifest,
  // rather than a test-only transform or a classic TS plugin.
  mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
  symlinkSync(join(repo, 'packages/cli'), join(dir, 'node_modules/@octane-xplat/cli'), 'dir')
  put('package.json', { type: 'module' })

  const environments = {}

  for (const env of targets) {
    put(`src/context.${env}.d.ts`, `declare const platformContext: '${env}'\n`)

    const own = {
      web: 'document.title',
      ios: 'UIView.new()',
      android: 'android.os.Build.MODEL',
      macos: 'dlopen("AppKit", 1)',
      windows: 'console.log("Windows")',
    }[env]

    const forbidden = [
      ...(env !== 'web' ? ['document.title'] : []),
      ...(env !== 'ios' ? ['UIView.new()'] : []),
      ...(env !== 'android' ? ['android.os.Build.MODEL'] : []),
      ...(env !== 'macos' ? ['dlopen("AppKit", 1)'] : []),
    ]

    put(
      `src/leaf.${env}.ts`,
      `${['ios', 'android'].includes(env) ? "import type { View } from '@nativescript/core/ui/core/view/index.js'\nexport type NativeView = View\n" : ''}import './shared'\nexport const selected = platformContext\n${own}\n` +
        forbidden.map((v) => `// @ts-expect-error unavailable in ${env}\n${v}\n`).join(''),
    )

    put(
      `src/Leaf.${env}.tsrx`,
      `export function Leaf() @{\n const selected = platformContext\n <>{selected}</>\n}\n`,
    )

    environments[env] = {
      files: [
        `src/leaf.${env}.ts`,
        `src/Leaf.${env}.tsrx`,
        `src/context.${env}.d.ts`,
        'src/shared.ts',
        'src/Shared.tsrx',
      ],
      ...(['ios', 'android'].includes(env)
        ? { compilerOptions: { types: ['@nativescript/types'] } }
        : {}),
    }
  }

  put('src/shared.ts', 'export const sharedContext = platformContext\n')
  put(
    'src/Shared.tsrx',
    'export function Shared() @{\n const sharedContext = platformContext\n <>{sharedContext}</>\n}\n',
  )

  put('tsconfig.legacy.json', {
    compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], types: ['@nativescript/types'] },
  })

  put('tsconfig.envs.json', {
    extends: './tsconfig.legacy.json',
    contentMappers: [{ package: '@octane-xplat/cli', extensions: ['.tsrx'] }],
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      moduleResolution: 'bundler',
      strict: true,
      jsx: 'preserve',
      skipLibCheck: true,
      noEmit: true,
      allowImportingTsExtensions: true,
    },
    environments,
  })

  const programs = expandEnvPrograms(dir, loadEnvManifest(dir))

  put('tsconfig.json', envSolution(programs, dir))
  return { dir, put, programs }
}

function tsc(dir, program, ...flags) {
  return spawnSync(
    process.execPath,
    [compiler, '--runExternalCode', '-p', program.configPath, ...flags],
    { cwd: dir, encoding: 'utf8', timeout: 60000 },
  )
}

test(
  'real SDK programs reject foreign globals and check shared TS and TSRX under every target',
  { timeout: 180000 },
  (t) => {
    const { dir, put, programs } = fixture(t)

    const solutionCheck = tsc(dir, { configPath: join(dir, 'tsconfig.json') })

    assert.equal(solutionCheck.status, 0, solutionCheck.stdout + solutionCheck.stderr)
    for (const program of programs) {
      const result = tsc(dir, program)

      assert.equal(result.status, 0, `${program.env}: ${result.stdout}${result.stderr}`)

      const listing = tsc(dir, program, '--listFilesOnly')

      assert.equal(listing.status, 0, listing.stdout + listing.stderr)
      assertPlatformIsolation(program.env, listing.stdout.split(/\r?\n/))
      assert.equal(/[/\\]lib\.dom\.d\.ts/.test(listing.stdout), program.env === 'web')
      assert.equal(listing.stdout.includes('@nativescript/types-ios/'), program.env === 'ios')
      assert.equal(
        listing.stdout.includes('@nativescript/types-android/'),
        program.env === 'android',
      )

      assert.ok(
        !listing.stdout.includes('/@nativescript/types/index.d.ts'),
        'umbrella SDK must not reenter transitively',
      )
    }

    put('src/leak.d.ts', '/// <reference lib="dom" />\nexport {}\n')
    put('src/shared.ts', "import './leak'\nexport const sharedContext = platformContext\n")
    for (const program of programs.filter((p) => p.env !== 'web')) {
      const listing = tsc(dir, program, '--listFilesOnly')

      assert.throws(
        () => assertPlatformIsolation(program.env, listing.stdout.split(/\r?\n/)),
        /transitive ambient leakage/,
      )
    }

    put('src/leak.d.ts', 'declare global { var document: { title: string } }\nexport {}\n')

    const customLeak = tsc(
      dir,
      programs.find((p) => p.env === 'ios'),
    )

    assert.notEqual(customLeak.status, 0)
    assert.match(
      customLeak.stdout,
      /isolation-ios\.ts.*TS2578/,
      'negative assertions catch custom ambient leakage without a DOM library',
    )

    put('src/shared.ts', 'export const sharedContext: never = platformContext\n')
    put(
      'src/Shared.tsrx',
      'export function Shared() @{\n const sharedContext: never = platformContext\n <>{sharedContext}</>\n}\n',
    )

    for (const program of programs) {
      const result = tsc(dir, program)

      assert.notEqual(result.status, 0)
      assert.match(result.stdout, /shared\.ts\(1,14\): error TS2322/)
      assert.match(result.stdout, /Shared\.tsrx\(2,8\): error TS2322/)
    }
  },
)

test(
  'native language server discovers referenced projects for TS and TSRX platform leaves',
  { timeout: 180000 },
  async (t) => {
    const { dir } = fixture(t)
    const lsp = nativeLsp(dir, compiler)

    t.after(() => lsp.close())
    await lsp.initialize()
    for (const env of targets) {
      for (const file of [`src/leaf.${env}.ts`, `src/Leaf.${env}.tsrx`]) {
        const text = readFileSync(join(dir, file), 'utf8')
        const document = lsp.open(join(dir, file), text)
        const index = text.indexOf('platformContext')
        const prefix = text.slice(0, index)
        const position = {
          line: prefix.split('\n').length - 1,
          character: prefix.split('\n').at(-1).length + 2,
        }

        const hover = await lsp.request('textDocument/hover', { textDocument: document, position })

        assert.match(
          JSON.stringify(hover),
          new RegExp(`platformContext: ["\\\\"]*${env}`),
          `${file}: ${JSON.stringify(hover)}`,
        )

        const diagnostics = await lsp.request('textDocument/diagnostic', { textDocument: document })

        assert.deepEqual(diagnostics.items, [], `${file}: ${JSON.stringify(diagnostics)}`)
      }
    }

    // A shared document has one default project, not a union of every SDK.
    // Its selected context must belong to one referenced project. Full checking
    // remains the compiler's separate runs, covered by the preceding test.
    for (const file of ['src/shared.ts', 'src/Shared.tsrx']) {
      const text = readFileSync(join(dir, file), 'utf8')
      const document = lsp.open(join(dir, file), text)
      const prefix = text.slice(0, text.indexOf('platformContext'))
      const hover = await lsp.request('textDocument/hover', {
        textDocument: document,
        position: {
          line: prefix.split('\n').length - 1,
          character: prefix.split('\n').at(-1).length + 2,
        },
      })

      assert.match(JSON.stringify(hover), /platformContext:.*(web|ios|android|macos|windows)/)
    }
  },
)

test(
  'a single solution reference selects a deliberate shared-file context in TS and TSRX',
  { timeout: 180000 },
  async (t) => {
    const { dir, put, programs } = fixture(t)

    for (const program of programs) {
      put('tsconfig.json', envSolution([program], dir))

      const lsp = nativeLsp(dir, compiler)

      try {
        await lsp.initialize()
        // Open a content-mapped file first; no preceding .ts document bootstrap.
        for (const file of ['src/Shared.tsrx', 'src/shared.ts']) {
          const text = readFileSync(join(dir, file), 'utf8')
          const document = lsp.open(join(dir, file), text)
          const prefix = text.slice(0, text.indexOf('platformContext'))
          const position = {
            line: prefix.split('\n').length - 1,
            character: prefix.split('\n').at(-1).length + 2,
          }

          const hover = await lsp.request('textDocument/hover', {
            textDocument: document,
            position,
          })

          assert.match(JSON.stringify(hover), new RegExp(`platformContext:.*${program.env}`))

          const diagnostics = await lsp.request('textDocument/diagnostic', {
            textDocument: document,
          })

          assert.deepEqual(diagnostics.items, [])
        }
      } finally {
        lsp.close()
      }
    }
  },
)
