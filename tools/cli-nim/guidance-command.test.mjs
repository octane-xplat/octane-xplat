import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function fixture() { const path = mkdtempSync(join(tmpdir(), 'xplat-nim-guidance-')); fixtures.push(path); return path }
function file(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content) }
function json(path, value) { file(path, JSON.stringify(value)) }
function app(path, name, version) {
 json(join(path, 'package.json'), { name, dependencies: { '@octane-xplat/ui': 'workspace:*' } })
 file(join(path, 'vite.config.ts'), 'export default {}\n')
 if (version !== undefined) json(join(path, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version })
}
function parity(args) {
 const env = { ...process.env, PATH: '', XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '' }
 const expected = spawnSync(process.execPath, [join(root, 'packages/cli/src/cli.ts'), 'guidance', ...args], { encoding: 'utf8', env, timeout: 20000, cwd: root })
 const actual = spawnSync(binary, ['guidance', ...args], { encoding: 'utf8', env, timeout: 20000, cwd: root })
 assert.equal(actual.status, expected.status, actual.stderr || actual.error?.message)
 assert.equal(actual.stderr, expected.stderr)
 if (args.includes('--json')) {
  const a = JSON.parse(actual.stdout), e = JSON.parse(expected.stdout)
  delete a.requestId; delete e.requestId
  assert.deepEqual(a, e)
  return a
 }
 assert.equal(actual.stdout, expected.stdout)
 return actual.stdout
}
test('native guidance binds real installed versions, linked sources and lockfile discrepancies', () => {
 const path = fixture(); app(path, 'demo', '0.19.0')
 file(join(path, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      "@octane-xplat/ui":\n        specifier: workspace:*\n        version: 0.18.0\n')
 const result = parity(['--project', path, '--json'])
 assert.equal(result.ok, true)
 assert.equal(result.context.projectId, null)
 assert.equal(result.data.bindingRevision, 1)
 assert.ok(result.data.entries.some(entry => entry.id === 'linked'))
 assert.ok(result.data.entries.some(entry => entry.id === 'discrepancy'))
 assert.ok(result.data.entries[0].body.includes('@octane-xplat/ui@0.19.0'))
 parity(['--project', path])
 const empty = fixture(); app(empty, 'uninstalled')
 const unresolved = parity(['--project', empty, '--json'])
 assert.equal(unresolved.ok, true)
 assert.ok(unresolved.data.entries[0].body.includes('none detected'))
})
test('guidance preserves ambiguous, absent, explicit and saved app selection', () => {
 const path = fixture()
 json(join(path, 'package.json'), { private: true, workspaces: ['apps/*'] })
 app(join(path, 'apps/a'), 'alpha', '0.19.0'); app(join(path, 'apps/b'), 'beta', '0.20.0')
 assert.equal(parity(['--project', path, '--json']).error.code, 'ambiguous_selection')
 const explicit = parity(['--project', path, '--app', 'apps/b', '--json'])
 assert.equal(explicit.context.projectId, 'apps/b')
 assert.ok(explicit.data.entries[0].body.includes('@octane-xplat/ui@0.20.0'))
 json(join(path, 'node_modules/.cache/xplat/agent/guidance_test.json'), { client: 'guidance_test', appId: 'apps/a' })
 const saved = parity(['--project', path, '--client', 'guidance_test', '--json'])
 assert.equal(saved.context.selection.reason, 'preference')
 parity(['--project', path, '--app', 'missing', '--json'])
 const empty = fixture(); json(join(empty, 'package.json'), {})
 assert.equal(parity(['--project', empty, '--json']).error.code, 'invalid_selection')
 parity(['--project', empty])
})
test('real repository app guidance matches the TypeScript provider without Node on native PATH', () => {
 const result = parity(['--project', root, '--app', 'apps/web', '--json'])
 assert.equal(result.ok, true)
 assert.ok(result.data.entries[0].body.includes('@octane-xplat/ui@'))
})
