import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import {
  checkEnvPrograms,
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

    assert.equal(c.extends, '../tsconfig.envs.json')
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
    [
      { ...entries, gtk: { files: ['src/shared.ts'], compilerOptions: { lib: ['DOM'] } } },
      {},
      /DOM libraries/,
    ],
    [
      {
        ...entries,
        gtk: { files: ['src/shared.ts'], compilerOptions: { types: ['@nativescript/types-ios'] } },
      },
      {},
      /ios SDK/,
    ],
    [{ ...entries, linux: { files: ['src/shared.ts'] } }, {}, /linux.*retired/],
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

test('generated configs stay valid after the checkout moves', () => {
  const dir = fixture(entries)
  const programs = expand(dir)
  const moved = dir + '-moved'
  tmp.push(moved)
  renameSync(dir, moved)

  for (const p of programs) {
    const configPath = p.configPath.replace(dir, moved)
    const c = config({ configPath })

    for (const file of [c.extends, ...c.files]) {
      assert.equal(isAbsolute(file), false, `${configPath} emits absolute path ${file}`)
      assert.ok(
        existsSync(resolve(dirname(configPath), file)),
        `${configPath}: ${file} does not resolve after move`,
      )
    }
  }
})

test('a bare platform SDK entry resolves transitively through the umbrella package', () => {
  const dir = fixture({
    web: entries.web,
    ios: {
      files: ['src/index.ts', 'src/index.ios.ts', 'src/shared.ts'],
      compilerOptions: { types: ['@nativescript/types-ios'] },
    },
    android: {
      files: ['src/index.ts', 'src/index.android.ts', 'src/shared.ts'],
      compilerOptions: { types: ['@nativescript/types-android'] },
    },
    macos: entries.macos,
    windows: entries.windows,
  })

  // Isolated layouts keep the per-SDK packages nested under the umbrella —
  // they are never direct dependencies of the project.
  const umbrella = join(dir, 'node_modules/@nativescript/types')
  mkdirSync(join(umbrella, 'node_modules/@nativescript/types-ios'), { recursive: true })
  mkdirSync(join(umbrella, 'node_modules/@nativescript/types-android'), { recursive: true })
  writeFileSync(
    join(umbrella, 'package.json'),
    JSON.stringify({ name: '@nativescript/types', types: 'index.d.ts' }),
  )
  writeFileSync(join(umbrella, 'globals.d.ts'), '')
  for (const sdk of ['ios', 'android']) {
    writeFileSync(
      join(umbrella, `node_modules/@nativescript/types-${sdk}/package.json`),
      JSON.stringify({ name: `@nativescript/types-${sdk}`, types: 'index.d.ts' }),
    )
    writeFileSync(join(umbrella, `node_modules/@nativescript/types-${sdk}/index.d.ts`), '')
  }

  for (const program of expand(dir).filter((p) => p.env === 'ios' || p.env === 'android')) {
    const types = config(program).compilerOptions.types

    assert.equal(types.length, 2)
    assert.ok(
      types.every((entry) => entry.endsWith('.d.ts')),
      `${program.env} emits resolvable declaration paths, not bare package names`,
    )
    assert.ok(types.some((entry) => entry.endsWith('@nativescript/types/globals.d.ts')))
    assert.ok(types.some((entry) => entry.endsWith(`types-${program.env}/index.d.ts`)))
  }
})

test('a project-installed host package wins the ambient declaration reference', () => {
  const dir = fixture(entries)
  const ambient = join(dir, 'node_modules/@octane-xplat/macos-appkit/src/host-globals.d.ts')

  mkdirSync(dirname(ambient), { recursive: true })
  writeFileSync(ambient, '')

  const macos = expand(dir).find((p) => p.env === 'macos')

  assert.ok(
    config(macos).compilerOptions.types.includes(
      '../node_modules/@octane-xplat/macos-appkit/src/host-globals.d.ts',
    ),
    'the stable package path replaces the workspace fallback',
  )
})

test('check mode reports stale, missing, retired, and unreferenced programs', () => {
  const dir = fixture(entries)
  const programs = expand(dir)
  const loaded = () => loadEnvManifest(dir)

  checkEnvPrograms(dir, loaded())
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(envSolution(programs, dir)))
  checkEnvPrograms(dir, loaded())

  writeFileSync(programs[0].configPath, '{}\n')
  assert.throws(() => checkEnvPrograms(dir, loaded()), /does not match the manifest expansion/)
  expand(dir)
  checkEnvPrograms(dir, loaded())

  writeFileSync(join(dir, 'xplat-typecheck/linux.json'), '{}\n')
  assert.throws(() => checkEnvPrograms(dir, loaded()), /belongs to a retired target/)
  expand(dir)
  assert.equal(existsSync(join(dir, 'xplat-typecheck/linux.json')), false)

  rmSync(programs[1].configPath)
  assert.throws(() => checkEnvPrograms(dir, loaded()), /is missing/)
  expand(dir)

  const solution = envSolution(programs, dir)
  solution.references.pop()
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(solution))
  assert.throws(() => checkEnvPrograms(dir, loaded()), /does not reference/)

  solution.references.push({ path: './xplat-typecheck/linux.json' })
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(solution))
  assert.throws(() => checkEnvPrograms(dir, loaded()), /retired program/)
})

test('removing an environment prunes its tracked programs', () => {
  const dir = fixture(entries)
  expand(dir)
  assert.ok(existsSync(join(dir, 'xplat-typecheck/windows.json')))

  rmSync(join(dir, 'src/index.windows.ts'))
  const loaded = loadEnvManifest(dir)
  delete loaded.manifest.environments.windows
  expandEnvPrograms(dir, loaded)
  writeFileSync(join(dir, 'tsconfig.envs.json'), JSON.stringify(loaded.manifest))

  assert.equal(existsSync(join(dir, 'xplat-typecheck/windows.json')), false)
  assert.equal(existsSync(join(dir, 'xplat-typecheck/isolation-windows.ts')), false)
  checkEnvPrograms(dir, loadEnvManifest(dir))
})

test('native Linux uses GTK declarations and no browser suffix fallback', () => {
  const dir = fixture(entries)
  for (const name of ['widget.web', 'widget.gtk', 'index.linux']) {
    writeFileSync(join(dir, `src/${name}.ts`), 'export {}\n')
  }
  const loaded = loadEnvManifest(dir)
  loaded.manifest.environments.gtk = { include: ['src/*.ts'] }
  const programs = expandEnvPrograms(dir, loaded)
  assert.equal(
    programs.some((p) => p.env === 'all' || p.env === 'linux'),
    false,
  )
  const gtk = programs.find((p) => p.env === 'gtk')
  assert.deepEqual(config(gtk).compilerOptions.moduleSuffixes, ['.gtk', ''])
  assert.deepEqual(config(gtk).compilerOptions.customConditions, ['gtk', 'native'])
  assert.ok(!config(gtk).compilerOptions.lib.includes('DOM'))
  assert.ok(gtk.files.includes(join(dir, 'src/widget.gtk.ts')))
  assert.ok(
    gtk.files.includes(join(dir, 'src/index.linux.ts')),
    'retain explicit native service barrel coverage',
  )
  assert.ok(!gtk.files.some((f) => /\.(web|ios|android)\.ts$/.test(f)))
  assert.ok(gtk.files.some((f) => f.endsWith('linux-gtk-renderer/src/host-globals.d.ts')))
  assert.deepEqual(config(gtk).compilerOptions.types, [])
  assert.ok(gtk.files.some((f) => f.includes('isolation-gtk.ts')))
})
