import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import {
  discoverWorkspace,
  detectGuidance,
  resolveFrameworkBinding,
} from '../../packages/cli/src/mcp/discovery.ts'

import { scratchRun } from './scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const goReference = JSON.parse(
  readFileSync(join(root, 'packages/cli/go/internal/assets/catalog.json')),
)

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const suffix = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, `xplat-go-${host}-cli${suffix}`),
  probe = join(work, `xplat-go-${host}${suffix}`)

for (const executable of [binary, probe]) {
  assert.deepEqual(
    JSON.parse(readFileSync(executable + '.json')).inputs,
    nativeInputs(root),
    'Stale Go contract build',
  )
}

const scratch = scratchRun(root, 'go-contracts')
function put(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  return path
}

function cli(args, options = {}) {
  const result = spawnSync(binary, args, {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 10000,
    env: {
      ...process.env,
      PATH: '',
      XPLAT_PERMISSIONS: '',
      XPLAT_AGENT_CLIENT: '',
      XPLAT_DEV_CACHE: join(scratch, 'dev-cache'),
      ...options.env,
    },
  })

  assert.equal(result.stderr, '', result.stderr)

  const value = JSON.parse(result.stdout)

  delete value.requestId
  return { status: result.status, value }
}

test('all descriptors expose truthful native schemas outside a project', () => {
  for (const command of goReference.descriptors) {
    const actual = cli([...command.path, '--schema'])

    assert.equal(actual.status, 0)

    const expected = structuredClone(goReference.schemas[command.name])

    expected.status = [
      'catalog',
      'permissions',
      'app select',
      'status',
      'capabilities',
      'code search',
      'code read',
      'guidance',
      'docs read',
      'docs search',
      'targets',
      'session list',
      'session status',
      'session attach',
      'actions list',
      'actions invoke',
      'actions status',
      'diagnostics',
      'interact',
      'inspect',
      'evidence list',
      'evidence delete',
      'evidence retain',
    ].includes(command.name)
      ? 'implemented'
      : 'pending'

    assert.deepEqual(actual.value.data, expected)
    if (command.name === 'session attach') {
      assert.ok(!actual.value.data.examples.join(' ').includes('web:5173'))
      assert.ok(actual.value.data.input.flags.some((flag) => flag.flag === '--instance'))
    }

    if (command.name === 'actions invoke') {
      assert.ok(!actual.value.data.summary.includes('xplat job status'))
    }
  }

  const catalog = cli(['catalog', '--json'])

  assert.equal(catalog.status, 0)
  assert.equal(
    catalog.value.data.cli.version,
    JSON.parse(readFileSync(binary + '.json')).cliVersion,
  )

  assert.equal(
    catalog.value.data.commands.filter((command) => command.status === 'implemented').length,
    23,
  )

  assert.equal(catalog.value.data.commands.length, 24)

  assert.ok(
    !catalog.value.data.commands.some((command) => command.command === 'session detach'),
    'Stateless clients disconnect without adding an observer-management API',
  )

  for (const [args, code] of [
    [['docs', '--json'], 'invalid_selection'],
    [['docs', 'unknown', '--json'], 'invalid_selection'],
    [['actions', 'status', '--json'], 'invalid_selection'],
  ]) {
    const actual = cli(args)

    assert.equal(actual.value.ok, false)
    assert.equal(actual.value.error.code, code)
  }
})

test('status preserves identity, guidance and actual package bindings without claiming pending providers', () => {
  const project = join(scratch, 'status')

  put(join(project, 'package.json'), { name: 'workspace', workspaces: ['apps/*'] })
  put(join(project, 'AGENTS.md'), 'Workspace guidance')
  put(join(project, 'apps/one/package.json'), {
    name: 'one',
    dependencies: { '@octane-xplat/ui': '^0.18.0' },
  })

  put(join(project, 'apps/one/vite.config.ts'), 'export default {}')
  put(join(project, 'apps/one/CLAUDE.md'), 'App guidance')
  put(join(project, 'apps/one/node_modules/@octane-xplat/ui/package.json'), {
    name: '@octane-xplat/ui',
    version: '0.19.0',
  })

  put(
    join(project, 'pnpm-lock.yaml'),
    "importers: {apps/one: {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}",
  )

  const status = cli(['status', '--project', project, '--json'])

  assert.equal(status.status, 0)
  assert.equal(
    status.value.context.projectId,
    null,
    'Sole selection does not persist an explicit binding',
  )

  const data = status.value.data,
    discovery = discoverWorkspace(project),
    app = discovery.apps[0]

  assert.deepEqual(data.identity, {
    ...discovery,
    selection: { state: 'bound', app, reason: 'sole-app' },
    framework: JSON.parse(JSON.stringify(resolveFrameworkBinding(project, app.root))),
  })

  assert.deepEqual(data.guidance.sources, [
    ...detectGuidance(project),
    ...detectGuidance(app.root).map((source) => ({ ...source, path: `${app.id}/${source.path}` })),
  ])

  assert.equal(data.server.name, '@octane-xplat/cli')
  assert.equal(data.prerequisites.find((check) => check.id === 'node').status, 'missing')
  assert.ok(!data.prerequisites.some((check) => check.id === 'chromium'))
  assert.equal(data.docs.state, 'ready')
  assert.match(data.docs.detail, /Embeddings require the inference-enabled build/)
  assert.equal(data.codeIndex.state, 'ready')
  for (const matrix of data.capabilities) {
    assert.equal(matrix.declared, true)
    assert.deepEqual(
      matrix.capabilities
        .filter((entry) => entry.status === 'supported')
        .map((entry) => entry.capability),
      ['project_status', 'guidance', 'code_search'],
    )

    assert.equal(
      matrix.capabilities.find((entry) => entry.capability === 'screenshot').requiresPermission,
      'visual-capture',
    )

    assert.equal(
      matrix.capabilities.find((entry) => entry.capability === 'guidance').status,
      'supported',
    )
  }

  assert.deepEqual(
    cli(['capabilities', '--project', project, '--json']).value.data.capabilities,
    data.capabilities,
  )

  assert.deepEqual(
    cli(['capabilities', '--project', project, '--platform', 'ios', '--json']).value.data
      .capabilities,
    [],
  )

  put(join(project, 'apps/two/package.json'), { name: 'two', xplat: { targets: {} } })

  const ambiguous = cli(['status', '--project', project, '--json']).value.data

  assert.equal(ambiguous.identity.selection.state, 'ambiguous')
  assert.equal(ambiguous.identity.framework, null)
  assert.equal(ambiguous.capabilities[0].declared, false)
  assert.deepEqual(ambiguous.guidance.sources, data.guidance.sources)

  const bound = cli(['status', '--project', project, '--app', app.id, '--json'])

  assert.equal(bound.value.context.projectId, app.id)
  assert.equal(bound.value.data.identity.selection.reason, 'explicit')
})

test('native guidance binds actual installed versions, link labels and conflict warnings without Node', () => {
  const project = join(scratch, 'guidance')

  put(join(project, 'package.json'), {
    name: 'app',
    xplat: { targets: {} },
    dependencies: { '@octane-xplat/ui': '0.19.0', '@octane-xplat/cli': 'workspace:*' },
  })

  put(join(project, 'node_modules/@octane-xplat/ui/package.json'), {
    name: '@octane-xplat/ui',
    version: '0.19.0',
  })

  put(join(project, 'node_modules/@octane-xplat/cli/package.json'), {
    name: '@octane-xplat/cli',
    version: '0.19.0',
  })

  put(
    join(project, 'pnpm-lock.yaml'),
    "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: '0.18.0'}}}}",
  )

  const cache = join(scratch, 'unused-guidance-cache')
  const result = cli(['guidance', '--project', project, '--json'], {
    env: { XPLAT_MCP_CACHE: cache },
  })

  assert.equal(result.status, 0)
  assert.equal(result.value.data.bindingRevision, 1)

  const entries = result.value.data.entries

  assert.deepEqual(
    entries.slice(0, 5).map((entry) => entry.id),
    ['capabilities', 'target', 'inspect', 'iterate', 'claims'],
  )

  assert.match(entries[0].body, /@octane-xplat\/ui@0\.19\.0/)
  assert.match(entries.find((entry) => entry.id === 'linked').body, /@octane-xplat\/cli@0\.19\.0/)
  assert.match(
    entries.find((entry) => entry.id === 'discrepancy').body,
    /lockfile records 0\.18\.0 but 0\.19\.0 is installed/,
  )

  assert.ok(
    entries.every(
      (entry) =>
        entry.provenance.source === 'project-guidance' && entry.provenance.scope === 'project',
    ),
  )

  assert.equal(
    existsSync(cache),
    false,
    'Reading guidance must not prepare snapshots or model assets',
  )

  put(join(project, 'apps/second/package.json'), { name: 'second', xplat: { targets: {} } })
  assert.equal(
    cli(['guidance', '--project', project, '--json']).value.error.code,
    'ambiguous_selection',
  )
})

test('native prerequisite probes inspect actual Node availability and clear injected Node options', () => {
  const project = join(scratch, 'prerequisites')

  put(join(project, 'package.json'), {
    name: 'app',
    packageManager: 'pnpm@11.0.0',
    xplat: { targets: {} },
  })

  const result = cli(['status', '--project', project, '--json'], {
    env: { PATH: process.env.PATH, NODE_OPTIONS: '--not-a-real-option', NODE_PATH: '/missing' },
  })

  assert.equal(result.status, 0)

  const checks = result.value.data.prerequisites

  assert.equal(checks.find((check) => check.id === 'node').detail, process.version)
  assert.equal(checks.find((check) => check.id === 'node').status, 'satisfied')
  assert.ok(checks.some((check) => check.id === 'pnpm'))
  assert.ok(
    !checks.some((check) => check.id === 'bun'),
    'Do not require Bun for a declared pnpm project',
  )
})

test('discovery, persisted per-client binding and envelope identity match Node', () => {
  const project = join(scratch, 'workspace')

  put(join(project, 'package.json'), { name: 'fixture', workspaces: ['apps/*'] })
  for (const [name, target] of [
    ['one', 'web'],
    ['two', 'linux'],
  ]) {
    const app = join(project, 'apps', name)

    put(join(app, 'package.json'), {
      name: 'same-name',
      xplat: { targets: target === 'linux' ? { linux: { runtime: 'gtk' } } : {} },
    })

    if (target === 'web') {
      put(join(app, 'vite.config.mts'), '')
    }
  }

  put(join(project, 'node_modules/ignored/package.json'), { xplat: { targets: {} } })
  put(join(project, 'research/ignored/package.json'), { xplat: { targets: {} } })

  const input = put(join(scratch, 'context.json'), { project })
  function context(values) {
    put(input, { project, ...values })

    const run = spawnSync(probe, ['workspace-context', '--request', input], {
      encoding: 'utf8',
      env: { ...process.env, PATH: '', XPLAT_AGENT_CLIENT: '' },
    })

    assert.equal(run.status, 0, run.stderr)
    return JSON.parse(run.stdout)
  }

  const discovery = discoverWorkspace(project)

  assert.deepEqual(context({}).discovery, discovery)
  assert.equal(context({}).selection.state, 'ambiguous')

  const duplicate = cli(['app', 'select', 'same-name', '--project', project, '--json'])

  assert.equal(duplicate.status, 2)
  assert.equal(duplicate.value.error.code, 'ambiguous_selection')

  const selected = cli([
    'app',
    'select',
    join('apps', 'one'),
    '--project',
    project,
    '--client',
    'alice',
    '--json',
  ])

  assert.equal(selected.status, 0)
  assert.equal(selected.value.context.projectId, join('apps', 'one'))
  assert.equal(selected.value.context.selection.reason, 'explicit')
  assert.equal(context({ client: 'alice' }).context.projectId, join('apps', 'one'))
  assert.equal(context({ client: 'other' }).context.projectId, null)
  assert.equal(context({ client: 'alice', app: '' }).context.projectId, null)

  const unsafe = cli([
    'app',
    'select',
    join('apps', 'one'),
    '--project',
    project,
    '--client',
    '../../outside',
    '--json',
  ])

  assert.equal(unsafe.status, 2)
  assert.equal(existsSync(join(project, 'node_modules/.cache/outside.json')), false)

  const single = join(scratch, 'sole')

  put(join(single, 'package.json'), { name: 'sole', xplat: { targets: {} } })
  put(input, { project: single })

  const run = spawnSync(probe, ['workspace-context', '--request', input], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '' },
  })

  const value = JSON.parse(run.stdout)

  assert.equal(value.selection.reason, 'sole-app')
  assert.equal(value.context.projectId, null)
})

test(
  'selection cache refuses a symlink escape before creating external directories',
  { skip: process.platform === 'win32' },
  () => {
    const project = join(scratch, 'guard'),
      outside = join(scratch, 'external')

    put(join(project, 'package.json'), { xplat: { targets: {} } })
    mkdirSync(outside)
    symlinkSync(outside, join(project, 'node_modules'), 'dir')

    const result = cli(['app', 'select', '.', '--project', project, '--json'])

    assert.notEqual(result.status, 0)
    assert.equal(existsSync(join(outside, '.cache')), false)
  },
)

test.after(() => rmSync(scratch, { recursive: true, force: true }))
