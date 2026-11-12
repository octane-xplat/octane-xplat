import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverDevtoolsPanels } from '../src/host/panels.ts'

// Temp-dir node_modules fixtures: a fake project whose deps carry (or lack)
// the octaneXplat.devtoolsPanel field.
function makeProject(t) {
  const root = mkdtempSync(join(tmpdir(), 'dt-panels-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))

  const write = (rel, content) => {
    const file = join(root, rel)

    mkdirSync(join(file, '..'), { recursive: true })
    writeFileSync(file, content)
  }

  const project = (manifest) => write('package.json', JSON.stringify(manifest))
  const dep = (name, manifest, panelFile = 'src/devtools/index.ts') => {
    write(`node_modules/${name}/package.json`, JSON.stringify(manifest))
    write(`node_modules/${name}/${panelFile}`, 'export default {}\n')
  }

  const panelManifest = (subpath = './devtools') => ({
    name: 'dep',
    octaneXplat: { devtoolsPanel: subpath },
    exports: {
      './devtools': './src/devtools/index.ts',
      './package.json': './package.json',
    },
  })

  return { root, write, project, dep, panelManifest }
}

const warnings = (t) => {
  const seen = []
  const orig = console.error

  console.error = (...args) => seen.push(args.join(' '))
  t.after(() => {
    console.error = orig
  })

  return seen
}

test('discovers a direct dependency with the devtoolsPanel field', (t) => {
  const f = makeProject(t)

  f.project({ dependencies: { alpha: '1.0.0' } })
  f.dep('alpha', f.panelManifest())

  const found = discoverDevtoolsPanels(f.root)

  assert.equal(found.length, 1)
  assert.equal(found[0].name, 'alpha')
  assert.ok(found[0].file.endsWith('src/devtools/index.ts'))
})

test('discovers a devDependency and ignores packages without the field', (t) => {
  const f = makeProject(t)

  f.project({ devDependencies: { beta: '1.0.0', plain: '1.0.0' } })
  f.dep('beta', f.panelManifest())
  f.dep('plain', { name: 'plain' })

  const found = discoverDevtoolsPanels(f.root)

  assert.deepEqual(
    found.map((p) => p.name),
    ['beta'],
  )
})

test('discovers umbrella dependencies through octane-xplat', (t) => {
  const f = makeProject(t)

  f.project({ dependencies: { 'octane-xplat': '1.0.0' } })
  f.dep('octane-xplat', {
    name: 'octane-xplat',
    dependencies: { 'umb-panel': '1.0.0', 'umb-plain': '1.0.0' },
    exports: { './package.json': './package.json' },
  })

  f.dep('umb-panel', f.panelManifest())
  f.dep('umb-plain', { name: 'umb-plain' })

  const found = discoverDevtoolsPanels(f.root)

  assert.deepEqual(
    found.map((p) => p.name),
    ['umb-panel'],
  )
})

test('project dep wins over an umbrella dep of the same name', (t) => {
  const f = makeProject(t)

  f.project({ dependencies: { 'octane-xplat': '1.0.0', dup: '1.0.0' } })
  f.dep('octane-xplat', {
    name: 'octane-xplat',
    dependencies: { dup: '1.0.0' },
    exports: { './package.json': './package.json' },
  })

  f.dep('dup', f.panelManifest())

  const found = discoverDevtoolsPanels(f.root)

  assert.deepEqual(
    found.map((p) => p.name),
    ['dup'],
  )
})

test('rejects a subpath escaping the package root and warns', (t) => {
  const f = makeProject(t)
  const seen = warnings(t)

  f.project({ dependencies: { evil: '1.0.0' } })
  f.write('node_modules/evil/package.json', JSON.stringify(f.panelManifest()))
  f.write('outside/evil.ts', 'export default {}\n')
  symlinkSync('../../outside/evil.ts', join(f.root, 'node_modules/evil/escape.ts'))
  f.write(
    'node_modules/evil/package.json',
    JSON.stringify({
      name: 'evil',
      octaneXplat: { devtoolsPanel: './escape' },
      exports: { './escape': './escape.ts', './package.json': './package.json' },
    }),
  )

  assert.deepEqual(discoverDevtoolsPanels(f.root), [])
  assert.equal(seen.length, 1)
  assert.match(seen[0], /escapes its package root/)
})

test('skips an unresolvable subpath with one warning', (t) => {
  const f = makeProject(t)
  const seen = warnings(t)

  f.project({ dependencies: { missing: '1.0.0' } })
  f.dep('missing', {
    name: 'missing',
    octaneXplat: { devtoolsPanel: './devtools' },
    exports: { './package.json': './package.json' },
  })

  assert.deepEqual(discoverDevtoolsPanels(f.root), [])
  assert.equal(seen.length, 1)
  assert.match(seen[0], /cannot resolve/)
})

test('skips a malformed field with one warning', (t) => {
  const f = makeProject(t)
  const seen = warnings(t)

  f.project({ dependencies: { bad: '1.0.0' } })
  f.dep('bad', {
    name: 'bad',
    octaneXplat: { devtoolsPanel: 'devtools' },
    exports: { './package.json': './package.json' },
  })

  assert.deepEqual(discoverDevtoolsPanels(f.root), [])
  assert.equal(seen.length, 1)
  assert.match(seen[0], /must be an export subpath/)
})

test('stable order: project deps alphabetical, then umbrella deps', (t) => {
  const f = makeProject(t)

  f.project({ dependencies: { 'octane-xplat': '1.0.0', zebra: '1.0.0', apple: '1.0.0' } })
  f.dep('octane-xplat', {
    name: 'octane-xplat',
    dependencies: { 'umb-one': '1.0.0' },
    exports: { './package.json': './package.json' },
  })

  f.dep('zebra', f.panelManifest())
  f.dep('apple', f.panelManifest())
  f.dep('umb-one', f.panelManifest())
  assert.deepEqual(
    discoverDevtoolsPanels(f.root).map((p) => p.name),
    ['apple', 'octane-xplat', 'zebra', 'umb-one'].filter((n) => n !== 'octane-xplat'),
  )
})
