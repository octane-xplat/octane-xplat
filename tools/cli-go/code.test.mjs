import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { createCodeService } from '../../packages/cli/src/mcp/code-service.ts'
import { discoverWorkspace } from '../../packages/cli/src/mcp/discovery.ts'
import { scratchRun } from './scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(
  root,
  `research/go-cli/xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`,
)

assert.deepEqual(JSON.parse(readFileSync(binary + '.json')).inputs, nativeInputs(root))
const scratch = scratchRun(root, 'go-code')
const project = join(scratch, 'project'),
  app = join(project, 'apps/app')

function put(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content),
  )
  return path
}

put(join(project, 'package.json'), { name: 'workspace' })
put(join(app, 'package.json'), {
  name: 'app',
  xplat: { targets: {} },
  dependencies: { '@octane-xplat/ui': '0.19.0' },
})

const content =
  "export const CameraView = '🚀';\nexport function capturePhoto() { return CameraView }\n"

put(join(app, 'src/camera.ts'), content)
put(join(app, 'src/camera.ios.ts'), 'export const CameraViewIOS = 1\n')
put(join(app, 'src/camera.web.ts'), 'export const CameraViewWeb = 1\n')
put(join(app, 'private/secret.ts'), 'CameraView PrivateValue\n')
put(join(app, 'src/generated/output.ts'), 'CameraView GeneratedValue\n')
put(join(app, 'src/bundle.min.js'), 'CameraView GeneratedValue\n')
put(join(app, 'src/config.json'), '{"CameraView":"not code"}')
put(join(app, 'src/binary.ts'), 'CameraView\u0000NeverExpose\n')
put(join(app, 'src/oversized.ts'), 'CameraView\n'.repeat(30000))
put(join(app, 'node_modules/@octane-xplat/ui/package.json'), {
  name: '@octane-xplat/ui',
  version: '0.19.0',
})

put(join(app, 'node_modules/@octane-xplat/ui/src/button.ts'), 'export const FrameworkButton = 1\n')
const discovery = discoverWorkspace(project),
  identity = discovery.apps[0]

const reference = createCodeService({
  workspaceRoot: project,
  workspaceKind: 'consumer',
  execFile() {
    throw Error('not a checkout')
  },
})

function cli(args) {
  const result = spawnSync(binary, [...args, '--project', project, '--json'], {
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, PATH: '', XPLAT_PERMISSIONS: '', XPLAT_AGENT_CLIENT: '' },
  })
  assert.equal(result.stderr, '')
  return { status: result.status, value: JSON.parse(result.stdout) }
}

function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(normalize)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'mtimeMs')
        .map(([key, value]) => [key, normalize(value)]),
    )
  }
  return value
}

function nodeRead(args) {
  return reference.read({ app: identity, ...args })
}

test('native exact retrieval keeps references, installed version provenance and useful current results', () => {
  const actual = cli([
    'code',
    'search',
    'CameraView',
    '--mode',
    'exact',
    '--corpus',
    'app',
    '--platform',
    'web',
  ])
  assert.equal(actual.status, 0)
  const expected = reference.search({
    app: identity,
    query: 'CameraView',
    mode: 'exact',
    corpus: 'app',
    platform: 'web',
  })
  // Binary source is excluded for every size, closing the small-file loophole in
  // the reference enumerator. The generated/private/large exclusions are shared.
  const expectedHits = expected.results.filter((hit) => !hit.path.endsWith('binary.ts'))
  assert.deepEqual(
    normalize(actual.value.data.results),
    normalize(JSON.parse(JSON.stringify(expectedHits))),
  )
  assert.ok(actual.value.data.results.some((hit) => hit.path === 'src/camera.ts'))
  assert.ok(
    !actual.value.data.results.some((hit) =>
      /private|generated|binary|oversized|\.ios\./.test(hit.path),
    ),
  )
  const framework = cli([
    'code',
    'search',
    'FrameworkButton',
    '--mode',
    'exact',
    '--corpus',
    'framework',
  ]).value.data.results[0]
  assert.equal(framework.package, '@octane-xplat/ui')
  assert.equal(framework.provenance.servedVersion, '0.19.0')
  assert.equal(framework.provenance.scope, 'release')
  assert.equal(
    cli(['code', 'read', '--ref', framework.ref]).value.data.content,
    'export const FrameworkButton = 1\n',
  )
})

test('continuation preserves UTF-16 boundaries, exact hash, zero and large offsets', () => {
  const rocket = content.indexOf('🚀')
  for (const [offset, limit] of [
    [0, 24000],
    [rocket, 1],
    [rocket + 1, 1],
    [rocket, 2],
    [0, 1],
    [content.length, 20],
    [1e30, 3],
  ]) {
    const actual = cli([
      'code',
      'read',
      '--path',
      'apps/app/src/camera.ts',
      '--offset',
      String(offset),
      '--limit',
      String(limit),
    ])

    assert.equal(actual.status, 0)
    const expected = nodeRead({ corpus: 'app', path: 'apps/app/src/camera.ts', offset, limit })
    assert.deepEqual(normalize(actual.value.data), normalize(JSON.parse(JSON.stringify(expected))))
  }
  assert.equal(
    cli(['code', 'read', '--path', 'apps/app/src/camera.ts']).value.data.contentHash,
    createHash('sha1').update(content).digest('hex').slice(0, 12),
  )
})

test('excluded names and canonical targets cannot be read through aliases', () => {
  const outside = put(join(scratch, 'outside.ts'), 'OutsideData')
  const directory = join(app, 'src')
  for (const [name, target] of [
    ['outside.ts', outside],
    ['private-alias.ts', join(app, 'private/secret.ts')],
    ['safe-alias.ts', join(app, 'src/camera.ts')],
  ]) {
    symlinkSync(target, join(directory, name))
  }
  for (const path of [
    '../outside.ts',
    '/outside.ts',
    'apps/app/private/secret.ts',
    'apps/app/src/config.json',
    'apps/app/src/bundle.min.js',
    'apps/app/src/binary.ts',
    'apps/app/src/oversized.ts',
    'apps/app/src/outside.ts',
    'apps/app/src/private-alias.ts',
  ]) {
    const result = cli(['code', 'read', '--path', path])
    assert.equal(result.value.ok, false, path)
    assert.ok(!JSON.stringify(result.value).includes('PrivateValue'))
    assert.ok(!JSON.stringify(result.value).includes('OutsideData'))
  }
  assert.equal(
    cli(['code', 'read', '--path', 'apps/app/src/safe-alias.ts']).value.data.content,
    content,
  )
  assert.equal(
    cli(['code', 'read', '--ref', 'https://outside']).value.error.code,
    'invalid_selection',
  )
})

test('current reads revalidate edits/deletes and semantic intent search is useful without Node', () => {
  const file = join(app, 'src/focus.ts')
  put(file, 'export function focusCameraPreview() { return "visible preview frame" }\n')
  const search = cli([
    'code',
    'search',
    'focus camera preview',
    '--mode',
    'semantic',
    '--corpus',
    'app',
  ])
  assert.equal(search.status, 0)
  assert.equal(search.value.data.semantic.state, 'ready')
  assert.ok(search.value.data.results.some((hit) => hit.path === 'src/focus.ts'))
  const ref = search.value.data.results.find((hit) => hit.path === 'src/focus.ts').ref
  const old = cli(['code', 'read', '--ref', ref]).value.data
  put(file, 'export function focusCameraPreview() { return "updated frame" }\n')
  const current = cli(['code', 'read', '--ref', ref]).value.data
  assert.notEqual(current.contentHash, old.contentHash)
  assert.match(current.content, /updated frame/)
  rmSync(file)
  assert.equal(cli(['code', 'read', '--ref', ref]).value.error.code, 'unavailable')
})

test(
  'nonregular source does not block and a symlinked workspace root remains usable',
  { skip: process.platform === 'win32' },
  () => {
    const fifo = join(app, 'src/pipe.ts')
    const created = spawnSync('mkfifo', [fifo], { encoding: 'utf8' })
    assert.equal(created.status, 0, created.stderr)
    assert.equal(
      cli(['code', 'read', '--path', 'apps/app/src/pipe.ts']).value.error.code,
      'unavailable',
    )
    const alias = join(scratch, 'workspace-alias')
    symlinkSync(project, alias, 'dir')
    const result = spawnSync(
      binary,
      ['code', 'search', 'CameraView', '--mode', 'exact', '--project', alias, '--json'],
      { encoding: 'utf8', timeout: 10000, env: { ...process.env, PATH: '' } },
    )
    assert.equal(result.status, 0, result.stderr)
    assert.ok(JSON.parse(result.stdout).data.results.some((hit) => hit.path === 'src/camera.ts'))
  },
)

test('real installed framework source is searchable and readable without Node', () => {
  const result = spawnSync(
    binary,
    [
      'code',
      'search',
      'Button',
      '--mode',
      'exact',
      '--project',
      root,
      '--app',
      'apps/web',
      '--corpus',
      'framework',
      '--package',
      '@octane-xplat/ui',
      '--json',
    ],
    { encoding: 'utf8', timeout: 20000, env: { ...process.env, PATH: '' } },
  )
  assert.equal(result.status, 0, result.stderr)
  const data = JSON.parse(result.stdout).data
  assert.ok(data.results.length > 0)
  const hit = data.results[0]
  assert.equal(hit.package, '@octane-xplat/ui')
  assert.equal(hit.provenance.servedVersion, 'development')
  const read = spawnSync(
    binary,
    ['code', 'read', '--ref', hit.ref, '--project', root, '--app', 'apps/web', '--json'],
    { encoding: 'utf8', timeout: 10000, env: { ...process.env, PATH: '' } },
  )
  assert.equal(read.status, 0, read.stderr)
  assert.equal(JSON.parse(read.stdout).data.contentHash, hit.freshness.contentHash)
})

test('ambiguous selection fails and framework-maintainer mode works without an app', () => {
  put(join(project, 'apps/second/package.json'), { name: 'second', xplat: { targets: {} } })
  assert.equal(cli(['code', 'search', 'CameraView']).value.error.code, 'ambiguous_selection')
  const framework = join(scratch, 'framework')
  put(join(framework, 'package.json'), { name: 'octane-xplat' })
  put(join(framework, 'packages/ui/package.json'), { name: '@octane-xplat/ui' })
  put(join(framework, 'packages/ui/src/public.ts'), 'export const MaintainerMarker = true\n')
  const result = spawnSync(
    binary,
    ['code', 'search', 'MaintainerMarker', '--mode', 'exact', '--project', framework, '--json'],
    { encoding: 'utf8', env: { ...process.env, PATH: '' } },
  )
  assert.equal(result.status, 0)
  const hit = JSON.parse(result.stdout).data.results[0]
  assert.equal(hit.provenance.servedVersion, 'development')
  assert.equal(hit.provenance.scope, 'project')
})

after(() => rmSync(scratch, { recursive: true, force: true }))
