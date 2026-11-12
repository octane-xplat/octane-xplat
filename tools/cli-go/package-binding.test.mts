import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import * as manager from '../../packages/cli/src/package-manager.ts'
import { resolveFrameworkBinding } from '../../packages/cli/src/mcp/discovery.ts'
import { installedPackageRoot } from '../../packages/cli/src/package-root.ts'
import { scratchRun } from './scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}${process.platform === 'win32' ? '.exe' : ''}`)

assert.deepEqual(JSON.parse(readFileSync(binary + '.json')).inputs, nativeInputs(root))

const scratch = scratchRun(root, 'go-bindings')
let count = 0
function fixture() {
  return mkdtempSync(join(scratch, 'project-'))
}

function put(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
}

function reference(request) {
  switch (request.operation) {
    case 'workspace':
      return manager.readProjectWorkspace(request.directory, request.manager)
    case 'root':
      return manager.packageManagerRoot(request.directory)
    case 'manager':
      return manager.packageManagerFor(request.directory, request.manager)
    case 'versions':
      return manager.bunLockedVersions(request.directory) ?? null
    case 'bun':
      return manager.readBunLock(request.directory)
    case 'binding':
      return resolveFrameworkBinding(request.root, request.directory)
    case 'installed':
      return installedPackageRoot(request.directory, request.name)
  }
}

function compare(request, { emptyPath = false } = {}) {
  let expected, failed

  try {
    expected = reference(request)
  } catch (error) {
    failed = error
  }

  const file = join(scratch, 'request.json')

  put(file, request)

  const result = spawnSync(binary, ['package-manager', '--request', file], {
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', ...(emptyPath ? { PATH: '' } : {}) },
  })

  const value = JSON.parse(result.stdout)

  assert.equal(result.stderr, '')
  assert.equal(
    result.status,
    failed ? 1 : 0,
    JSON.stringify({ request, expected, actual: value, error: failed?.message }),
  )

  if (!failed) {
    assert.deepEqual(value, JSON.parse(JSON.stringify(expected)), JSON.stringify(request))
  } else if (['manager', 'bun'].includes(request.operation)) {
    assert.equal(value.error, failed.message)
  }

  count++
  return value
}

test('workspace membership honors simple literal and star patterns with exclusions', () => {
  const project = fixture()

  for (const name of ['alpha', 'beta', 'alpha-extra', '1', '2', '03', '.hidden', 'nested/deep']) {
    put(join(project, 'apps', name, 'package.json'), { name })
  }

  for (const patterns of [
    ['apps/*'],
    ['apps/*', '!apps/beta'],
    ['apps/nested/*'],
    ['apps/.hidden'],
    ['apps/alpha'],
  ]) {
    put(join(project, 'package.json'), { workspaces: patterns })
    for (const app of ['alpha', 'beta', '.hidden', 'nested/deep']) {
      compare({ operation: 'root', directory: join(project, 'apps', app) })
    }
  }

  for (const setting of [
    { packageManager: 'bun@1.4.4', workspaces: ['apps/*'] },
    {
      workspaces: {
        packages: ['apps/*'],
        catalog: { foo: '1' },
        overrides: { ignored: '1' },
        patchedDependencies: { ignored: 'x' },
      },
    },
    { packageManager: 'pnpm@11.0.0', workspaces: ['elsewhere/*'] },
    {},
  ]) {
    put(join(project, 'package.json'), setting)
    put(
      join(project, 'pnpm-workspace.yaml'),
      'packages: [apps/*, "!apps/beta"]\ncatalog: { foo: "1.0.0" }\n',
    )

    for (const selected of [undefined, 'bun', 'pnpm']) {
      compare({ operation: 'workspace', directory: project, manager: selected })
    }

    for (const app of ['alpha', 'beta']) {
      compare({ operation: 'root', directory: join(project, 'apps', app) })
    }
  }
})

test('advanced workspace globs fail explicitly without starting a Node worker', () => {
  const project = fixture(),
    app = join(project, 'apps/alpha')

  put(join(app, 'package.json'), { name: 'alpha' })
  for (const pattern of [
    'apps/**',
    'apps/{alpha,beta}',
    'apps/[ab]*',
    'apps/?lpha',
    'apps/@(alpha|beta)',
  ]) {
    put(join(project, 'package.json'), { workspaces: [pattern] })

    const file = join(scratch, 'unsupported.json')

    put(file, { operation: 'root', directory: app })

    const result = spawnSync(binary, ['package-manager', '--request', file], {
      encoding: 'utf8',
      env: { ...process.env, PATH: '' },
    })

    assert.equal(result.status, 1)
    assert.match(
      JSON.parse(result.stdout).error,
      /unsupported workspace pattern.*use literal paths/,
    )

    assert.equal(result.stderr, '')
  }
})

test('package manager declaration wins over stale locks and conflicting undeclared locks fail', () => {
  for (const pkg of [
    {},
    { packageManager: 'npm@10.0.0' },
    { packageManager: 'bun@1.4.4' },
    { packageManager: 'pnpm@11.0.0' },
    { patchedDependencies: {} },
  ]) {
    const project = fixture()

    put(join(project, 'package.json'), pkg)
    put(join(project, 'bun.lock'), '{}')
    put(join(project, 'pnpm-lock.yaml'), '{}')
    for (const selected of [undefined, 'bun', 'pnpm']) {
      compare({ operation: 'manager', directory: project, manager: selected })
    }
  }
})

test('Bun importer versions, workspace links and installed/lockfile conflicts match Node', () => {
  const project = fixture(),
    app = join(project, 'apps/app')

  put(join(project, 'package.json'), {
    name: 'owner',
    packageManager: 'bun@1.4.4',
    workspaces: ['apps/*', 'packages/*'],
  })

  put(join(app, 'package.json'), {
    name: 'consumer',
    dependencies: { '@octane-xplat/ui': 'catalog:', '@octane-xplat/cli': 'workspace:*' },
  })

  put(
    join(project, 'bun.lock'),
    `// text lock\n{"workspaces":{"apps/app":{"name":"consumer"},"packages/cli":{"version":"0.19.0"}},"packages":{"consumer/@octane-xplat/ui":["@octane-xplat/ui@0.18.0",],"@octane-xplat/cli":["@octane-xplat/cli@workspace:packages/cli"]},}`,
  )

  compare({ operation: 'versions', directory: app }, { emptyPath: true })
  compare({ operation: 'binding', directory: app, root: project }, { emptyPath: true })
  put(join(project, 'node_modules/@octane-xplat/ui/package.json'), {
    name: '@octane-xplat/ui',
    version: '0.19.0',
  })

  const bound = compare(
    { operation: 'binding', directory: app, root: project },
    { emptyPath: true },
  )

  assert.match(
    bound.discrepancy,
    /Lockfile records @octane-xplat\/cli@0\.19\.0.*installation has workspace:\*/,
  )

  put(join(app, 'node_modules/@octane-xplat/ui/package.json'), '{broken')
  compare({ operation: 'binding', directory: app, root: project }, { emptyPath: true })
})

test('pnpm versions, nullish fallbacks and malformed-lock policy preserve warning data', () => {
  for (const lock of [
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}\n",
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: null, specifier: '0.18.0'}}}}\n",
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: 0, specifier: '0.18.0'}}}}\n",
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.18.0(peer@1)'}}}}\n",
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}\n---\nother: {}\n",
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}\nimporters: {}\n",
  ]) {
    const project = fixture()

    put(join(project, 'package.json'), { dependencies: { '@octane-xplat/ui': '0.19.0' } })
    put(join(project, 'pnpm-lock.yaml'), lock)
    compare({ operation: 'binding', directory: project, root: project }, { emptyPath: true })
    put(join(project, 'node_modules/@octane-xplat/ui/package.json'), {
      name: '@octane-xplat/ui',
      version: '0.19.0',
    })

    compare({ operation: 'binding', directory: project, root: project }, { emptyPath: true })
  }
})

test('real repository importer and installed framework metadata are usable without Node execution', () => {
  for (const operation of ['root', 'versions', 'binding']) {
    compare({ operation, directory: join(root, 'apps/web'), root }, { emptyPath: true })
  }
})

after(() => {
  console.log(`${count} independent package-manager comparisons`)
  rmSync(scratch, { recursive: true, force: true })
})
