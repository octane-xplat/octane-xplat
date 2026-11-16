import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  expandEnvPrograms,
  loadEnvManifest,
  envSolution,
  PLATFORM_MODULE_SUFFIXES,
} from '../src/tsconfig-envs.ts'

const tmp = []
function fixture(environments, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'xplat-envs-'))

  tmp.push(dir)
  mkdirSync(join(dir, 'src'))
  for (const name of [
    'index',
    'shared',
    'index.web',
    'index.ios',
    'index.android',
    'index.macos',
    'index.windows',
  ]) {
    writeFileSync(join(dir, `src/${name}.ts`), 'export {}\n')
  }

  writeFileSync(join(dir, 'tsconfig.envs.json'), JSON.stringify({ environments, ...options }))
  return dir
}

const entries = {
  web: { files: ['src/index.web.ts', 'src/shared.ts'] },
  native: { files: ['src/index.ts', 'src/index.ios.ts', 'src/index.android.ts', 'src/shared.ts'] },
  macos: { files: ['src/index.macos.ts', 'src/shared.ts'] },
  windows: { files: ['src/index.windows.ts', 'src/shared.ts'] },
}

const expand = (dir) => expandEnvPrograms(dir, loadEnvManifest(dir))
const config = (program) => JSON.parse(readFileSync(program.configPath, 'utf8'))

test.after(() => tmp.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

test('separate phone SDKs, platform resolution and shared roots in all five programs', () => {
  const dir = fixture(entries)
  const programs = expand(dir)

  assert.deepEqual(
    programs.map((p) => p.env),
    ['web', 'ios', 'android', 'macos', 'windows'],
  )

  for (const p of programs) {
    assert.ok(p.files.includes(join(dir, 'src/shared.ts')))

    const c = config(p)

    assert.equal(c.extends, join(dir, 'tsconfig.envs.json'))
    assert.equal(c.compilerOptions.moduleSuffixes[0], `.${p.env}`)
    assert.deepEqual(c.compilerOptions.types, [])
    assert.equal(c.compilerOptions.lib.includes('DOM'), p.env === 'web')
    for (const other of ['web', 'ios', 'android', 'macos', 'windows'].filter((v) => v !== p.env)) {
      assert.ok(!p.files.includes(join(dir, `src/index.${other}.ts`)))
    }
  }

  assert.deepEqual(
    envSolution(programs, dir).references.map((r) => r.path),
    programs.map((p) => './' + p.configPath.slice(dir.length + 1)),
  )
})

test('Linux and GTK retain the legacy mixed program and fixed precedence', () => {
  for (const target of ['linux', 'gtk']) {
    const dir = fixture({ ...entries, [target]: { files: ['src/shared.ts'] } })
    const all = expand(dir).find((p) => p.env === 'all')

    assert.ok(all.files.includes(join(dir, 'src/index.ios.ts')))
    assert.ok(all.files.includes(join(dir, 'src/index.android.ts')))
    assert.ok(all.files.includes(join(dir, 'src/index.web.ts')))
    assert.deepEqual(config(all).compilerOptions.moduleSuffixes, PLATFORM_MODULE_SUFFIXES)
    assert.ok(config(all).compilerOptions.lib.includes('DOM'))
  }
})

test('explicitly empty types prevent inherited automatic @types discovery', () => {
  const dir = fixture(entries, { compilerOptions: { types: [] } })

  assert.ok(expand(dir).every((p) => config(p).compilerOptions.types.length === 0))
})

test('reject conflicting SDKs, DOM, resolution overrides, overlap, malformed and empty entries', () => {
  const cases = [
    [{ ...entries, ios: entries.native }, {}, /overlaps/],
    [
      {
        ...entries,
        windows: { ...entries.windows, compilerOptions: { types: ['@nativescript/types-ios'] } },
      },
      {},
      /ios SDK/,
    ],
    [entries, { compilerOptions: { lib: ['esnext', 'dom.iterable'] } }, /DOM libraries/],
    [
      { ...entries, native: { ...entries.native, compilerOptions: { moduleSuffixes: [''] } } },
      {},
      /moduleSuffixes/,
    ],
    [entries, { compilerOptions: { moduleSuffixes: ['.web', ''] } }, /moduleSuffixes is fixed/],
    [entries, { compilerOptions: { types: 'node' } }, /types must be an array/],
    [
      { ...entries, web: { ...entries.web, compilerOptions: { lib: null } } },
      {},
      /lib must be an array/,
    ],
    [{ ...entries, native: { include: 'src/*' } }, {}, /array of strings/],
    [{ ...entries, native: { files: [] } }, {}, /empty program/],
    [{ ...entries, unknown: { files: ['src/shared.ts'] } }, {}, /unknown environment/],
  ]

  for (const [envs, options, error] of cases) {
    assert.throws(() => expand(fixture(envs, options)), error)
  }
})

test('unclaimed platform barrels fail instead of silently losing coverage', () => {
  assert.throws(() => expand(fixture({ web: entries.web })), /not claimed/)
})

test('JSONC comments and trailing commas preserve string values and reject syntax damage', () => {
  const dir = fixture(entries)
  const path = join(dir, 'tsconfig.envs.json')

  writeFileSync(
    path,
    '{ /* config */ "environments": { "web": { "files": ["src/index.web.ts",], }, }, // end\n }',
  )

  assert.deepEqual(loadEnvManifest(dir).manifest.environments.web.files, ['src/index.web.ts'])
  for (const text of [
    '{"environments":{"web":{"files":[,]}}}',
    '{"environments":{"web":{,}}}',
    '{"environments":{"web":{}}} /* unfinished',
  ]) {
    writeFileSync(path, text)
    assert.throws(() => loadEnvManifest(dir), /invalid JSON/)
  }
})

test('legacy Linux/GTK do not gain Windows runtime declarations or explicit empty types', () => {
  const dir = fixture(entries)
  const loaded = loadEnvManifest(dir)

  loaded.manifest.environments = { web: entries.web, linux: entries.web, windows: entries.windows }
  // Drop barrel fixtures unrelated to this minimal legacy graph.
  for (const env of ['ios', 'android', 'macos']) {
    rmSync(join(dir, `src/index.${env}.ts`))
  }

  rmSync(join(dir, 'src/index.ts'))

  const all = expandEnvPrograms(dir, loaded).find((p) => p.env === 'all')

  assert.equal(config(all).compilerOptions.types, undefined)
  assert.ok(!all.files.some((file) => file.endsWith('typecheck-globals/native.d.ts')))
})

test('GTK alone retains its pre-isolation explicit libraries and SDK types', () => {
  const dir = fixture(
    { gtk: { files: ['src/index.ts', 'src/shared.ts'] } },
    {
      compilerOptions: { lib: ['DOM'], types: ['@nativescript/types-ios'] },
    },
  )

  for (const env of ['web', 'ios', 'android', 'macos', 'windows']) {
    rmSync(join(dir, `src/index.${env}.ts`))
  }

  const [all] = expand(dir)

  assert.equal(all.env, 'all')
  assert.ok(config(all).compilerOptions.lib.includes('DOM'))
  assert.deepEqual(config(all).compilerOptions.types, ['@nativescript/types-ios'])
  assert.ok(!all.files.some((file) => file.includes('isolation-')))
})
