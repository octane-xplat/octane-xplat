import assert from 'node:assert/strict'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'

import { spawnSync } from 'node:child_process'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parse as parseYaml } from 'yaml'
import { compatibility, managedPackage, managedSpecifier } from '../dist/compatibility.js'

// Dep values must track the template, not a pinned snapshot — releases bump
// template/package.json in lockstep.
const TPL = JSON.parse(readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf8'))
const LIB_TPL = JSON.parse(readFileSync(join(LIBRARY_TEMPLATE_DIR, 'package.json'), 'utf8'))
const CLI_PATCHES = fileURLToPath(new URL('../../cli/patches', import.meta.url))
const creator = fileURLToPath(new URL('../dist/index.js', import.meta.url))
import {
  composeTargets,
  composeLibrary,
  composeManifest,
  composePnpmWorkspace,
  applyTarget,
  resolveTargets,
  targetEnabled,
  nativeCorePaths,
  TEMPLATE_DIR,
  LIBRARY_TEMPLATE_DIR,
} from '../dist/scaffold.js'

const ALL = ['web', 'ios', 'android']

test('published scaffold entry resolves to a built file', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  for (const target of Object.values(manifest.exports)) {
    const entry = typeof target === 'string' ? target : target.default
    assert.ok(
      existsSync(new URL(`../${entry}`, import.meta.url)),
      `missing published entry: ${entry}`,
    )
  }
})

function project(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-scaffold-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

test('composing the full target set reproduces the template byte-for-byte', (t) => {
  const dir = project(t)
  composeTargets(ALL, dir)

  for (const rel of ['package.json', 'tsconfig.json', 'vite.config.ts', 'nativescript.config.ts']) {
    assert.equal(
      readFileSync(join(dir, rel), 'utf8'),
      readFileSync(join(TEMPLATE_DIR, rel), 'utf8'),
      `${rel} differs from template`,
    )
  }
})

test('web-only scaffold drops patch entries for packages it never installs', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir)

  const yaml = readFileSync(join(dir, 'package.json'), 'utf8')
  assert.ok(yaml.includes(`octane@${managedSpecifier('octane')}`))
  assert.doesNotMatch(yaml, /@tsrx\/typescript-plugin@/)
  const pkg = JSON.parse(yaml)
  assert.equal(pkg.devDependencies['@tsrx/content-mapper'], 'catalog:xplat')
  // The shared compiler profile includes the classic parser for content mapping.
  assert.equal(pkg.devDependencies['typescript-classic'], 'catalog:xplat')
  assert.equal(pkg.packageManager, 'bun@1.4.4')
  for (const path of Object.values(pkg.patchedDependencies)) {
    assert.ok(existsSync(join(dir, path)))
  }
  assert.doesNotMatch(yaml, /@nativescript\/core@9\.1\.3/)
  assert.doesNotMatch(yaml, /@nativescript\/vite@8\.0\.17/)

  const native = project(t)
  composeTargets(['ios'], native)
  const nativeYaml = readFileSync(join(native, 'package.json'), 'utf8')
  assert.match(nativeYaml, /@nativescript\/core@9\.1\.3/)
  assert.equal(JSON.parse(nativeYaml).devDependencies['typescript-classic'], 'catalog:xplat')
})

// Oxlint 1.90.0's optional checker peer wants >=7.0.2005; generated
// workspaces must carry the managed pin so isolated installs stay
// peer-compatible (registry resolved 7.0.2002 without it).
test('generated workspaces carry the managed oxlint-tsgolint override', (t) => {
  for (const ids of [['web'], ALL]) {
    const dir = project(t)
    composeTargets(ids, dir)
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    assert.equal(pkg.overrides['oxlint-tsgolint'], '7.0.2005')
  }

  const dir = project(t)
  composeLibrary(join(dir, 'travel-controls'), '@example/travel-controls')
  const pkg = JSON.parse(readFileSync(join(dir, 'travel-controls/package.json'), 'utf8'))
  assert.equal(pkg.overrides['oxlint-tsgolint'], '7.0.2005')
})

test('every target-owned file exists in the template', async () => {
  const { targets } = await import('../dist/scaffold.js')
  for (const [id, target] of Object.entries(targets)) {
    for (const rel of target.files) {
      assert.ok(existsSync(join(TEMPLATE_DIR, rel)), `${id} claims missing file ${rel}`)
    }
  }
})

test('web-only scaffold drops native files, deps, and scripts', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir)

  assert.ok(existsSync(join(dir, 'index.html')))
  assert.ok(existsSync(join(dir, 'src/main.web.tsrx')))
  assert.equal(
    readFileSync(join(dir, 'src/main.tsrx'), 'utf8'),
    '// Type contract only.\nexport {}\n',
  )
  assert.ok(!existsSync(join(dir, 'nativescript.config.ts')))
  assert.ok(!existsSync(join(dir, 'src/main.ts')))
  assert.ok(!existsSync(join(dir, 'App_Resources')))

  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(manifest.main, undefined)
  assert.equal(manifest.scripts.dev, 'xplat dev web')
  assert.equal(manifest.scripts['dev:ios'], undefined)
  assert.equal(manifest.scripts.typecheck, 'xplat typecheck')
  assert.equal(manifest.scripts.lint, 'xplat lint')
  assert.equal(manifest.scripts['lint:fix'], 'xplat lint --fix')
  assert.equal(manifest.devDependencies.oxlint, undefined)
  assert.equal(manifest.devDependencies['@octane-xplat/lint'], undefined)
  assert.ok(!('dependencies' in manifest && '@nativescript/core' in manifest.dependencies))
  assert.equal(manifest.devDependencies['@nativescript/ios'], undefined)
  assert.equal(manifest.devDependencies['octane-xplat'], 'catalog:xplat')
  assert.equal(manifest.devDependencies['@octane-xplat/cli'], undefined)
  assert.equal(manifest.devDependencies['@octanejs/vite-plugin'], undefined)

  // Web testing is included without the native runner, specs or scripts.
  assert.ok(!existsSync(join(dir, 'vitest.config.mts')))
  assert.ok(!existsSync(join(dir, 'src', 'test.ts')))
  assert.equal(manifest.scripts['test:ios'], undefined)
  assert.equal(manifest.devDependencies.vitest, 'catalog:xplat')
  assert.equal(manifest.devDependencies.jsdom, 'catalog:xplat')
  assert.equal(manifest.scripts['test:web'], 'vitest run --config vitest.web.config.mts')
  assert.ok(existsSync(join(dir, 'src/app.web.test.tsx')))
  assert.equal(manifest.devDependencies['@nativescript/unit-test-runner'], undefined)

  assert.equal(manifest.dependencies['@octane-xplat/ui'], TPL.dependencies['@octane-xplat/ui'])
})

test('ios-only scaffold carries shared native machinery but not android', (t) => {
  const dir = project(t)
  composeTargets(['ios'], dir)

  assert.ok(existsSync(join(dir, 'nativescript.config.ts')))
  assert.ok(existsSync(join(dir, 'App_Resources/iOS/Info.plist')))
  assert.ok(!existsSync(join(dir, 'App_Resources/Android')))
  assert.ok(!existsSync(join(dir, 'index.html')))

  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(manifest.scripts['dev:android'], undefined)
  assert.equal(manifest.scripts.typecheck, 'xplat typecheck')

  assert.equal(
    manifest.devDependencies['@nativescript/ios'],
    TPL.devDependencies['@nativescript/ios'],
  )

  assert.equal(manifest.devDependencies['@nativescript/android'], undefined)

  assert.ok(existsSync(join(dir, 'src', 'test.ts')))
  assert.ok(existsSync(join(dir, 'src', 'app.spec.tsrx')))
  assert.ok(existsSync(join(dir, 'vitest.config.mts')))
  assert.equal(manifest.scripts['test:ios'], 'ns test ios')
  assert.equal(manifest.scripts['test:android'], undefined)
  assert.equal(manifest.devDependencies.vitest, 'catalog:xplat')
  assert.equal(manifest.devDependencies['@nativescript/unit-test-runner'], 'catalog:xplat')
  assert.equal(manifest.devDependencies.jsdom, undefined)
})

test('resolveTargets expands requires and rejects unknown targets', () => {
  assert.deepEqual(resolveTargets(['ios']), ['native-shared', 'ios'])
  assert.deepEqual(resolveTargets(['ios', 'android']), ['native-shared', 'ios', 'android'])
  assert.throws(() => resolveTargets(['beos']), /unknown target "beos"/)
})

test('applyTarget adds a platform to a web-only app without clobbering edits', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir)

  // User modified an existing file and a script — both must survive.
  writeFileSync(join(dir, 'tsconfig.json'), '{ "custom": true }\n')
  const before = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  before.scripts.lint = 'custom-lint'
  writeFileSync(join(dir, 'package.json'), JSON.stringify(before, null, '\t') + '\n')

  const report = applyTarget(dir, 'ios')
  assert.deepEqual(report.enabled, ['native-shared', 'ios'])
  assert.ok(existsSync(join(dir, 'nativescript.config.ts')))
  assert.ok(existsSync(join(dir, 'App_Resources/iOS/Info.plist')))
  assert.ok(!existsSync(join(dir, 'App_Resources/Android')))
  // applyTarget patches the app tsconfig (native ambient root + entrypoint)
  // but preserves unrelated user keys.
  const tsconfig = JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8'))
  assert.equal(tsconfig.custom, true)
  assert.ok(tsconfig.files.includes('references.d.ts'))

  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(manifest.main, 'src/main.ts')
  assert.equal(manifest.scripts.lint, 'custom-lint')
  assert.equal(manifest.scripts['dev:ios'], 'ns run ios')
  assert.equal(manifest.scripts.typecheck, 'xplat typecheck')

  assert.equal(
    manifest.devDependencies['@nativescript/ios'],
    TPL.devDependencies['@nativescript/ios'],
  )

  assert.equal(manifest.dependencies['@nativescript/core'], TPL.dependencies['@nativescript/core'])

  // The web-only scaffold's yaml lacked native patch entries — add restores
  // them so the next `bun install` doesn't miss the framework patches.
  const yaml = readFileSync(join(dir, 'package.json'), 'utf8')
  assert.match(yaml, /@nativescript\/core@9\.1\.3/)
  assert.ok(
    yaml.includes(
      `@nativescript-community/octane@${managedSpecifier('@nativescript-community/octane')}`,
    ),
  )
  assert.ok(report.patchesAdded)
})

test('applyTarget is idempotent and detects already-enabled targets', (t) => {
  const dir = project(t)
  composeTargets(ALL, dir)

  const report = applyTarget(dir, 'ios')
  assert.deepEqual(report.enabled, [])
  assert.deepEqual(report.already, ['native-shared', 'ios'])

  const second = applyTarget(dir, 'web')
  assert.deepEqual(second.enabled, [])
  assert.deepEqual(second.already, ['web'])
})

test('native scaffolds pin @nativescript/core to the app install in tsconfig paths', (t) => {
  const web = project(t)
  composeTargets(['web'], web)
  const webConfig = JSON.parse(readFileSync(join(web, 'tsconfig.json'), 'utf8'))
  assert.equal(webConfig.compilerOptions.paths, undefined)

  // Linked framework checkouts carry their own core copy; the pin keeps one
  // type identity (issue #66). The template stays the source of truth.
  const dir = project(t)
  composeTargets(['ios'], dir)
  const config = JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8'))
  assert.deepEqual(config.compilerOptions.paths, nativeCorePaths)

  // `xplat add` merges the pin and preserves authored mappings.
  const added = project(t)
  composeTargets(['web'], added)
  const existing = JSON.parse(readFileSync(join(added, 'tsconfig.json'), 'utf8'))
  existing.compilerOptions.paths = {
    '@nativescript/core': ['./custom/core'],
    'app/*': ['./src/*'],
  }
  writeFileSync(join(added, 'tsconfig.json'), JSON.stringify(existing))
  applyTarget(added, 'ios')
  const merged = JSON.parse(readFileSync(join(added, 'tsconfig.json'), 'utf8')).compilerOptions
    .paths
  assert.deepEqual(merged['@nativescript/core'], ['./custom/core'])
  assert.deepEqual(merged['@nativescript/core/*'], ['./node_modules/@nativescript/core/*'])
  assert.deepEqual(merged['app/*'], ['./src/*'])
})

test('targetEnabled reads sentinels', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir)
  assert.equal(targetEnabled(dir, 'web'), true)
  assert.equal(targetEnabled(dir, 'ios'), false)
  assert.equal(targetEnabled(dir, 'native-shared'), false)

  const native = mkdtempSync(join(tmpdir(), 'xplat-scaffold-'))
  t.after(() => rmSync(native, { recursive: true, force: true }))
  composeTargets(['ios'], native)
  assert.equal(targetEnabled(native, 'ios'), true)
  assert.equal(targetEnabled(native, 'web'), false)
})

test('default apps carry no unused feature plugins for any target set', (t) => {
  for (const ids of [['web'], ['ios'], ['android'], ALL]) {
    const dir = project(t)
    composeTargets(ids, dir)
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      '@octane-xplat/effects',
      '@octane-xplat/image',
      '@nativescript-community/gesturehandler',
      '@nativescript-community/ui-drawer',
    ]) {
      assert.equal(deps[name], undefined, `${ids}: unexpected ${name}`)
    }

    assert.equal(pkg.xplat, undefined)
  }
})

test('default testing includes only enabled platforms with framework-managed versions', (t) => {
  for (const ids of [['web'], ['ios'], ['android'], ALL]) {
    const dir = project(t)
    composeTargets(ids, dir)
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const web = ids.includes('web')
    const native = ids.includes('ios') || ids.includes('android')
    assert.equal(pkg.devDependencies.vitest, 'catalog:xplat')
    assert.equal(pkg.devDependencies.jsdom, web ? 'catalog:xplat' : undefined)
    assert.equal(
      pkg.devDependencies['@nativescript/unit-test-runner'],
      native ? 'catalog:xplat' : undefined,
    )

    assert.equal(Boolean(pkg.scripts['test:web']), web)
    assert.equal(Boolean(pkg.scripts['test:ios']), ids.includes('ios'))
    assert.equal(Boolean(pkg.scripts['test:android']), ids.includes('android'))
    assert.equal(existsSync(join(dir, 'src/app.web.test.tsx')), web)
    assert.equal(existsSync(join(dir, 'src/app.spec.tsrx')), native)
    assert.equal(existsSync(join(dir, 'vitest.config.mts')), native)
    assert.match(readFileSync(join(dir, 'package.json'), 'utf8'), /"vitest": "4/)
  }
})

test('adding a platform keeps user test scripts, dependency specs, and existing test files', (t) => {
  const dir = project(t)
  composeTargets(['ios'], dir)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  pkg.scripts.test = 'custom-test'
  pkg.devDependencies.vitest = 'file:../vitest'
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n')
  writeFileSync(join(dir, 'src/app.web.test.tsx'), '// custom test\n')
  const report = applyTarget(dir, 'web')
  assert.ok(report.scriptsSkipped.includes('test'))
  assert.ok(report.skipped.includes('src/app.web.test.tsx'))
  assert.equal(readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8'), '// custom test\n')
  const next = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(next.scripts.test, 'custom-test')
  assert.equal(next.devDependencies.vitest, 'file:../vitest')
  assert.equal(next.scripts['test:web'], 'vitest run --config vitest.web.config.mts')
  assert.deepEqual(applyTarget(dir, 'web').already, ['web'])
})

test('adding native or web includes its test setup and preserves existing tests', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir)
  const before = readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8')
  applyTarget(dir, 'ios')
  let pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:ios'], 'ns test ios')
  assert.equal(pkg.scripts['test:android'], undefined)
  assert.equal(pkg.devDependencies['@nativescript/unit-test-runner'], 'catalog:xplat')
  assert.equal(readFileSync(join(dir, 'src/app.web.test.tsx'), 'utf8'), before)
  applyTarget(dir, 'android')
  pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.scripts['test:android'], 'ns test android')
  const native = project(t)
  composeTargets(['android'], native)
  applyTarget(native, 'web')
  pkg = JSON.parse(readFileSync(join(native, 'package.json'), 'utf8'))
  assert.equal(pkg.devDependencies.jsdom, 'catalog:xplat')
  assert.ok(existsSync(join(native, 'src/app.web.test.tsx')))
})

test('creator includes tests for the selected platforms by default through the published bin', (t) => {
  const root = project(t)
  const dir = join(root, 'app')
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../dist/index.js', import.meta.url)),
      dir,
      '--targets',
      'web',
      '--no-install',
    ],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.devDependencies.vitest, 'catalog:xplat')
  assert.ok(pkg.scripts['test:web'])
  assert.equal(pkg.devDependencies['@nativescript/unit-test-runner'], undefined)
})

test('target planning is read-only and carries complete raw-byte observations', async (t) => {
  const { planTarget } = await import('../dist/scaffold.js')
  const dir = project(t)
  composeTargets(['web'], dir)
  const before = readFileSync(join(dir, 'package.json'))
  const plan = planTarget(dir, 'ios')
  assert.equal(existsSync(join(dir, 'nativescript.config.ts')), false)
  assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
  assert.equal(plan.version, 1)
  assert.ok(
    plan.inputs.some(
      (input) => input.path === join(dir, 'package.json') && /^[a-f0-9]{64}$/.test(input.sha256),
    ),
  )
  assert.ok(
    plan.files.some((file) => file.path === join(dir, 'package.json') && file.before !== null),
  )
  const result = applyTarget(dir, 'ios')
  assert.deepEqual(result, plan.report)
  for (const file of plan.files) {
    assert.deepEqual(readFileSync(file.path), Buffer.from(file.content, 'base64'))
  }
})

// --- Package-manager variants ------------------------------------------------

for (const pm of ['bun', 'pnpm']) {
  test(`target files, scripts, and deps are manager-independent (${pm})`, (t) => {
    for (const ids of [['web'], ['ios'], ALL]) {
      const dir = project(t)
      composeTargets(ids, dir, { packageManager: pm })
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
      const web = ids.includes('web')
      const native = ids.includes('ios') || ids.includes('android')
      assert.equal(existsSync(join(dir, 'index.html')), web)
      assert.equal(existsSync(join(dir, 'nativescript.config.ts')), native)
      assert.equal(Boolean(pkg.scripts.dev), web)
      assert.equal(Boolean(pkg.scripts['dev:ios']), ids.includes('ios'))
      assert.equal(
        Boolean(pkg.devDependencies['@nativescript/unit-test-runner']),
        native,
        `${pm} ${ids}`,
      )

      assert.equal(pkg.dependencies['@octane-xplat/ui'], TPL.dependencies['@octane-xplat/ui'])
    }
  })
}

test('pnpm manifest drops Bun config homes but keeps the same deps and scripts', () => {
  for (const ids of [['web'], ['ios'], ALL]) {
    const bun = composeManifest(ids)
    const pkg = composeManifest(ids, 'pnpm')
    assert.equal(pkg.workspaces, undefined)
    assert.equal(pkg.overrides, undefined)
    assert.equal(pkg.patchedDependencies, undefined)
    assert.equal(pkg.trustedDependencies, undefined)
    assert.equal(pkg.engines.bun, undefined)
    assert.equal(pkg.packageManager, `pnpm@${compatibility.tools.pnpm}`)
    assert.deepEqual(pkg.dependencies, bun.dependencies)
    assert.deepEqual(pkg.devDependencies, bun.devDependencies)
    assert.deepEqual(pkg.scripts, bun.scripts)
  }
})

test('pnpm-workspace.yaml mirrors the Bun manifest config homes in order', () => {
  const keys = [
    'packages',
    'catalogs',
    'overrides',
    'patchedDependencies',
    'allowUnusedPatches',
    'allowBuilds',
    'nodeLinker',
    'saveExact',
  ]
  for (const ids of [['web'], ['ios'], ALL]) {
    const bun = composeManifest(ids)
    const ws = parseYaml(composePnpmWorkspace(ids))
    assert.deepEqual(ws.packages, bun.workspaces.packages)
    assert.deepEqual(ws.catalogs, bun.workspaces.catalogs)
    assert.deepEqual(ws.overrides, bun.overrides)
    assert.deepEqual(ws.patchedDependencies, bun.patchedDependencies)
    assert.equal(ws.allowUnusedPatches, true)
    assert.equal(ws.nodeLinker, 'hoisted')
    assert.equal(ws.saveExact, true)
    assert.deepEqual(Object.keys(ws), keys)
  }
})

test('allowBuilds approves the trusted set and follows target claims', () => {
  const web = parseYaml(composePnpmWorkspace(['web']))
  assert.equal(web.allowBuilds.esbuild, true)
  assert.equal(web.allowBuilds['@parcel/watcher'], true)
  assert.equal(web.allowBuilds.nativescript, undefined)
  assert.equal(web.allowBuilds['@nativescript/core'], false)
  assert.equal(web.allowBuilds.protobufjs, false)

  const native = parseYaml(composePnpmWorkspace(['ios']))
  assert.equal(native.allowBuilds.nativescript, true)
  assert.equal(native.allowBuilds['@nativescript/core'], false)
  assert.equal(native.allowBuilds.protobufjs, false)
})

test('pnpm scaffold skips bunfig.toml and selects pnpm in nativescript.config.ts', (t) => {
  const dir = project(t)
  composeTargets(ALL, dir, { packageManager: 'pnpm' })
  assert.ok(!existsSync(join(dir, 'bunfig.toml')))
  assert.ok(existsSync(join(dir, 'pnpm-workspace.yaml')))
  assert.match(readFileSync(join(dir, 'nativescript.config.ts'), 'utf8'), /packageManager: 'pnpm'/)
})

test('pnpm scaffold patch entries point at canonical patch bytes', (t) => {
  const dir = project(t)
  composeTargets(ALL, dir, { packageManager: 'pnpm' })
  const ws = parseYaml(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'))
  for (const [specifier, path] of Object.entries(ws.patchedDependencies)) {
    const file = join(dir, path)
    assert.ok(existsSync(file), `${specifier} → ${path}`)
    assert.deepEqual(
      readFileSync(file),
      readFileSync(join(TEMPLATE_DIR, path)),
      `${specifier} differs from the starter patch`,
    )

    assert.deepEqual(
      readFileSync(file),
      readFileSync(join(CLI_PATCHES, basename(path))),
      `${specifier} differs from the canonical patch`,
    )
  }
})

// The starter registries must stay keyed by the pnpm identity form the
// canonical manifest uses — bunSpecifiers exist only for Bun installs where
// the tarball identity differs.
test('template patch keys are the canonical pnpm specifiers', () => {
  const manifest = JSON.parse(readFileSync(join(CLI_PATCHES, 'manifest.json'), 'utf8'))
  const wanted = manifest.patches
    .filter((patch) => {
      const at = patch.specifier.indexOf('@', 1)
      const pin = managedPackage(patch.specifier.slice(0, at))
      return patch.template !== false && (!pin || pin.version === patch.specifier.slice(at + 1))
    })
    .map((patch) => patch.specifier)
  assert.deepEqual(Object.keys(TPL.patchedDependencies), wanted)
  assert.deepEqual(Object.keys(LIB_TPL.patchedDependencies), wanted)
})

function* walkFiles(dir, prefix = '') {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') {
      continue
    }

    const rel = prefix ? `${prefix}/${name}` : name
    if (statSync(join(dir, name)).isDirectory()) {
      yield* walkFiles(join(dir, name), rel)
    } else {
      yield rel
    }
  }
}

// files that legitimately keep `bun`/`bunx` tokens in pnpm output — each is a
// runtime branch on the package's own manager, not translated text.
const bunTokenExceptions = new Set(['tests/packed-consumer.mjs'])

test('no bun command tokens survive in translated scaffold text', (t) => {
  for (const variant of ['app', 'library']) {
    const dir = project(t)
    if (variant === 'app') {
      composeTargets(ALL, dir, { packageManager: 'pnpm' })
    } else {
      composeLibrary(dir, 'my-lib', { packageManager: 'pnpm' })
    }

    for (const rel of walkFiles(dir)) {
      if (rel.startsWith('patches/') || bunTokenExceptions.has(rel)) {
        continue
      }

      assert.doesNotMatch(
        readFileSync(join(dir, rel), 'utf8'),
        /\bbunx?\b/,
        `${variant}:${rel} still names bun`,
      )
    }
  }
})

test('library scaffold gets the same pnpm split', (t) => {
  const dir = join(project(t), 'lib')
  composeLibrary(dir, 'my-lib', { packageManager: 'pnpm' })
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.packageManager, `pnpm@${compatibility.tools.pnpm}`)
  assert.equal(pkg.workspaces, undefined)
  assert.equal(pkg.overrides, undefined)
  assert.equal(pkg.patchedDependencies, undefined)
  assert.equal(pkg.trustedDependencies, undefined)
  assert.equal(pkg.engines.bun, undefined)
  assert.equal(pkg.scripts.prepack, 'pnpm run typegen && tsrx-typegen --pack-check')
  assert.equal(pkg.scripts['pack:check'], 'pnpm run test:packed')

  const ws = parseYaml(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'))
  assert.deepEqual(ws.catalogs, LIB_TPL.workspaces.catalogs)
  assert.deepEqual(ws.overrides, LIB_TPL.overrides)
  assert.deepEqual(ws.patchedDependencies, LIB_TPL.patchedDependencies)
  assert.equal(ws.allowBuilds.esbuild, true)
  assert.equal(ws.allowBuilds['@parcel/watcher'], true)
  assert.ok(!existsSync(join(dir, 'bunfig.toml')))
  assert.match(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), /pnpm dlx @octane-xplat\/cli/)

  // The packed-consumer check packs with whichever manager the manifest pins.
  const consumer = readFileSync(join(dir, 'tests/packed-consumer.mjs'), 'utf8')
  assert.match(consumer, /pnpm.*pack/)
  assert.match(consumer, /packageManager/)
})

function managerStubDir(t, entries) {
  const dir = mkdtempSync(join(tmpdir(), 'xplat-bin-stub-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  for (const [name, script] of Object.entries(entries)) {
    const file = join(dir, name)
    writeFileSync(file, script)
    chmodSync(file, 0o755)
  }

  return dir
}

// Restrict PATH to the stub dir plus system dirs so the creator's
// `bun --version`/`pnpm --version` probes see exactly the stubbed set.
const stubEnv = (stub, extra = {}) => ({
  ...process.env,
  PATH: `${stub}:/usr/bin:/bin`,
  ...extra,
})

test('bin --package-manager pnpm produces pnpm-workspace.yaml', (t) => {
  const root = project(t)
  const dir = join(root, 'app')
  const result = spawnSync(
    process.execPath,
    [creator, dir, '--package-manager', 'pnpm', '--no-install', '--targets', 'web'],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.ok(existsSync(join(dir, 'pnpm-workspace.yaml')))
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.packageManager, `pnpm@${compatibility.tools.pnpm}`)
})

test('bin --package-manager validates its value', () => {
  const bad = spawnSync(
    process.execPath,
    [creator, 'app', '--package-manager', 'npm', '--no-install', '--targets', 'web'],
    { encoding: 'utf8' },
  )
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /--package-manager must be bun or pnpm/)

  const missing = spawnSync(
    process.execPath,
    [creator, 'app', '--package-manager', '--no-install', '--targets', 'web'],
    { encoding: 'utf8' },
  )
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /ambiguous/)
})

test('bin parseArgs errors carry the ✗ prefix', (t) => {
  const root = project(t)
  const cases = [
    [['--target', 'web', '--no-install'], /Unknown option '--target'/],
    [[join(root, 'a'), join(root, 'b'), '--no-install'], /expected one project directory/],
    [[join(root, 'c'), '--template', 'nope', '--no-install'], /--template must be app or library/],
    [[join(root, 'd'), '--name', '--targets', 'web', '--no-install'], /ambiguous/],
  ]
  for (const [args, pattern] of cases) {
    const result = spawnSync(process.execPath, [creator, ...args], { encoding: 'utf8' })
    assert.equal(result.status, 1, String(args))
    assert.match(result.stderr, pattern, String(args))
  }
})

test('bin --package-manager=pnpm equals form scaffolds a pnpm project', (t) => {
  const root = project(t)
  const dir = join(root, 'eq-app')
  const result = spawnSync(
    process.execPath,
    [creator, dir, '--package-manager=pnpm', '--no-install', '--targets', 'web'],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.ok(existsSync(join(dir, 'pnpm-workspace.yaml')))
})

test('bin picks the invoking user agent when no flag is given', (t) => {
  const stub = managerStubDir(t, {
    bun: '#!/bin/sh\necho 1.4.4\n',
    pnpm: '#!/bin/sh\necho 11.24.0\n',
  })

  const root = project(t)
  const pnpmApp = join(root, 'via-pnpm')
  const result = spawnSync(
    process.execPath,
    [creator, pnpmApp, '--no-install', '--targets', 'web'],
    {
      encoding: 'utf8',
      env: stubEnv(stub, { npm_config_user_agent: 'pnpm/11.24.0 npm/? node/? darwin arm64' }),
    },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.ok(existsSync(join(pnpmApp, 'pnpm-workspace.yaml')))

  const bunApp = join(root, 'via-bun')
  const second = spawnSync(
    process.execPath,
    [creator, bunApp, '--no-install', '--targets', 'web'],
    {
      encoding: 'utf8',
      env: stubEnv(stub, { npm_config_user_agent: 'bun/1.4.4 npm/? node/? darwin arm64' }),
    },
  )
  assert.equal(second.status, 0, second.stderr)
  assert.ok(existsSync(join(bunApp, 'bunfig.toml')))
  assert.ok(!existsSync(join(bunApp, 'pnpm-workspace.yaml')))
})

test('bin scaffolds the Bun variant with a warning when no manager is installed', (t) => {
  const stub = managerStubDir(t, {})
  const root = project(t)
  const dir = join(root, 'app')
  const result = spawnSync(process.execPath, [creator, dir, '--no-install', '--targets', 'web'], {
    encoding: 'utf8',
    env: stubEnv(stub, { npm_config_user_agent: 'npm/11.0.0 node/? darwin arm64' }),
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Neither Bun nor pnpm was found/)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  assert.equal(pkg.packageManager, 'bun@1.4.4')
  assert.ok(existsSync(join(dir, 'bunfig.toml')))
  assert.ok(!existsSync(join(dir, 'pnpm-workspace.yaml')))
})

test('bin scaffolds a pnpm project without installing when pnpm is missing', (t) => {
  const stub = managerStubDir(t, { bun: '#!/bin/sh\necho 1.4.4\n' })
  const root = project(t)
  const dir = join(root, 'app')
  const result = spawnSync(
    process.execPath,
    [creator, dir, '--package-manager', 'pnpm', '--no-install', '--targets', 'web'],
    { encoding: 'utf8', env: stubEnv(stub) },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /pnpm was selected but is not installed/)
  assert.ok(existsSync(join(dir, 'pnpm-workspace.yaml')))
})

test('pack ships the bunfig template and Bun scaffolds land it as bunfig.toml', (t) => {
  const dry = spawnSync('bun', ['pm', 'pack', '--dry-run'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  })
  assert.equal(dry.status, 0, dry.stderr)
  assert.match(dry.stdout, /template\/bunfig$|template\/bunfig[\r\n]/m)
  assert.match(dry.stdout, /library-template\/bunfig$|library-template\/bunfig[\r\n]/m)

  const dir = project(t)
  composeTargets(ALL, dir)
  const bunfig = readFileSync(join(dir, 'bunfig.toml'), 'utf8')
  assert.match(bunfig, /linker = "hoisted"/)
  assert.match(bunfig, /exact = true/)

  const lib = join(project(t), 'lib')
  composeLibrary(lib, 'my-lib')
  assert.match(readFileSync(join(lib, 'bunfig.toml'), 'utf8'), /linker = "hoisted"/)
})

test('applyTarget on a pnpm scaffold updates pnpm-workspace.yaml, not package.json', (t) => {
  const dir = project(t)
  composeTargets(['web'], dir, { packageManager: 'pnpm' })

  // User edits: a comment and an unrelated key plus a custom allowBuilds entry.
  const yamlPath = join(dir, 'pnpm-workspace.yaml')
  writeFileSync(
    yamlPath,
    readFileSync(yamlPath, 'utf8')
      .replace('allowBuilds:', '# user comment\nallowBuilds:\n  my-pkg: true')
      .replace('saveExact: true', 'saveExact: true\nuserKey: keep-me'),
  )

  const report = applyTarget(dir, 'ios')
  assert.deepEqual(report.enabled, ['native-shared', 'ios'])
  const ws = parseYaml(readFileSync(yamlPath, 'utf8'))
  for (const name of ['@nativescript/ios', '@nativescript/core', 'nativescript']) {
    assert.ok(ws.catalogs.xplat[name], `catalog missing ${name}`)
  }

  for (const specifier of Object.keys(TPL.patchedDependencies)) {
    assert.ok(ws.patchedDependencies[specifier], `patch entry missing ${specifier}`)
    const file = join(dir, ws.patchedDependencies[specifier])
    assert.deepEqual(
      readFileSync(file),
      readFileSync(join(TEMPLATE_DIR, ws.patchedDependencies[specifier])),
    )
  }

  assert.equal(ws.allowBuilds.nativescript, true)
  assert.equal(ws.allowBuilds['@nativescript/core'], false)
  assert.equal(ws.allowBuilds['my-pkg'], true)
  assert.equal(ws.userKey, 'keep-me')
  assert.match(readFileSync(yamlPath, 'utf8'), /# user comment/)

  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  for (const field of ['workspaces', 'overrides', 'patchedDependencies', 'trustedDependencies']) {
    assert.equal(pkg[field], undefined, `package.json gained Bun field ${field}`)
  }
  assert.ok(pkg.devDependencies['@nativescript/ios'])
  assert.ok(pkg.dependencies['@nativescript/core'])
})

test('planTarget on a pnpm scaffold observes the yaml with a content hash', async (t) => {
  const dir = project(t)
  composeTargets(['web'], dir, { packageManager: 'pnpm' })
  const { planTarget } = await import('../dist/scaffold.js')
  const plan = planTarget(dir, 'ios')
  const yaml = plan.inputs.find((input) => input.path === join(dir, 'pnpm-workspace.yaml'))
  assert.ok(yaml, 'pnpm-workspace.yaml is not a plan input')
  assert.equal(yaml.kind, 'file')
  assert.match(yaml.sha256, /^[a-f0-9]{64}$/)
})

test('compatibilityRoot returns the pnpm-workspace root owning the app', async (t) => {
  const { compatibilityRoot } = await import('../dist/compatibility.js')
  const root = join(project(t), 'ws')
  mkdirSync(root, { recursive: true })
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n')
  writeFileSync(join(root, 'package.json'), '{"private":true,"packageManager":"pnpm@11.24.0"}\n')
  const app = join(root, 'apps/app')
  composeTargets(['web'], app, { packageManager: 'pnpm' })
  assert.equal(compatibilityRoot(app), root)

  // A bun-pinned ancestor keeps its package.json workspaces semantics.
  const bun = join(project(t), 'ws2')
  mkdirSync(bun, { recursive: true })
  writeFileSync(
    join(bun, 'package.json'),
    '{"private":true,"packageManager":"bun@1.4.4","workspaces":["apps/*"]}\n',
  )
  writeFileSync(join(bun, 'pnpm-workspace.yaml'), 'packages:\n  - other/*\n')
  const bunApp = join(bun, 'apps/app')
  composeTargets(['web'], bunApp)
  assert.equal(compatibilityRoot(bunApp), bun)
})
