import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
  readdirSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { createDocsService } from '../../packages/cli/src/mcp/docs-service.ts'
import { scratchRun } from './scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(
  root,
  `research/go-cli/xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`,
)

assert.deepEqual(JSON.parse(readFileSync(binary + '.json')).inputs, nativeInputs(root))

const scratch = scratchRun(root, 'go-docs')

after(() => rmSync(scratch, { recursive: true, force: true }))

function put(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
  )

  return path
}

function app(path, spec = '1.0.0') {
  put(join(path, 'package.json'), { name: 'consumer', dependencies: { '@octane-xplat/ui': spec } })
  put(join(path, 'vite.config.ts'), 'export default {}')
  put(join(path, 'README.md'), '# App guidance\n\nUse capture() for this project.\n')
  return path
}

function cli(project, args, env = {}) {
  const run = spawnSync(binary, [...args, '--project', project, '--json'], {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 20000,
    env: {
      ...process.env,
      PATH: '',
      XPLAT_PERMISSIONS: '',
      XPLAT_DOCS_REPO: '',
      XPLAT_MCP_CACHE: join(project, 'cache'),
      ...env,
    },
  })

  assert.equal(run.stderr, '')
  assert.equal(run.error, undefined)
  return { status: run.status, envelope: JSON.parse(run.stdout) }
}

function data(project, args, env = {}) {
  const result = cli(project, args, env)

  assert.equal(result.status, 0, JSON.stringify(result.envelope))
  assert.equal(result.envelope.ok, true)
  return result.envelope.data
}

const gitEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
  GIT_AUTHOR_NAME: 'docs',
  GIT_AUTHOR_EMAIL: 'docs@example.invalid',
  GIT_COMMITTER_NAME: 'docs',
  GIT_COMMITTER_EMAIL: 'docs@example.invalid',
}

const git = (args, cwd) => execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8' }).trim()
const camera =
  '# Camera 🚀\n\nUse capture() on web and ios.\n\n## Retain screens\n\nPreserve local route state.\n'

function docsRepo(path) {
  put(join(path, 'bun.lock'), '{}')
  for (const name of ['ui', 'media']) {
    put(join(path, `packages/${name}/package.json`), {
      name: `@octane-xplat/${name}`,
      version: '1.0.0',
    })

    put(join(path, `packages/${name}/README.md`), `# ${name}\n\nCapture package docs.\n`)
  }

  put(join(path, 'docs/camera.md'), camera)
  put(join(path, 'docs/notes/design.md'), '# Design\n\nCapture implementation details.\n')
  put(
    join(path, 'CHANGELOG.md'),
    '# Changelog\n\n## [v1.0.0] 2026-11-01\n\n### Capture\n\nCapture now works on web.\n',
  )

  return path
}

function reference(project, repo) {
  return createDocsService({
    workspaceRoot: project,
    cacheDir: join(project, 'node-cache'),
    repo,
    env: gitEnv,
  })
}

function referenceShape(result) {
  // Project excerpt boundaries are a presentation choice. Compare identity,
  // scope and all release retrieval fields; check useful excerpt text below.
  return {
    ...result,
    projectGuidance: result.projectGuidance.map(({ excerpt: _excerpt, ...item }) => item),
  }
}

test('public linked-checkout search/read preserve corpus, references, UTF-16 pages and project guidance without Node', async () => {
  const repository = docsRepo(join(scratch, 'linked-framework')),
    project = app(join(scratch, 'linked-app'), 'workspace:*')

  mkdirSync(join(project, 'node_modules/@octane-xplat'), { recursive: true })
  symlinkSync(
    join(repository, 'packages/ui'),
    join(project, 'node_modules/@octane-xplat/ui'),
    'dir',
  )

  const service = reference(project)
  const query = {
    query: 'capture',
    mode: 'exact',
    corpus: 'guide',
    platform: 'web',
    package: '@octane-xplat/ui',
    limit: 10,
  }

  const found = data(project, [
    'docs',
    'search',
    'capture',
    '--mode',
    'exact',
    '--corpus',
    'guide',
    '--platform',
    'web',
    '--package',
    '@octane-xplat/ui',
  ])

  assert.deepEqual(referenceShape(found), referenceShape(await service.search(query)))
  assert.match(found.projectGuidance[0].excerpt, /capture/)
  assert.equal(found.results.length, 1)
  assert.equal(found.results[0].provenance.source, 'development-docs')
  assert.equal(found.projectGuidance[0].provenance.scope, 'project')

  const ref = found.results[0].ref,
    rocket = camera.indexOf('🚀')

  for (const [offset, limit] of [
    [0, 20000],
    [rocket, 1],
    [rocket + 1, 1],
    [1e30, 1],
  ]) {
    assert.deepEqual(
      data(project, [
        'docs',
        'read',
        '--ref',
        ref,
        '--offset',
        String(offset),
        '--limit',
        String(limit),
      ]),
      await service.read({ ref, offset, limit }),
    )
  }

  for (const mode of ['lexical', 'hybrid']) {
    const result = data(project, [
      'docs',
      'search',
      'retain screens',
      '--mode',
      mode,
      '--package',
      '@octane-xplat/ui',
    ])

    assert.equal(
      result.results.some((hit) => hit.path === 'docs/camera.md'),
      true,
    )

    assert.equal(result.retrieval[0].used, 'lexical')
    if (mode === 'hybrid') {
      assert.equal(result.retrieval[0].reason, 'index-not-ready')
    }
  }

  assert.deepEqual(
    readdirSync(join(project, 'cache/go-v1')),
    [],
    'linked reads/search do not prepare assets or retain operations',
  )

  const changelog = data(project, [
    'docs',
    'search',
    'Capture',
    '--mode',
    'exact',
    '--corpus',
    'changelog',
    '--package',
    '@octane-xplat/ui',
  ])

  assert.equal(changelog.results[0].releaseVersion, '1.0.0')
  assert.equal(changelog.results[0].releaseDate, '2026-11-01')

  const design = data(project, [
    'docs',
    'search',
    'Capture',
    '--mode',
    'exact',
    '--corpus',
    'design-note',
    '--package',
    '@octane-xplat/ui',
  ])

  assert.equal(design.results[0].corpus, 'design-note')
})

test('public release retrieval pins installed metadata, labels explicit comparisons, and serves a verified offline page', async () => {
  const repository = docsRepo(join(scratch, 'release-framework')),
    project = app(join(scratch, 'release-app'))

  git(['init', '-q'], repository)
  git(['add', '-A'], repository)
  git(['commit', '-qm', 'one'], repository)
  git(['tag', 'v1.0.0'], repository)
  for (const name of ['ui', 'media']) {
    put(join(repository, `packages/${name}/package.json`), {
      name: `@octane-xplat/${name}`,
      version: '2.0.0',
    })
  }

  put(join(repository, 'docs/camera.md'), '# Camera\n\nUse captureV2() on web.\n')
  git(['add', '-A'], repository)
  git(['commit', '-qm', 'two'], repository)
  git(['tag', 'v2.0.0'], repository)
  put(join(project, 'node_modules/@octane-xplat/ui/package.json'), {
    name: '@octane-xplat/ui',
    version: '1.0.0',
  })

  const env = { PATH: process.env.PATH, XPLAT_DOCS_REPO: repository },
    service = reference(project, repository)

  const result = data(
    project,
    ['docs', 'search', 'capture', '--mode', 'exact', '--package', '@octane-xplat/ui'],
    env,
  )

  assert.deepEqual(
    referenceShape(result),
    referenceShape(
      await service.search({
        query: 'capture',
        mode: 'exact',
        corpus: 'guide',
        package: '@octane-xplat/ui',
        limit: 10,
      }),
    ),
  )

  const ref = result.results[0].ref

  assert.deepEqual(data(project, ['docs', 'read', '--ref', ref], env), await service.read({ ref }))

  const offline = data(project, ['docs', 'read', '--ref', ref], { ...env, PATH: '' })

  assert.equal(offline.provenance.offline, true)
  assert.equal(offline.content, camera)

  const comparison = data(
    project,
    [
      'docs',
      'read',
      '--package',
      '@octane-xplat/ui',
      '--path',
      'docs/camera.md',
      '--version',
      '2.0.0',
    ],
    env,
  )

  assert.equal(comparison.provenance.match, 'outside-installed-binding')
  assert.match(comparison.content, /captureV2/)

  const absent = data(
    project,
    [
      'docs',
      'read',
      '--package',
      '@octane-xplat/ui',
      '--path',
      'docs/camera.md',
      '--version',
      '9.0.0',
    ],
    env,
  )

  assert.equal(absent.reason, 'tag-absent')
  assert.equal(absent.fallback.kind, 'installed-source')

  const explicit = data(
    project,
    [
      'docs',
      'read',
      '--package',
      '@octane-xplat/media',
      '--path',
      'docs/camera.md',
      '--version',
      '1.0.0',
    ],
    env,
  )

  assert.equal(
    explicit.provenance.match,
    'outside-installed-binding',
    'an uninstalled comparison must not claim an installed binding',
  )

  git(['tag', '-f', 'v1.0.0'], repository)

  const conflict = data(project, ['docs', 'read', '--ref', ref], env)

  assert.equal(conflict.status, 'tag-conflict')
  assert.equal(conflict.cached.commit, result.results[0].provenance.commit)
})

test('public docs reject invalid requests and private/external aliases, and preserve multiple package bindings', () => {
  const repository = docsRepo(join(scratch, 'scoped-framework')),
    project = app(join(scratch, 'scoped-app'), 'workspace:*')

  mkdirSync(join(project, 'node_modules/@octane-xplat'), { recursive: true })
  for (const name of ['ui', 'media']) {
    symlinkSync(
      join(repository, `packages/${name}`),
      join(project, `node_modules/@octane-xplat/${name}`),
      'dir',
    )
  }

  const found = data(project, ['docs', 'search', 'capture', '--mode', 'exact'])

  assert.equal(found.results.length, 2)
  assert.deepEqual(found.results[0].provenance.verifiedCompatibleSet, [
    '@octane-xplat/media',
    '@octane-xplat/ui',
  ])

  for (const path of ['docs/private/secret.md', '../outside.md', 'packages/media/README.md']) {
    put(join(repository, 'docs/private/secret.md'), 'Secret capture')

    const result = data(project, ['docs', 'read', '--package', '@octane-xplat/ui', '--path', path])

    assert.equal(result.reason, 'docs-absent')
  }

  const outside = put(join(scratch, 'outside.md'), 'External secret capture')

  symlinkSync(outside, join(repository, 'docs/link.md'))
  assert.equal(
    data(project, ['docs', 'read', '--package', '@octane-xplat/ui', '--path', 'docs/link.md'])
      .reason,
    'docs-absent',
  )

  assert.equal(data(project, ['docs', 'read', '--ref', 'invalid']).status, 'invalid-ref')
  assert.equal(cli(project, ['docs', 'read']).envelope.error.code, 'invalid_selection')
  put(join(repository, 'docs/many-headings.md'), '# x\n'.repeat(20002))

  const oversized = cli(project, [
    'docs',
    'search',
    'x',
    '--mode',
    'lexical',
    '--package',
    '@octane-xplat/ui',
  ])

  assert.equal(oversized.envelope.error.code, 'execution_failure')
  assert.match(oversized.envelope.error.message, /20000 chunks/)

  const ambiguous = join(scratch, 'ambiguous')

  put(join(ambiguous, 'package.json'), { name: 'workspace', workspaces: ['apps/*'] })
  app(join(ambiguous, 'apps/one'))
  app(join(ambiguous, 'apps/two'))
  assert.equal(
    cli(ambiguous, ['docs', 'search', 'capture']).envelope.error.code,
    'ambiguous_selection',
  )

  assert.equal(existsSync(join(ambiguous, 'cache')), false)
})

test('real framework checkout docs remain native and version-labelled', () => {
  const result = data(
    root,
    [
      'docs',
      'search',
      'dictation',
      '--app',
      'apps/web',
      '--package',
      '@octane-xplat/ui',
      '--mode',
      'exact',
    ],
    { XPLAT_MCP_CACHE: join(scratch, 'real-cache') },
  )

  assert.equal(result.results.length > 0, true)
  assert.equal(
    result.results.every((hit) => hit.provenance.source === 'development-docs'),
    true,
  )

  const page = data(root, ['docs', 'read', '--app', 'apps/web', '--ref', result.results[0].ref], {
    XPLAT_MCP_CACHE: join(scratch, 'real-cache'),
  })

  assert.equal(page.provenance.servedVersion, 'development')
  assert.equal(page.content.length > 0, true)
})
