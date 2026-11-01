import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, chmodSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function fixture() { const path = mkdtempSync(join(tmpdir(), 'xplat-nim-docs-command-')); fixtures.push(path); return path }
function file(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content) }
function json(path, value) { file(path, JSON.stringify(value)) }
function app(path, name, packageVersion = 'workspace:*') {
 json(join(path, 'package.json'), { name, dependencies: { '@octane-xplat/ui': packageVersion } })
 file(join(path, 'vite.config.ts'), 'export default {}\n')
}
function linkedApp(path, checkout) {
 app(path, 'fixture-app')
 json(join(checkout, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 file(join(checkout, 'bun.lock'), '{}')
 file(join(checkout, 'docs/Guide.md'), '# Camera guide\nweb macos\n\n' + '😀'.repeat(300) + '\n')
 mkdirSync(join(path, 'node_modules/@octane-xplat'), { recursive: true })
 symlinkSync(join(checkout, 'packages/ui'), join(path, 'node_modules/@octane-xplat/ui'))
}
function parity(args, { cache = fixture(), env = {} } = {}) {
 const common = { ...process.env, PATH: '', XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '', ...env }
 const expected = spawnSync(process.execPath, [join(root, 'packages/cli/src/cli.ts'), 'docs', 'read', ...args],
  { cwd: root, env: { ...common, XPLAT_MCP_CACHE: join(cache, 'node') }, encoding: 'utf8', timeout: 20000 })
 const actual = spawnSync(binary, ['docs', 'read', ...args],
  { cwd: root, env: { ...common, XPLAT_MCP_CACHE: join(cache, 'native') }, encoding: 'utf8', timeout: 20000 })
 assert.equal(actual.status, expected.status, `${args.join(' ')}: ${actual.stderr || actual.error?.message || ''}`)
 assert.equal(actual.stderr, expected.stderr)
 if (args.includes('--json')) {
  const a = JSON.parse(actual.stdout), e = JSON.parse(expected.stdout)
  delete a.requestId; delete e.requestId
  assert.deepEqual(a, e, args.join(' '))
  return a
 }
 assert.equal(actual.stdout, expected.stdout)
 return actual.stdout
}
const macOnly = { skip: process.platform === 'darwin' ? false : 'docs read collation and Git workflows qualified on macOS' }
test('native docs reads preserve linked bindings, continuation, result statuses and human streams', macOnly, () => {
 const dir = fixture(), project = join(dir, 'app'), checkout = join(dir, 'framework')
 linkedApp(project, checkout)
 const context = ['--project', project]
 for (const options of [
  ['--package', '@octane-xplat/ui', '--path', 'docs/Guide.md'],
  ['--ref', 'xplat-doc://@octane-xplat/ui@development/docs/Guide.md'],
  ['--ref', 'xplat-doc://@octane-xplat/ui@0.19.0/docs/Guide.md'],
  ['--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--offset', '26', '--limit', '1'],
  ['--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--offset', '1e308', '--limit', '2'],
  ['--ref', 'bad-ref'], ['--package', '@octane-xplat/ui', '--path', 'missing.md'],
  ['--package', '@octane-xplat/ui', '--path', '../escape.md'], ['--package', '@octane-xplat/ui'], [],
  ['--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--version', '0.20.0'],
  ['--package', 'unknown-package', '--version', '1.2.3', '--path', 'docs/Guide.md'],
 ]) parity([...context, ...options, '--json'])
 const read = parity([...context, '--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--json'])
 assert.equal(read.ok, true)
 assert.ok(read.data.content.includes('Camera guide'))
 assert.equal(read.data.provenance.servedVersion, 'development')
 for (const options of [
  ['--ref', read.data.ref], ['--ref', 'bad-ref'], ['--package', '@octane-xplat/ui'],
 ]) parity([...context, ...options])
 mkdirSync(join(checkout, 'docs/Directory.md'))
 file(join(checkout, 'docs/Unreadable.md'), '# Private fixture\n')
 chmodSync(join(checkout, 'docs/Unreadable.md'), 0)
 for (const path of ['docs/Directory.md', 'docs/Unreadable.md']) parity([...context, '--package', '@octane-xplat/ui', '--path', path, '--json'])
})

test('docs reads retain app selection and envelope binding rules', macOnly, () => {
 const dir = fixture(), checkout = join(dir, 'framework')
 json(join(dir, 'package.json'), { private: true, workspaces: ['apps/*'] })
 linkedApp(join(dir, 'apps/a'), checkout); linkedApp(join(dir, 'apps/b'), checkout)
 const flags = ['--project', dir, '--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--json']
 assert.equal(parity(flags).error.code, 'ambiguous_selection')
 const explicit = parity([...flags, '--app', 'apps/b'])
 assert.equal(explicit.ok, true); assert.equal(explicit.context.projectId, 'apps/b')
 json(join(dir, 'node_modules/.cache/xplat/agent/docs_test.json'), { client: 'docs_test', appId: 'apps/a' })
 assert.equal(parity([...flags, '--client', 'docs_test']).context.selection.reason, 'preference')
 parity([...flags, '--app', 'missing'])
 const empty = fixture(); json(join(empty, 'package.json'), {})
 assert.equal(parity(['--project', empty, '--json']).error.code, 'invalid_selection')
})

test('public registry docs read uses exact tags, separate cold caches, offline pins and explicit comparisons', macOnly, () => {
 const dir = fixture(), repo = join(dir, 'release repo'), project = join(dir, 'app'), cache = join(dir, 'cache')
 mkdirSync(repo)
 const fixed = { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' }
 const git = args => {
  const result = spawnSync('/usr/bin/git', ['-C', repo, ...args], { env: { ...process.env, ...fixed }, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
 }
 git(['init', '-q']); git(['config', 'user.name', 'Native fixture']); git(['config', 'user.email', 'native-fixture@example.invalid'])
 json(join(repo, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 file(join(repo, 'docs/Guide.md'), '# Registry camera version one\nweb\n')
 git(['add', '.']); git(['commit', '-qm', 'first']); git(['tag', 'v0.19.0'])
 const first = git(['rev-parse', 'HEAD'])
 json(join(repo, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version: '0.20.0' })
 file(join(repo, 'docs/Guide.md'), '# Registry camera version two\nmacos\n')
 git(['add', '.']); git(['commit', '-qm', 'second']); git(['tag', 'v0.20.0'])
 app(project, 'registry-app', '0.19.0')
 json(join(project, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 // Only these child processes see the URL rewrite. Both CLIs keep canonical
 // release provenance while Git fetches the owned local fixture repository.
 const env = { ...fixed, PATH: '/usr/bin:/bin', GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: `url.${repo}.insteadOf`, GIT_CONFIG_VALUE_0: 'https://github.com/octane-xplat/octane-xplat',
  GIT_CONFIG_KEY_1: 'protocol.file.allow', GIT_CONFIG_VALUE_1: 'always' }
 const args = ['--project', project, '--package', '@octane-xplat/ui', '--path', 'docs/Guide.md', '--json']
 const read = parity(args, { cache, env })
 assert.equal(read.ok, true)
 assert.equal(read.data.provenance.commit, first)
 assert.equal(read.data.provenance.repo, 'https://github.com/octane-xplat/octane-xplat')
 assert.ok(read.data.content.includes('version one'))
 const comparison = parity([...args, '--version', '0.20.0'], { cache, env })
 assert.equal(comparison.data.provenance.match, 'outside-installed-binding')
 assert.ok(comparison.data.content.includes('version two'))
 git(['tag', '-d', 'v0.19.0'])
 assert.equal(parity(args, { cache, env }).data.status, 'tag-conflict')
 const offline = parity(args, { cache, env: { ...env, PATH: '' } })
 assert.equal(offline.data.provenance.offline, true)
 assert.equal(offline.data.provenance.commit, first)
 assert.ok(offline.data.content.includes('version one'))
})

test('real repository docs read resolves the web app installed-version binding', macOnly, () => {
 const read = parity(['--project', root, '--app', 'apps/web', '--package', '@octane-xplat/ui', '--path', 'docs/packages/package-cli.md', '--limit', '800', '--json'])
 assert.equal(read.ok, true)
 assert.equal(read.data.provenance.source, 'development-docs')
 assert.ok(read.data.content.length > 0)
})
