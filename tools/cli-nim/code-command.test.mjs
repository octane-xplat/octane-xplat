import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
const reference = join(root, 'packages/cli/src/cli.ts')
const fixtures = []
function fixture() { const dir = mkdtempSync(join(tmpdir(), 'xplat-code-command-')); fixtures.push(dir); return dir }
after(() => { for (const dir of fixtures) rmSync(dir, { recursive: true, force: true }) })
function file(path, contents) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, contents) }
function json(path, value) { file(path, JSON.stringify(value)) }
function app(path, name) {
 json(join(path, 'package.json'), { name, dependencies: { '@octane-xplat/ui': 'workspace:*' } })
 file(join(path, 'vite.config.ts'), 'export default {}\n')
 file(join(path, 'src/CameraView.tsrx'), 'export const CameraView = () => useCameraCapture()\n😀 camera\n')
}
function normalize(text) { const value = JSON.parse(text); delete value.requestId; return value }
function parity(args, { path = '', cwd = root } = {}) {
 const env = { ...process.env, PATH: path, XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '' }
 const expected = spawnSync(process.execPath, [reference, ...args], { encoding: 'utf8', env, cwd, timeout: 20000 })
 const actual = spawnSync(binary, args, { encoding: 'utf8', env, cwd, timeout: 20000 })
 assert.equal(actual.status, expected.status, `${args.join(' ')}: ${actual.stderr}`)
 assert.equal(actual.stderr, expected.stderr)
 if (args.includes('--json')) {
  const e = normalize(expected.stdout), a = normalize(actual.stdout)
  assert.deepEqual(a, e, args.join(' '))
  return a
 }
 assert.equal(actual.stdout, expected.stdout)
 return actual.stdout
}
test('native code commands preserve search modes, corpus filters, UTF-16 reads and errors', () => {
 const dir = fixture(); app(dir, 'demo')
 file(join(dir, 'private/fixture.ts'), 'fixture-private-text')
 file(join(dir, 'src/binary.ts'), 'camera\0fixture')
 file(join(dir, 'src/invalid-utf8.ts'), Buffer.from([0x61, 0xff, 0xe1, 0x80, 0x0a, 0x62]))
 file(join(dir, 'outside.json'), 'fixture-not-code')
 symlinkSync(join(dir, 'private/fixture.ts'), join(dir, 'allowed-alias.ts'))
 const pkg = join(dir, 'node_modules/@octane-xplat/ui')
 json(join(pkg, 'package.json'), { name: '@octane-xplat/ui', version: '0.20.0' })
 file(join(pkg, 'src/CameraView.tsrx'), 'export const CameraView = () => useCameraCapture()\n')
 const searches = []
 for (const mode of ['exact', 'auto', 'semantic']) for (const corpus of ['app', 'framework', 'all'])
  searches.push(['code', 'search', 'CameraView', '--mode', mode, '--corpus', corpus, '--limit', '2'])
 searches.push(['code', 'search', 'no-such-identifier'], ['code', 'search', 'camera', '--package', '@octane-xplat/ui'], ['code', 'search', 'camera', '--platform', 'ios'])
 for (const args of searches) parity([...args, '--project', dir, '--json'])
 const result = parity(['code', 'search', 'CameraView', '--project', dir, '--mode', 'exact', '--json'])
 assert.equal(result.ok, true); assert.ok(result.data.results.length > 0)
 parity(['code', 'read', '--ref', result.data.results[0].ref, '--project', dir, '--json'])
 for (const args of [
  ['--path', 'src/CameraView.tsrx'], ['--path', 'src/CameraView.tsrx', '--offset', '49', '--limit', '1'],
  ['--path', 'src/CameraView.tsrx', '--offset', '1e308', '--limit', '2'], ['--path', 'src/invalid-utf8.ts'],
  ['--corpus', 'framework', '--package', '@octane-xplat/ui', '--path', 'CameraView.tsrx'],
  ['--path', 'private/fixture.ts'], ['--path', 'allowed-alias.ts'], ['--path', '../escape.ts'], ['--path', 'outside.json'],
  ['--path', 'src/binary.ts'], ['--path', 'src/missing.ts'], ['--ref', 'bad-ref'], [],
 ]) parity(['code', 'read', ...args, '--project', dir, '--json'])
 parity(['code', 'search', 'CameraView', '--mode', 'exact', '--project', dir])
 parity(['code', 'search', 'no-such-identifier', '--project', dir])
 parity(['code', 'read', '--path', 'src/CameraView.tsrx', '--offset', '49', '--limit', '1', '--project', dir])
})
test('consumer ambiguity, saved selection and framework-only workspaces keep the same binding rules', () => {
 const dir = fixture(); json(join(dir, 'package.json'), { private: true, workspaces: ['apps/*'] })
 app(join(dir, 'apps/a'), 'alpha'); app(join(dir, 'apps/b'), 'beta')
 const ambiguous = parity(['code', 'search', 'camera', '--project', dir, '--json'])
 assert.equal(ambiguous.error.code, 'ambiguous_selection')
 parity(['code', 'search', 'CameraView', '--project', dir, '--app', 'apps/a', '--json'])
 parity(['code', 'read', '--path', 'apps/b/src/CameraView.tsrx', '--project', dir, '--app', 'apps/a', '--json'])
 // Preference writers have timestamps, so seed the shared data contract directly.
 json(join(dir, 'node_modules/.cache/xplat/agent/code_test.json'), { client: 'code_test', appId: 'apps/b' })
 parity(['code', 'search', 'CameraView', '--project', dir, '--client', 'code_test', '--json'])
 const empty = fixture(); json(join(empty, 'package.json'), {})
 assert.equal(parity(['code', 'read', '--path', 'src/a.ts', '--project', empty, '--json']).error.code, 'invalid_selection')
 const framework = fixture(); json(join(framework, 'package.json'), { name: 'octane-xplat' })
 json(join(framework, 'packages/ui/package.json'), { name: '@octane-xplat/ui' })
 file(join(framework, 'packages/ui/src/CameraView.ts'), 'export const CameraView = 1\n')
 const found = parity(['code', 'search', 'CameraView', '--project', framework, '--json'])
 assert.equal(found.ok, true); assert.ok(found.data.results.length > 0)
 parity(['code', 'read', '--corpus', 'framework', '--package', '@octane-xplat/ui', '--path', 'CameraView.ts', '--project', framework, '--json'])
})
test('large first-search indexes report preparing rather than blocking exact results', () => {
 const dir = fixture(); app(dir, 'large-demo')
 for (let i = 0; i < 45; i++) file(join(dir, `src/file-${i}.ts`), `export const cameraCapture${i} = () => photographScene()\n`)
 for (const mode of ['exact', 'auto', 'semantic']) {
  const reply = parity(['code', 'search', 'camera', '--mode', mode, '--project', dir, '--json'])
  assert.equal(reply.ok, true)
  assert.equal(reply.data.semantic.state, mode === 'exact' ? 'not-requested' : 'preparing')
  if (mode !== 'semantic') assert.ok(reply.data.results.length > 0)
 }
})
test('real workspace app references remain workspace-relative and readable', () => {
 const context = ['--project', root, '--app', 'apps/web', '--json']
 const found = parity(['code', 'search', 'main', '--corpus', 'app', '--mode', 'exact', ...context])
 assert.equal(found.ok, true)
 assert.ok(found.data.results.length > 0)
 const reference = found.data.results.find(hit => hit.ref === 'xplat-code://app/apps/web/src/main.tsrx')?.ref
 assert.ok(reference, 'real app fixture must expose the workspace-relative entry')
 const read = parity(['code', 'read', '--ref', reference, ...context])
 assert.equal(read.ok, true)
 assert.ok(read.data.content.length > 0)
})
test('real git freshness uses argv capture and tracks committed and modified source', () => {
 const dir = fixture(); app(dir, 'git-demo')
 const git = args => { const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr) }
 git(['init', '--quiet']); git(['config', 'core.fsmonitor', 'false']); git(['add', '.'])
 git(['-c', 'user.name=Xplat Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture'])
 const args = ['code', 'search', 'CameraView', '--mode', 'exact', '--project', dir, '--json']
 assert.match(parity(args, { path: process.env.PATH }).data.tree, /^HEAD [a-f0-9]{12}, clean$/)
 file(join(dir, 'src/CameraView.tsrx'), 'export const CameraView = 2\n')
 assert.match(parity(args, { path: process.env.PATH }).data.tree, /, 1 uncommitted$/)
})
