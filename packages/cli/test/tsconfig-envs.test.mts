import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  expandEnvPrograms,
  loadEnvManifest,
  envSolution,
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

test('explicitly empty types prevent inherited automatic @types discovery', () => {
  const dir = fixture(entries, { compilerOptions: { types: [] } })

  assert.ok(expand(dir).every((p) => config(p).compilerOptions.types.length === 0))
})

test('reject conflicting SDKs, DOM, resolution overrides, overlap, malformed and empty entries', () => {
  const cases = [
    [{ ...entries, gtk: { files: ['src/shared.ts'], compilerOptions: { lib: ['DOM'] } } }, {}, /DOM libraries/],
    [{ ...entries, linux: { files: ['src/shared.ts'], compilerOptions: { types: ['@nativescript/types-ios'] } } }, {}, /ios SDK/],
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

test('Linux WebKit and GTK have separate declarations, suffixes, and fallback roots', () => {
  const dir = fixture(entries)
  for (const name of ['widget.web', 'widget.linux', 'fallback.web', 'other.gtk']) {
    writeFileSync(join(dir, `src/${name}.ts`), 'export {}\n')
  }
  const loaded = loadEnvManifest(dir)
  loaded.manifest.environments.linux = { include: ['src/*.ts'] }
  loaded.manifest.environments.gtk = { include: ['src/*.ts'] }
  const programs = expandEnvPrograms(dir, loaded)
  assert.equal(programs.some((p) => p.env === 'all'), false)
  const linux = programs.find((p) => p.env === 'linux')
  const gtk = programs.find((p) => p.env === 'gtk')
  assert.deepEqual(config(linux).compilerOptions.moduleSuffixes, ['.linux', '.web', ''])
  assert.deepEqual(config(gtk).compilerOptions.moduleSuffixes, ['.gtk', ''])
  assert.ok(config(linux).compilerOptions.lib.includes('DOM'))
  assert.ok(!config(gtk).compilerOptions.lib.includes('DOM'))
  assert.ok(linux.files.includes(join(dir, 'src/widget.linux.ts')))
  assert.ok(linux.files.includes(join(dir, 'src/fallback.web.ts')))
  assert.ok(!linux.files.includes(join(dir, 'src/widget.web.ts')))
  assert.ok(!gtk.files.some((f) => /\.(web|linux|ios|android)\.ts$/.test(f)))
  assert.ok(gtk.files.some((f) => f.endsWith('linux-gtk-renderer/src/host-globals.d.ts')))
  for (const p of [linux, gtk]) {
    assert.deepEqual(config(p).compilerOptions.types, [])
    assert.ok(p.files.some((f) => f.includes(`isolation-${p.env}.ts`)))
  }
})
