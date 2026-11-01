import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, realpathSync, chmodSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { createDocsService } from '../../packages/cli/src/mcp/docs-service.ts'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/docs-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function fixture() { const path = mkdtempSync(join(tmpdir(), 'xplat-nim-docs-service-')); fixtures.push(path); return path }
function file(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content) }
function json(path, value) { file(path, JSON.stringify(value)) }
function native(cases) {
 const run = spawnSync(binary, [], { input: cases.map(value => JSON.stringify(value)).join('\n') + '\n',
  encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000, env: { ...process.env, PATH: '' } })
 assert.equal(run.status, 0, run.stderr || run.error?.message)
 assert.equal(run.stderr, '')
 const values = run.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(values.length, cases.length)
 return values
}
const macOnly = { skip: process.platform === 'darwin' ? false : 'local docs service collation is only qualified on macOS' }

test('JSON equality follows JS number values and object identity rather than storage kinds or deep equality', () => {
 const cases = []
 const values = [undefined, null, false, true, 0, -0, 1, 1.5, '1', '', [], [1], {}, { a: 1 }, '\ud800', '😀']
 for (const left of values) for (const right of values) cases.push({ operation: 'strict-equal', left, right })
 for (const left of values) cases.push({ operation: 'strict-equal', left, same: true })
 for (const [leftSource, rightSource] of [['1', '1.0'], ['-0', '0.0'], ['1e999', '1e999'], ['1e999', 'null'], ['{}', '{}'], ['[]', '[]']])
  cases.push({ operation: 'strict-json-equal', leftSource, rightSource })
 const actual = native(cases)
 for (const [at, input] of cases.entries()) {
  // The two fields cross a JSON boundary as separate values, even if this
  // generator originally selected the same object for both fields.
  const request = JSON.parse(JSON.stringify(input))
  const expected = request.operation === 'strict-json-equal'
   ? JSON.parse(request.leftSource) === JSON.parse(request.rightSource)
   : request.left === (request.same ? request.left : request.right)
  assert.equal(actual[at].ok, true)
  assert.equal(actual[at].value, expected, JSON.stringify(request))
 }
})

async function reference(request) {
 const service = createDocsService({ workspaceRoot: request.root, cacheDir: request.cacheDir, repo: request.repo,
  gitPath: request.gitPath, env: { PATH: '', ...request.env }, timeoutMs: request.timeoutMs })
 const values = []
 for (const step of request.steps) {
  try {
   let value
   switch (step.method) {
   case 'status': value = await service.status(); break
   case 'refresh': value = await service.refresh(); break
   case 'guidance': value = await service.guidance(); break
   case 'read': value = await service.read(step.options); break
   case 'resolve': value = await service.resolveTagConflict(step.package, step.version, step.resolution); break
   case 'write': file(step.path, step.content); value = null; break
   default: throw Error(step.method)
   }
   values.push({ ok: true, value })
  } catch (error) { values.push({ ok: false, message: error.message }) }
 }
 return JSON.parse(JSON.stringify(values))
}
function normalize(value, base) {
 let encoded = JSON.stringify(value)
 for (const prefix of [realpathSync(base), base]) encoded = encoded.split(prefix).join('<fixture>')
 return JSON.parse(encoded)
}
async function parity(setup, label) {
 const base = fixture()
 const nodeDir = join(base, 'node'), nativeDir = join(base, 'native')
 mkdirSync(nodeDir); mkdirSync(nativeDir)
 const expectedRequest = setup(nodeDir, base)
 const actualRequest = setup(nativeDir, base)
 const expected = await reference(expectedRequest)
 const [actual] = native([actualRequest])
 assert.equal(actual.ok, true, JSON.stringify(actual))
 assert.deepEqual(normalize(actual.value, nativeDir), normalize(expected, nodeDir), label)
 return actual.value
}
function linkedFixture(base) {
 const workspace = join(base, 'workspace'), checkout = join(base, 'framework')
 json(join(workspace, 'package.json'), { dependencies: { '@octane-xplat/ui': 'workspace:*' } })
 json(join(checkout, 'package.json'), { name: 'octane-xplat' })
 file(join(checkout, 'bun.lock'), '{}')
 json(join(checkout, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 file(join(checkout, 'docs/Guide.md'), '# Camera guide\nweb macos\n\n' + '😀'.repeat(300) + '\n')
 mkdirSync(join(workspace, 'node_modules/@octane-xplat'), { recursive: true })
 symlinkSync(join(checkout, 'packages/ui'), join(workspace, 'node_modules/@octane-xplat/ui'))
 return { workspace, checkout }
}
test('linked docs reads preserve binding, provenance, refs, errors and UTF-16 continuation', macOnly, async () => {
 const values = await parity(base => {
  const { workspace } = linkedFixture(base)
  return { operation: 'service', root: workspace, cacheDir: join(base, 'cache'), steps: [
   { method: 'status' }, { method: 'refresh' }, { method: 'guidance' },
   ...[
    { package: '@octane-xplat/ui', path: 'docs/Guide.md' },
    { package: '@octane-xplat/ui', path: 'docs/Guide.md', offset: 30, limit: 1 },
    { package: '@octane-xplat/ui', path: 'docs/Guide.md', offset: 1e308, limit: 2 },
    { package: '@octane-xplat/ui', path: 'docs/Guide.md', offset: null, limit: null },
    { ref: 'xplat-doc://@octane-xplat/ui@development/docs/Guide.md' },
    { ref: 'xplat-doc://@octane-xplat/ui@0.19.0/docs/Guide.md' },
    { ref: 'invalid-ref' }, {}, { package: 'absent' },
    { package: '@octane-xplat/ui', path: 'docs/missing.md' },
    { package: '@octane-xplat/ui', path: '../escape.md' },
    { package: '@octane-xplat/ui' }, { package: '@octane-xplat/ui', path: null }, { package: '@octane-xplat/ui', path: 3 },
    { package: '@octane-xplat/ui', path: 'docs/Guide.md', version: '0.20.0' },
    { package: 'unknown-package', path: 'docs/Guide.md', version: '1.2.3' },
    { package: '@octane-xplat/not-installed', path: 'docs/Guide.md', version: '1.2.3' },
   ].map(options => ({ method: 'read', options })),
   { method: 'resolve', package: '@octane-xplat/ui', version: '0.19.0', resolution: 'cached' },
   { method: 'resolve', package: '@octane-xplat/ui', version: '0.19.0', resolution: 'remote' },
   { method: 'resolve', package: '@octane-xplat/ui', version: '0.19.0', resolution: 'other' },
  ] }
 }, 'linked service')
 assert.equal(values[3].value.provenance.servedVersion, 'development')
 assert.ok(values.some(reply => !reply.ok && reply.message.includes('endsWith')))
 assert.ok(values.some(reply => reply.value?.reason === 'git-unavailable'))
})

test('refresh revisions invalidate on installation identity changes and retain the reference cache policy', macOnly, async () => {
 const values = await parity(base => {
  const { workspace, checkout } = linkedFixture(base)
  const manifest = join(checkout, 'packages/ui/package.json')
  return { operation: 'service', root: workspace, cacheDir: join(base, 'cache'), steps: [
   { method: 'refresh' }, { method: 'refresh' }, { method: 'status' },
   { method: 'write', path: manifest, content: JSON.stringify({ name: '@octane-xplat/ui', version: '0.20.0' }) },
   { method: 'guidance' }, { method: 'status' }, { method: 'refresh' }, { method: 'guidance' },
   { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/Guide.md' } },
  ] }
 }, 'refresh service')
 assert.equal(values[0].value.changed, true)
 assert.equal(values[1].value.changed, false)
 assert.equal(values[4].value.bindingRevision, 1)
 assert.equal(values[6].value.bindingRevision, 2)
 assert.equal(values[7].value.bindingRevision, 2)
})

test('linked packages without checkout docs and lockfile-only packages report distinct fallbacks', macOnly, async () => {
 const values = await parity(base => {
  const workspace = join(base, 'workspace')
  json(join(workspace, 'package.json'), { dependencies: { '@octane-xplat/ui': 'workspace:*', '@octane-xplat/cli': '0.19.0' } })
  json(join(workspace, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
  file(join(workspace, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      "@octane-xplat/cli":\n        version: 0.19.0\n')
  return { operation: 'service', root: workspace, cacheDir: join(base, 'cache'), steps: [
   { method: 'status' }, { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/Guide.md' } },
   { method: 'read', options: { package: '@octane-xplat/cli', path: 'docs/Guide.md' } },
  ] }
 }, 'missing docs')
 assert.equal(values[1].value.reason, 'docs-absent')
 assert.equal(values[1].value.fallback.kind, 'installed-source')
 assert.equal(values[2].value.fallback.kind, 'none')
})

test('documentation read failures preserve directory and permission errors instead of serving empty pages', macOnly, async () => {
 const values = await parity(base => {
  const { workspace, checkout } = linkedFixture(base)
  mkdirSync(join(checkout, 'docs/Directory.md'))
  file(join(checkout, 'docs/Unreadable.md'), '# Private fixture\n')
  chmodSync(join(checkout, 'docs/Unreadable.md'), 0)
  return { operation: 'service', root: workspace, cacheDir: join(base, 'cache'), steps: [
   { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/Directory.md' } },
   { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/Unreadable.md' } },
  ] }
 }, 'read errors')
 assert.equal(values[0].ok, false)
 assert.match(values[0].message, /^EISDIR:/)
 if (process.getuid?.() !== 0) {
  assert.equal(values[1].ok, false)
  assert.match(values[1].message, /^EACCES:/)
 }
})

test('real registry snapshots and version comparisons preserve release provenance through the service', macOnly, async () => {
 const shared = fixture(), repo = join(shared, 'release repo')
 mkdirSync(repo)
 const env = { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' }
 const git = args => {
  const result = spawnSync('/usr/bin/git', ['-C', repo, ...args], { encoding: 'utf8', env: { ...process.env, ...env } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
 }
 git(['init', '-q']); git(['config', 'user.name', 'Native fixture']); git(['config', 'user.email', 'native-fixture@example.invalid'])
 json(join(repo, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 file(join(repo, 'docs/Guide.md'), '# Registry camera\nweb\n')
 git(['add', '.']); git(['commit', '-qm', 'first release']); git(['tag', 'v0.19.0'])
 json(join(repo, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.20.0' })
 git(['add', '.']); git(['commit', '-qm', 'second release']); git(['tag', 'v0.20.0'])
 const values = await parity(base => {
  const workspace = join(base, 'workspace')
  json(join(workspace, 'package.json'), { dependencies: { '@octane-xplat/ui': '0.19.0' } })
  json(join(workspace, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
  return { operation: 'service', root: workspace, cacheDir: join(base, 'cache'), repo, env, gitPath: '/usr/bin/git', steps: [
   { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/Guide.md' } },
   { method: 'read', options: { ref: 'xplat-doc://@octane-xplat/ui@0.19.0/docs/Guide.md' } },
   { method: 'read', options: { package: '@octane-xplat/ui', version: '0.20.0', path: 'docs/Guide.md' } },
   { method: 'read', options: { package: '@octane-xplat/ui', version: '0.21.0', path: 'docs/Guide.md' } },
  ] }
 }, 'registry service')
 assert.equal(values[0].value.provenance.source, 'release-docs')
 assert.equal(values[0].value.provenance.match, 'exact')
 assert.equal(values[2].value.provenance.match, 'outside-installed-binding')
 assert.equal(values[3].value.reason, 'tag-absent')
})

test('real workspace docs reads match live linked installation bindings', macOnly, async () => {
 const dir = fixture()
 const request = { operation: 'service', root: join(root, 'apps/web'), cacheDir: dir, steps: [
  { method: 'read', options: { package: '@octane-xplat/ui', path: 'docs/packages/package-cli.md', offset: 0, limit: 800 } },
  { method: 'guidance' },
 ] }
 const expected = await reference(request)
 const [actual] = native([request])
 assert.equal(actual.ok, true)
 assert.deepEqual(actual.value, expected)
 assert.equal(actual.value[0].ok, true)
 assert.ok(actual.value[0].value.content.length > 0)
})
