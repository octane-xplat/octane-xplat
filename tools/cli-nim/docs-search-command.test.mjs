// Public native docs workflows against the independent TypeScript CLI.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, symlinkSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, 'research/nim-cli/native/xplat')
const scratch = scratchRun(root, 'docs-search')
after(() => rmSync(scratch, { recursive: true, force: true }))
let sequence = 0
function fixture() { const path = join(scratch, String(++sequence)); mkdirSync(path); return path }
function file(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content) }
function json(path, value) { file(path, JSON.stringify(value)) }
function linked(base, packages = ['ui']) {
 const app = join(base, 'app'), checkout = join(base, 'framework')
 json(join(app, 'package.json'), { name: 'docs-app', dependencies: Object.fromEntries(packages.map(name => [`@octane-xplat/${name}`, 'workspace:*'])) })
 file(join(app, 'vite.config.ts'), 'export default {}\n')
 file(join(checkout, 'bun.lock'), '{}')
 for (const name of packages) {
  json(join(checkout, `packages/${name}/package.json`), { name: `@octane-xplat/${name}`, version: '0.19.0' })
  file(join(checkout, `packages/${name}/README.md`), `# ${name} camera README\nweb macos camera\n`)
  mkdirSync(join(app, 'node_modules/@octane-xplat'), { recursive: true })
  symlinkSync(join(checkout, `packages/${name}`), join(app, `node_modules/@octane-xplat/${name}`))
 }
 file(join(checkout, 'docs/camera.md'), '# Camera\n\n## Permission\n\nAsk for camera permission on ios.\n\n## Capture\n\nCapture camera photos on web and macos.\n')
 file(join(checkout, 'docs/storage.md'), '# Storage\n\nSave records in SQLite. web macos\n')
 file(join(checkout, 'docs/notes/camera.md'), '# Camera design\nCamera background notes macos\n')
 file(join(checkout, '.agents/docs/recipes/camera.md'), '# Camera recipe\nCamera photos on ios\n')
 file(join(checkout, 'CHANGELOG.md'), '# Changelog\n\n## 0.19.0 — 2026-01-01\n\nCamera permission on ios.\n')
 file(join(app, 'AGENTS.md'), '# App instructions\nCamera permission belongs to the app.\n')
 file(join(app, 'docs/camera.md'), '# App camera\nLocal camera workflow.\n')
 return { app, checkout }
}
function environment(base, native, extra = {}) {
 return { ...process.env, PATH: '', XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '',
  XPLAT_MCP_CACHE: join(base, native ? 'native-cache' : 'node-cache'),
  XPLAT_NIM_INFERENCE_CACHE: join(base, 'native-assets'), ...extra }
}
function run(base, args, native = true, extra = {}) {
 const result = spawnSync(native ? binary : process.execPath,
  [...(native ? [] : [join(root, 'packages/cli/src/cli.ts')]), ...args],
  { cwd: root, env: environment(base, native, extra), encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024 })
 assert.equal(result.error, undefined, result.error?.message)
 return result
}
function normalize(value) {
 delete value.requestId
 // Native CPU and JS/WASM embeddings deliberately have separate cache identities.
 for (const retrieval of value.data?.retrieval ?? []) {delete retrieval.model}
 return value
}
function parity(base, args, extra = {}) {
 const expected = run(base, args, false, extra), actual = run(base, args, true, extra)
 assert.equal(actual.status, expected.status, actual.stderr)
 assert.equal(actual.stderr, expected.stderr)
 if (!args.includes('--json')) { assert.equal(actual.stdout, expected.stdout); return actual.stdout }
 const a = normalize(JSON.parse(actual.stdout)), e = normalize(JSON.parse(expected.stdout))
 assert.deepEqual(a, e, args.join(' '))
 return a
}
const macOnly = { skip: process.platform === 'darwin' && process.arch === 'arm64' ? false : 'public docs currently qualified on macOS arm64' }

test('public exact/lexical/cold-hybrid search retains corpora, platforms, refs, shared binding and project guidance', macOnly, () => {
 const base = fixture(), { app } = linked(base, ['ui', 'cli'])
 for (const mode of ['exact', 'lexical', 'hybrid']) {
  for (const flags of [[], ['--platform', 'ios'], ['--corpus', 'readme'], ['--corpus', 'changelog'], ['--corpus', 'recipe'], ['--corpus', 'design-note'], ['--limit', '1']]) {
   const result = parity(base, ['docs', 'search', 'camera', '--project', app, '--mode', mode, ...flags, '--json'])
   assert.equal(result.ok, true)
   assert.ok(result.data.results.length > 0)
   assert.ok(result.data.results.every(hit => hit.provenance.verifiedCompatibleSet.length === 2))
   assert.equal(result.data.projectGuidance.length, 2)
   assert.ok(result.data.projectGuidance.every(hit => hit.provenance.source === 'project-guidance'))
   if (mode === 'hybrid') {assert.ok(result.data.retrieval.every(value => value.used === 'lexical'))}
  }
 }
 const args = ['docs', 'search', 'camera', '--project', app, '--package', '@octane-xplat/ui', '--mode', 'exact']
 parity(base, args)
 const found = parity(base, [...args, '--json'])
 const read = parity(base, ['docs', 'read', '--project', app, '--ref', found.data.results[0].ref, '--json'])
 assert.ok(read.data.content.includes('camera'))
 assert.equal(existsSync(join(base, 'native-assets/model')), false)
 assert.deepEqual(readdirSync(join(base, 'native-cache/nim-v1/operations')), [])
})

test('search selection, parse failures, no hits and missing packages preserve public envelopes', macOnly, () => {
 const base = fixture(), { app } = linked(base)
 for (const args of [
  ['docs', 'search'], ['docs', 'search', 'camera', '--mode', 'bad'],
  ['docs', 'search', 'camera', '--limit', '51'], ['docs', 'search', '😀'.repeat(251)],
  ['docs', 'search', 'no matching words', '--package', 'absent'],
  ['docs', 'search', 'no matching words', '--mode', 'exact'],
  ['docs', 'search', 'camera', '--package', 'absent', '--version', '1.0.0'],
 ]) {parity(base, [...args, '--project', app, '--json'])}
 const empty = join(base, 'empty'); json(join(empty, 'package.json'), {})
 assert.equal(parity(base, ['docs', 'search', 'camera', '--project', empty, '--json']).error.code, 'invalid_selection')
 const multi = join(base, 'multi')
 json(join(multi, 'package.json'), { private: true, workspaces: ['apps/*'] })
 for (const name of ['a', 'b']) {
  json(join(multi, `apps/${name}/package.json`), { name, dependencies: { '@octane-xplat/ui': '0.19.0' } })
  file(join(multi, `apps/${name}/vite.config.ts`), 'export default {}\n')
 }
 assert.equal(parity(base, ['docs', 'search', 'camera', '--project', multi, '--json']).error.code, 'ambiguous_selection')
 parity(base, ['docs', 'search', 'camera', '--project', multi, '--app', 'apps/b', '--json'])
})

test('public release search pins real Git tags, compares versions, exposes conflicts and reuses offline snapshots', macOnly, () => {
 const base = fixture(), repo = join(base, 'release repo'), app = join(base, 'app')
 mkdirSync(repo)
 const fixed = { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' }
 const git = args => {
  const result = spawnSync('/usr/bin/git', ['-C', repo, ...args], { env: { ...process.env, ...fixed }, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim()
 }
 git(['init', '-q']); git(['config', 'user.name', 'Native fixture']); git(['config', 'user.email', 'native-fixture@example.invalid'])
 for (const version of ['0.19.0', '0.20.0']) {
  json(join(repo, 'packages/ui/package.json'), { name: '@octane-xplat/ui', version })
  file(join(repo, 'docs/camera.md'), `# Camera ${version}\nCamera permission web macos\n`)
  git(['add', '.']); git(['commit', '-qm', version]); git(['tag', 'v' + version])
 }
 json(join(app, 'package.json'), { name: 'release-app', dependencies: { '@octane-xplat/ui': '0.19.0' } })
 file(join(app, 'vite.config.ts'), 'export default {}\n')
 json(join(app, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 const env = { ...fixed, PATH: '/usr/bin:/bin', GIT_CONFIG_COUNT: '2',
  GIT_CONFIG_KEY_0: `url.${repo}.insteadOf`, GIT_CONFIG_VALUE_0: 'https://github.com/octane-xplat/octane-xplat',
  GIT_CONFIG_KEY_1: 'protocol.file.allow', GIT_CONFIG_VALUE_1: 'always' }
 const args = ['docs', 'search', 'camera', '--project', app, '--json']
 const found = parity(base, args, env)
 assert.equal(found.data.results[0].provenance.servedVersion, '0.19.0')
 const comparison = parity(base, [...args, '--version', '0.20.0'], env)
 assert.equal(comparison.data.results[0].provenance.match, 'outside-installed-binding')
 rmSync(join(app, 'node_modules/@octane-xplat/ui'), { recursive: true })
 file(join(app, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      "@octane-xplat/ui":\n        version: 0.19.0\n')
 const provisional = parity(base, args, env)
 assert.ok(provisional.data.results.every(hit => hit.provisional === true))
 json(join(app, 'node_modules/@octane-xplat/ui/package.json'), { name: '@octane-xplat/ui', version: '0.19.0' })
 git(['tag', '-d', 'v0.19.0'])
 assert.equal(parity(base, args, env).data.conflicts.length, 1)
 const offline = parity(base, args)
 assert.equal(offline.data.results[0].provenance.offline, true)
 const read = parity(base, ['docs', 'read', '--project', app, '--ref', found.data.results[0].ref, '--json'])
 assert.equal(read.data.provenance.commit, found.data.results[0].provenance.commit)
 assert.deepEqual(readdirSync(join(base, 'native-cache/nim-v1/operations')), [])
})

test('explicit empty indexing needs no model, and unavailable packages remain distinct', macOnly, () => {
 const base = fixture(), { app, checkout } = linked(base)
 for (const directory of ['docs', '.agents', 'packages/ui/README.md', 'CHANGELOG.md']) {rmSync(join(checkout, directory), { recursive: true, force: true })}
 mkdirSync(join(checkout, 'docs'))
 const result = JSON.parse(run(base, ['docs', 'index', '--project', app, '--json']).stdout)
 assert.equal(result.ok, true)
 assert.equal(result.data.results.length, 1)
 assert.equal(result.data.results[0].chunks, 0)
 assert.equal(result.data.results[0].embedded, 0)
 assert.equal(existsSync(join(base, 'native-assets/model')), false)
 const absent = parity(base, ['docs', 'index', '--project', app, '--package', 'absent', '--version', '1.0.0', '--json'])
 assert.equal(absent.data.unavailable.length, 1)
})

test('native traversal bounds symlink cycles and excludes documents outside the selected corpus', macOnly, () => {
 const base = fixture(), { app, checkout } = linked(base)
 const secret = join(base, 'outside.md'); file(secret, '# Outside secret\nprivate-canary\n')
 symlinkSync(join(checkout, 'docs'), join(checkout, 'docs/cycle'))
 symlinkSync(secret, join(checkout, 'docs/leak.md'))
 symlinkSync(secret, join(app, 'docs/leak.md'))
 for (const mode of ['exact', 'lexical']) {
  const result = run(base, ['docs', 'search', 'private-canary', '--project', app, '--mode', mode, '--json'])
  assert.equal(result.status, 0, result.stderr)
  const data = JSON.parse(result.stdout).data
  assert.deepEqual(data.results, []); assert.deepEqual(data.projectGuidance, [])
 }
 const read = JSON.parse(run(base, ['docs', 'read', '--project', app, '--package', '@octane-xplat/ui', '--path', 'docs/leak.md', '--json']).stdout)
 assert.equal(read.data.status, 'unavailable')
 assert.equal(read.data.reason, 'docs-absent')
})

test('maintained repository guides are searchable from the actual installed web app binding', macOnly, () => {
 const base = fixture()
 const result = parity(base, ['docs', 'search', 'xplat', '--project', root, '--app', 'apps/web', '--package', '@octane-xplat/ui', '--mode', 'exact', '--limit', '3', '--json'])
 assert.equal(result.data.results.length, 3)
 assert.ok(result.data.results.every(hit => hit.provenance.source === 'development-docs'))
})

test('oversized documentation fails explicitly instead of appearing to have no matching text', macOnly, () => {
 const base = fixture(), { app, checkout } = linked(base)
 file(join(checkout, 'docs/oversized.md'), '# Oversized\n' + 'x'.repeat(4 * 1024 * 1024))
 for (const mode of ['exact', 'lexical']) {
  const result = run(base, ['docs', 'search', 'camera', '--project', app, '--mode', mode, '--json'])
  assert.equal(result.status, 3)
  const reply = JSON.parse(result.stdout)
  assert.equal(reply.ok, false); assert.equal(reply.error.code, 'unavailable')
  assert.match(reply.error.message, /4 MiB/)
 }
})
