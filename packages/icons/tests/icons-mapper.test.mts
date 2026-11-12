import { loadSource } from '../../../scripts/load-source.ts'
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { syncIconStubs } = await loadSource(new URL('../src/vite/stubs.ts', import.meta.url))

const repo = fileURLToPath(new URL('../../..', import.meta.url))
const tsc = join(repo, 'node_modules/typescript/bin/tsc')
const fixture = mkdtempSync(join(repo, 'node_modules/.icons-mapper-test-'))

// A consumer project: its own @iconify-json/mini install, the icons package
// linked like a real dependency, and tsconfig entries for the .icon content
// mapper plus a `paths` wildcard onto the generated stub tree.
mkdirSync(join(fixture, 'node_modules/@iconify-json/mini'), { recursive: true })
mkdirSync(join(fixture, 'node_modules/@octane-xplat'), { recursive: true })
symlinkSync(join(repo, 'packages/icons'), join(fixture, 'node_modules/@octane-xplat/icons'), 'dir')
writeFileSync(
  join(fixture, 'node_modules/@iconify-json/mini/icons.json'),
  JSON.stringify({
    prefix: 'mini',
    width: 32,
    height: 16,
    icons: { wide: { body: '<path d="M0 0h32v16H0z"/>' } },
    aliases: { turned: { parent: 'wide', rotate: 1 } },
  }),
)

writeFileSync(join(fixture, 'package.json'), '{"type":"module"}')
writeFileSync(
  join(fixture, 'tsconfig.json'),
  JSON.stringify({
    contentMappers: [{ package: '@octane-xplat/icons', extensions: ['.icon'] }],
    compilerOptions: {
      module: 'esnext',
      target: 'ES2022',
      moduleResolution: 'bundler',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      paths: { 'icons:*': ['./.icons/*.icon'] },
    },
    files: ['main.ts'],
  }),
)

syncIconStubs({ root: fixture })

const check = () =>
  spawnSync(tsc, ['--runExternalCode', '--pretty', 'false', '-p', join(fixture, 'tsconfig.json')], {
    cwd: fixture,
    encoding: 'utf8',
    timeout: 120_000,
  })

// Classic TypeScript consumers cannot run the mapper; the package's ambient
// `icons.d.ts` wildcard is their opt-in floor — generic IconifyIcon typing
// for every specifier, no name check and no stub tree.
const classicTsc = join(repo, 'node_modules/typescript-classic/bin/tsc')

writeFileSync(
  join(fixture, 'tsconfig.classic.json'),
  JSON.stringify({
    compilerOptions: {
      module: 'esnext',
      target: 'ES2022',
      moduleResolution: 'bundler',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    files: ['main-classic.ts', 'node_modules/@octane-xplat/icons/icons.d.ts'],
  }),
)

const checkClassic = () =>
  spawnSync(classicTsc, ['--pretty', 'false', '-p', join(fixture, 'tsconfig.classic.json')], {
    cwd: fixture,
    encoding: 'utf8',
    timeout: 120_000,
  })

test('icons: specifiers type-check to literal IconifyIcon data', () => {
  writeFileSync(
    join(fixture, 'main.ts'),
    `import wide from 'icons:mini/wide'
import turned from 'icons:mini/turned'
// Literal types: the module carries the normalized collection data.
const body: '<path d="M0 0h32v16H0z"/>' = wide.body
const width: 32 = wide.width
const rotate: 1 | undefined = turned.rotate
export { body, width, rotate }
`,
  )

  const result = check()

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})

test('a specifier without a stub fails module resolution', () => {
  writeFileSync(join(fixture, 'main.ts'), `import nope from 'icons:mini/nope'\nexport { nope }\n`)

  const result = check()

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /error TS2307: Cannot find module 'icons:mini\/nope'/)
})

test('a stale stub reports the mapper diagnostic', () => {
  writeFileSync(join(fixture, '.icons/mini/gone.icon'), 'icons:mini/gone\n')
  writeFileSync(join(fixture, 'main.ts'), `import gone from 'icons:mini/gone'\nexport { gone }\n`)

  const result = check()

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /icons770102.*not found in @iconify-json\/mini/)

  rmSync(join(fixture, '.icons/mini/gone.icon'))
})

test('the ambient icons.d.ts wildcard is the classic-TypeScript fallback', () => {
  writeFileSync(
    join(fixture, 'main-classic.ts'),
    `import wide from 'icons:mini/wide'
import nope from 'icons:mini/nope'
const body: string = wide.body
// The wildcard does not check names — unknown specifiers still type-check.
export { body, nope }
`,
  )

  const result = checkClassic()

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})

after(() => rmSync(fixture, { recursive: true, force: true }))
