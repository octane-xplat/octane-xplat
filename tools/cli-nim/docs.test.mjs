import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, chmodSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { chunkMarkdown } from '../../packages/docs-search/src/chunks.ts'
import { listDocs, searchDocs, readPage, platformsOf, docRef, parseDocRef } from '../../packages/cli/src/mcp/docs-retrieval.ts'
import { ensureSnapshot, remoteTagSha, boundProvenance } from '../../packages/cli/src/mcp/docs-snapshots.ts'
import { tailoredGuidance } from '../../packages/cli/src/mcp/docs-guidance.ts'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/docs-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const dir of fixtures) rmSync(dir, { recursive: true, force: true }) })
function fixture() { const dir = mkdtempSync(join(tmpdir(), 'xplat-nim-docs-')); fixtures.push(dir); return dir }
function file(path, content) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content) }
function expected(request) {
 const { operation, root, document, path, content, query, corpus, platform, limit, packageDir, offset, reference, locale, left, right } = request
 switch (operation) {
 case 'chunks': return chunkMarkdown(document)
 case 'guidance': return tailoredGuidance(request.installation)
 case 'title': return content.match(/^#\s+(.+)$/m)?.[1].trim() ?? path.split('/').at(-1).replace(/\.md$/, '')
 case 'platforms': return platformsOf(path, content)
 case 'list': return listDocs(root)
 case 'search': return searchDocs(root, { query, corpus, platform, limit, packageDir })
 case 'read': return readPage(root, path, { offset, limit })
 case 'reference': return docRef(request.package, request.version, path)
 case 'parse-reference': return parseDocRef(reference)
 case 'collation': return Math.sign(left.localeCompare(right, locale || undefined))
 default: throw Error(operation)
 }
}
function compare(cases, label, env = {}) {
 const run = spawnSync(binary, [], { input: cases.map(value => JSON.stringify(value)).join('\n') + '\n',
  encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000, env: { ...process.env, ...env, PATH: '' } })
 assert.equal(run.status, 0, run.stderr || run.error?.message)
 assert.equal(run.stderr, '')
 const replies = run.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(replies.length, cases.length)
 for (const [at, request] of cases.entries()) {
  const reference = JSON.parse(JSON.stringify(expected(request)))
  assert.equal(replies[at].ok, true, JSON.stringify({ request, reply: replies[at] }))
  assert.deepEqual(replies[at].value, reference, `${label} case ${at}: ${JSON.stringify(request)}`)
 }
 console.log(`${cases.length} documentation differential cases checked (${label})`)
 return replies.map(reply => reply.value)
}

test('Markdown chunks preserve headings, fences, paragraph bounds, release ownership and hashes', () => {
 const content = [
  '', 'plain text', '# Heading\ntext\n', '# Heading\r\ntext\r\n', '#\nnext', '#  ', '# ',
  'preamble\n# Main\n\nparagraph\n## Topic\nbody\n### Subheading\ntail',
  '# Guide\n```ts\n## Example heading\n```\n## Actual heading\ntext',
  '# Guide\n~~~js\n# Example heading\n```\n~~~\n## Topic',
  '# Guide\n````ts\n```\n## Inside\n`````\n## Outside',
  '# Guide\n    ```\n## Outside\n    ```',
  '# Guide\n\u00a0\u2000```\n## Inside\n```\n## Outside',
  '# Guide\n' + '😀'.repeat(450) + '\n\n## Topic\nbody',
  '# Guide\n' + 'x'.repeat(899) + '\n\nparagraph\n\n' + 'b'.repeat(950) + '\n\nend',
  '# Changelog\n\n## Octane Xplat 0.19.0 — 2026-10-01\nweb\n### Feature\nios\n## [v0.20.0-nim.1](link) 2026-11-01\nmacos\n## Unreleased\nnext',
  '# Changelog\n## v1.2.3\nbody\n## prefix 2.3.4\nbody\n## [1.2.3-beta._a] 2026-99-99\nbody',
  '# \ud800\n## \udc00\nbody 😀\n', '# Heading\u2028tail\ntext', '# \u2028tail\nbody',
  '# Main\r\n## 1.2.3\r\ntext\r\n',
 ]
 for (const space of [' ', '\t', '\v', '\f', '\r', '\u0085', '\u00a0', '\u1680', '\u2028', '\u2029', '\ufeff'])
  for (const count of [0, 1, 3, 4]) content.push('# Guide\n' + space.repeat(count) + '```\n## Inside\n```\n## After\n')
 const cases = content.flatMap(content => ['guide', 'changelog'].map(corpus => ({ operation: 'chunks', document: { path: 'docs/é😀.md', corpus, content } })))
 const values = compare(cases, 'chunks')
 assert.ok(values.some(chunks => chunks.some(chunk => chunk.releaseVersion === '0.20.0-nim.1')))
})

test('document titles and platform labels preserve JS line, word and UTF-16 rules', () => {
 const cases = []
 for (const content of ['# Title\nbody', '# Title\r\nbody', '#\nTitle', 'preamble\r# Title\rnext', '#  ', '# ',
  '# 😀 title', '# \ud800 title', '# Title\u2028next', '# \u2028next', '# First\n# Second', 'body'])
  cases.push({ operation: 'title', path: 'docs/Fallback.md', content })
 for (const content of ['web ios android macos linux windows', 'web-like IOS\nmacOS', '_web web_ web2 2web', 'éweb😀windows中',
  'İOS Σ WINDOWS', '😀'.repeat(999) + 'web', '😀'.repeat(1000) + 'web', '\ud800web'])
  for (const path of ['docs/guide.md', 'docs/web.md', 'docs/web_ios.md']) cases.push({ operation: 'platforms', path, content })
 compare(cases, 'labels')
})

test('tailored guidance preserves installation versions, duplicates, linked sources and discrepancies', () => {
 const cases = []
 for (const packages of [[], [{ name: '@octane-xplat/ui', version: '0.19.0', kind: 'registry' }],
  [{ name: '@octane-xplat/ui', version: '0.19.0', kind: 'linked' }, { name: '@octane-xplat/ui', version: '0.19.0', kind: 'linked' }],
  [{ name: '@octane-xplat/ui', version: '0.19.0', kind: 'linked' }, { name: 'tsrx-typegen', version: '0.9.0', kind: 'registry' }],
  [{ name: '@octane-xplat/ui', version: '\ud800', kind: 'linked' }],
  [{ name: 'numeric', version: -0, kind: 'registry' }, { name: 'array', version: [1, null, '2'], kind: 'linked' }], [{}]])
  for (const discrepancies of [[], ['fixture mismatch'], ['first mismatch', 'second mismatch'], ['\ud800'], [null, true, { value: 1 }]])
   cases.push({ operation: 'guidance', installation: { packages, discrepancies } })
 const values = compare(cases, 'guidance')
 assert.ok(values.some(entries => entries.some(entry => entry.id === 'discrepancy')))
 assert.ok(values.some(entries => entries.some(entry => entry.id === 'linked')))
})

test('doc refs preserve greedy package grouping and line terminators inside only the version class', () => {
 const refs = ['bad', 'xplat-doc://', 'xplat-doc://a@1/a.md', 'xplat-doc://@octane-xplat/ui@development/docs/a.md',
  'xplat-doc://a@v/x@y/z', 'xplat-doc://a@@/a', 'xplat-doc://a@1/a.md\n', 'xplat-doc://a@1/a.md\r\n',
  'xplat-doc://a@1/a.md\u2028', 'xplat-doc://a@1\n/a.md', 'xplat-doc://a@1\r\n/a.md',
  'xplat-doc://a\nb@1/a.md', 'xplat-doc://a@1/a\nb.md', 'xplat-doc://a@/b.md', 'xplat-doc://@1/a.md',
  'xplat-doc://a@1/', 'xplat-doc://a@1/../a.md', 'xplat-doc://a@1/a\0.md', 'xplat-doc://\ud800@\udc00/😀.md']
 const cases = refs.map(reference => ({ operation: 'parse-reference', reference }))
 for (const pkg of ['@octane-xplat/ui', 'tsrx-typegen', 'a@b', '\ud800'])
  cases.push({ operation: 'reference', package: pkg, version: 'development', path: 'docs/😀.md' })
 compare(cases, 'refs')
})

const macOnly = { skip: process.platform !== 'darwin' ? 'macOS collation adapter; other hosts are not qualified' : false }
test('macOS ICU collation matches Node default and explicit language orders', macOnly, () => {
 const names = ['a','A','ä','a\u0308','á','Å','ß','ss','Σ','σ','ς','İ','i','ı','I','é','e\u0301','z','Z','中','文','😀','_','-','.', ' ','$','10','2','9','æ','ae','œ','oe','þ','th','ö','o','ñ','n','ø','o\u0338','Œ','Þ','ﬃ','ffi','𐐀','𐐨','\ud800','\udc00','\0','a\0b','\u{1E6C0}','\u{16EA0}']
 const cases = names.flatMap(left => names.map(right => ({ operation: 'collation', left, right })))
 for (const locale of ['en-US', 'sv-SE', 'de-DE', 'tr-TR', 'zh-CN', 'ja-JP'])
  for (const left of names) for (const right of ['a', 'z', 'İ', '😀']) cases.push({ operation: 'collation', locale, left, right })
 compare(cases, 'collation')
})

test('documentation inventory, exact search and reads match reference corpus and release boundaries', macOnly, () => {
 const dir = fixture()
 for (const [path, content] of Object.entries({
  'docs/Guide.md': '# Camera guide\nweb ios\n\nCameraView captures a scene.\n\n' + '😀'.repeat(300),
  'docs/guide.md': '# Camera fallback\nandroid macos\n\nCameraView and photographScene\n',
  'docs/é.md': '# Camera accent\nwindows linux\n',
  'docs/notes/camera.md': '# Design camera\nweb\n',
  '.agents/design/camera.md': '# Camera architecture\nmacos\n',
  '.agents/docs/notes/camera.md': '# Camera implementation\nios\n',
  '.agents/docs/recipes/camera.md': '# Camera recipe\nandroid\n',
  'recipes/old.md': '# Camera historical recipe\nweb\n',
  'docs/.hidden/ignored.md': '# Camera hidden\n',
  'docs/node_modules/ignored.md': '# Camera dependency\n',
  'outside.md': '# Camera outside corpus\n',
  'CHANGELOG.md': '# Changes\n## Octane Xplat 0.19.0 — 2026-10-01\nweb CameraView\n### Feature\nCameraView update\n## 0.20.0 2026-11-01\nios CameraView\n',
  'FIXLOG.md': '# Fixes\n## v0.18.0\nmacos CameraView\n',
  'packages/tsrx-typegen/CHANGELOG.md': '# Changes\n## 1.2.3\nwindows CameraView type fix\n',
  'packages/ui/README.md': '# UI CameraView\nweb\n',
  'packages/cli/README.md': '# CLI CameraView\nmacos\n',
 })) file(join(dir, path), content)
 file(join(dir, 'docs/malformed.md'), Buffer.from([0x23, 0x20, 0xff, 0xe1, 0x80, 0x0a, 0x77, 0x65, 0x62]))
 const cases = [{ operation: 'list', root: dir }]
 for (const query of ['CameraView', 'camera', 'CameraView CameraView', 'scene camera', '  ', 'absent', '😀'])
  for (const corpus of [undefined, 'guide', 'changelog', 'recipe'])
   for (const packageDir of [undefined, 'packages/ui', 'packages/tsrx-typegen'])
    cases.push({ operation: 'search', root: dir, query, corpus, packageDir, limit: 4 })
 for (const platform of ['web', 'ios', 'android', 'macos', 'linux', 'windows', 'unknown'])
  cases.push({ operation: 'search', root: dir, query: 'CameraView', platform })
 for (const limit of [0, 1, 2, -1, -100]) cases.push({ operation: 'search', root: dir, query: 'CameraView', limit })
 for (const path of ['docs/Guide.md', 'docs/malformed.md', 'CHANGELOG.md', 'outside.md', 'docs//Guide.md', './docs/Guide.md', '../escape.md', '/absolute.md', 'missing.md', 'docs/Guide.ts'])
  for (const [offset, limit] of [[0, 24000], [61, 1], [62, 1], [-2, 1], [1e308, 2]]) cases.push({ operation: 'read', root: dir, path, offset, limit })
 const values = compare(cases, 'retrieval')
 assert.ok(values[0].some(doc => doc.corpus === 'implementation-note'))
 assert.ok(!values[0].some(doc => doc.path.includes('/.hidden/') || doc.path.includes('/node_modules/')))
 assert.ok(values.some(value => Array.isArray(value) && value.some(hit => hit.releaseVersion === '0.19.0')))
})

test('real repository documentation inventory, chunks, queries and continuations match Node', macOnly, () => {
 const inventory = listDocs(root)
 assert.ok(inventory.length > 100)
 const cases = [{ operation: 'list', root }]
 for (const query of ['useStore', 'navigation', 'Nim', 'install', 'keyboard shortcuts'])
  cases.push({ operation: 'search', root, query, limit: 5 })
 for (const path of ['docs/packages/package-cli.md', 'packages/cli/README.md', 'CHANGELOG.md']) {
  cases.push({ operation: 'read', root, path, limit: 500 }, { operation: 'read', root, path, offset: 500, limit: 500 })
 }
 compare(cases, 'real-docs')
})

function nativeRequests(cases) {
 const run = spawnSync(binary, [], { input: cases.map(value => JSON.stringify(value)).join('\n') + '\n',
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000, env: { ...process.env, PATH: '' } })
 assert.equal(run.status, 0, run.stderr || run.error?.message)
 assert.equal(run.stderr, '')
 const replies = run.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(replies.length, cases.length)
 return replies
}
test('remote tags peel annotations and preserve absent, whitespace and malformed output policy', async () => {
 const cases = ['', '\n', 'aaa\trefs/tags/v1\n', 'aaa refs/tags/v1\nbbb refs/tags/v1^{}\n',
  'bbb refs/tags/v1^{}\naaa refs/tags/v1\n', '  aaa\u00a0refs/tags/v1  \r\n', 'aaa refs/tags/v1\nbbb refs/tags/other\n', 'aaa', 'aaa\u0085refs/tags/v1']
  .map(stdout => ({ operation: 'remote-tag', repo: 'local-fixture', tag: 'v1', stdout }))
 const expected = []
 for (const request of cases) {
  try { expected.push({ ok: true, value: await remoteTagSha({ execFile: async () => ({ stdout: request.stdout }) }, request.repo, request.tag) }) }
  catch { expected.push({ ok: false }) }
 }
 const actual = nativeRequests(cases)
 for (const [at, reply] of actual.entries()) {
  assert.equal(reply.ok, expected[at].ok, JSON.stringify(cases[at]))
  if (reply.ok) assert.deepEqual(reply.value, expected[at].value)
 }
 assert.equal(expected.filter(value => !value.ok).length, 2)
})

test('snapshot provenance preserves offline, compatible and absent-field semantics', () => {
 const cases = []
 for (const snapshot of [{ dir: 'fixture', commit: 'abc', tag: 'v1', offline: false },
  { commit: 'abc', tag: 'v1', offline: true, repo: 'local-fixture' }, { offline: 'true' }, {}])
  for (const shared of [false, true]) cases.push({ operation: 'bound-provenance', snapshot, options: { packageName: '@octane-xplat/ui', version: '1.2.3', shared } })
 const actual = nativeRequests(cases)
 for (const [at, reply] of actual.entries()) {
  assert.equal(reply.ok, true)
  assert.deepEqual(reply.value, JSON.parse(JSON.stringify(boundProvenance(cases[at].snapshot, cases[at].options))))
 }
})

test('real Git snapshots preserve pinned caches, moved/deleted tags, metadata checks and offline reads', macOnly, async () => {
 const dir = fixture()
 const repo = join(dir, 'release repo')
 mkdirSync(repo)
 const gitPath = '/usr/bin/git'
 const env = { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' }
 function git(args) {
  const result = spawnSync(gitPath, ['-C', repo, ...args], { encoding: 'utf8', env: { ...process.env, ...env } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
 }
 git(['init', '-q'])
 git(['config', 'user.name', 'Native fixture'])
 git(['config', 'user.email', 'native-fixture@example.invalid'])
 file(join(repo, 'packages/ui/package.json'), JSON.stringify({ name: '@octane-xplat/ui', version: '1.2.3' }))
 file(join(repo, 'docs/guide.md'), '# Version 1\nweb\n')
 git(['add', '.']); git(['commit', '-qm', 'initial'])
 const first = git(['rev-parse', 'HEAD'])
 git(['tag', '-a', 'v1.2.3', '-m', 'annotated release'])
 const nodeCache = join(dir, 'node cache'), nativeCache = join(dir, 'native cache')
 const base = { packageName: '@octane-xplat/ui', version: '1.2.3', repo, tag: 'v1.2.3', packageDir: 'packages/ui' }
 function cache(cacheDir) {
  if (!existsSync(join(cacheDir, 'bindings.json'))) return null
  const bindings = JSON.parse(readFileSync(join(cacheDir, 'bindings.json'), 'utf8'))
  for (const binding of Object.values(bindings)) {
   assert.match(binding.verifiedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
   delete binding.verifiedAt
  }
  return bindings
 }
 function normalize(value, path) { return JSON.parse(JSON.stringify(value).split(path).join('<cache>')) }
 async function parity(options = base, overrides = {}) {
  const context = { gitPath, env, timeoutMs: 5000, ...overrides }
  const expected = await ensureSnapshot({ ...context, cacheDir: nodeCache }, options)
  const [actual] = nativeRequests([{ operation: 'snapshot', ...context, cacheDir: nativeCache, options }])
  assert.equal(actual.ok, true, JSON.stringify(actual))
  assert.deepEqual(normalize(actual.value, nativeCache), normalize(expected, nodeCache))
  assert.deepEqual(normalize(cache(nativeCache), nativeCache), normalize(cache(nodeCache), nodeCache))
  for (const path of [nativeCache, nodeCache]) if (existsSync(path)) assert.ok(!readdirSync(path).some(name => name.startsWith('tmp-') || name.endsWith('.tmp')))
  return actual.value
 }
 assert.equal((await parity(base, { gitPath: join(dir, 'missing-git') })).reason, 'git-unavailable')
 const acquired = await parity()
 assert.equal(acquired.commit, first)
 assert.equal(readFileSync(join(acquired.dir, 'docs/guide.md'), 'utf8'), '# Version 1\nweb\n')
 assert.equal((await parity()).offline, false)
 assert.equal((await parity(base, { gitPath: join(dir, 'missing-git') })).offline, true)
 assert.equal((await parity({ ...base, repo: join(dir, 'offline repo') })).offline, true)
 assert.equal((await parity({ ...base, version: '9.9.9' })).reason, 'metadata-mismatch')
 assert.equal((await parity({ ...base, packageName: 'wrong-package' })).reason, 'metadata-mismatch')
 assert.equal((await parity({ ...base, version: '0.0.0', tag: 'missing' })).reason, 'tag-absent')
 git(['tag', '-d', 'v1.2.3'])
 const deleted = await parity()
 assert.equal(deleted.status, 'tag-conflict'); assert.equal(deleted.remote.commit, null)
 file(join(repo, 'docs/guide.md'), '# Version 2\nmacos\n')
 git(['add', '.']); git(['commit', '-qm', 'moved release'])
 const second = git(['rev-parse', 'HEAD'])
 git(['tag', 'v1.2.3'])
 const moved = await parity()
 assert.equal(moved.status, 'tag-conflict'); assert.equal(moved.cached.commit, first); assert.equal(moved.remote.commit, second)
 const accepted = await parity({ ...base, acceptMovedTag: true })
 assert.equal(accepted.commit, second)
 assert.equal(readFileSync(join(accepted.dir, 'docs/guide.md'), 'utf8'), '# Version 2\nmacos\n')
 assert.equal((await parity()).commit, second)
})

test('snapshot Git probes inherit the environment and apply explicit noninteractive overrides', macOnly, async () => {
 const dir = fixture()
 const helper = join(dir, 'git env check')
 file(helper, '#!/bin/sh\n[ "$GIT_TERMINAL_PROMPT" = "0" ] || exit 81\n[ "$GIT_ASKPASS" = "fixture-askpass" ] || exit 82\n[ "$XPLAT_NIM_GIT_FIXTURE" = "inherited" ] || exit 83\nif [ "$1" = "--version" ]; then exit 0; fi\nexit 84\n')
 chmodSync(helper, 0o755)
 const options = { packageName: '@octane-xplat/ui', version: '1.2.3', repo: 'local', tag: 'v1', packageDir: 'packages/ui' }
 const context = { gitPath: helper, env: { GIT_ASKPASS: 'fixture-askpass', XPLAT_NIM_GIT_FIXTURE: 'inherited' }, timeoutMs: 500 }
 const reference = await ensureSnapshot({ ...context, cacheDir: join(dir, 'node') }, options)
 const [actual] = nativeRequests([{ operation: 'snapshot', ...context, cacheDir: join(dir, 'native'), options }])
 assert.equal(actual.ok, true)
 assert.deepEqual(actual.value, JSON.parse(JSON.stringify(reference)))
 assert.equal(reference.reason, 'remote-unavailable', 'the environment check must pass --version before remote failure')
 const named = { ...context, gitPath: 'git env check', env: { ...context.env, PATH: dir } }
 const namedReference = await ensureSnapshot({ ...named, cacheDir: join(dir, 'node named') }, options)
 const [namedActual] = nativeRequests([{ operation: 'snapshot', ...named, cacheDir: join(dir, 'native named'), options }])
 assert.equal(namedActual.ok, true)
 assert.equal(namedReference.reason, 'remote-unavailable')
 assert.deepEqual(namedActual.value, JSON.parse(JSON.stringify(namedReference)))
})

test('a tag moved between lookup and fetch never writes a new binding', macOnly, async () => {
 const dir = fixture(), repo = join(dir, 'race repo')
 mkdirSync(repo)
 const env = { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' }
 const git = args => {
  const result = spawnSync('/usr/bin/git', ['-C', repo, ...args], { encoding: 'utf8', env: { ...process.env, ...env } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
 }
 git(['init', '-q']); git(['config', 'user.name', 'Native fixture']); git(['config', 'user.email', 'native-fixture@example.invalid'])
 file(join(repo, 'packages/ui/package.json'), JSON.stringify({ name: '@octane-xplat/ui', version: '1.2.3' }))
 file(join(repo, 'docs/guide.md'), '# Before\n')
 git(['add', '.']); git(['commit', '-qm', 'before'])
 const before = git(['rev-parse', 'HEAD'])
 file(join(repo, 'docs/guide.md'), '# After\n')
 git(['add', '.']); git(['commit', '-qm', 'after'])
 const after = git(['rev-parse', 'HEAD'])
 const helper = join(dir, 'moving git')
 file(helper, '#!/bin/sh\nif [ "$1" = "ls-remote" ]; then\n /usr/bin/git "$@"\n status=$?\n /usr/bin/git -C "$XPLAT_FIXTURE_REPO" tag -f v1.2.3 "$XPLAT_FIXTURE_MOVE_TO" >/dev/null\n exit "$status"\nfi\nexec /usr/bin/git "$@"\n')
 chmodSync(helper, 0o755)
 const options = { packageName: '@octane-xplat/ui', version: '1.2.3', repo, tag: 'v1.2.3', packageDir: 'packages/ui' }
 const context = { gitPath: helper, env: { ...env, XPLAT_FIXTURE_REPO: repo, XPLAT_FIXTURE_MOVE_TO: after }, timeoutMs: 5000 }
 git(['tag', '-f', 'v1.2.3', before])
 const reference = await ensureSnapshot({ ...context, cacheDir: join(dir, 'node') }, options)
 git(['tag', '-f', 'v1.2.3', before])
 const [actual] = nativeRequests([{ operation: 'snapshot', ...context, cacheDir: join(dir, 'native'), options }])
 assert.equal(actual.ok, true)
 assert.deepEqual(actual.value, JSON.parse(JSON.stringify(reference)))
 assert.equal(reference.status, 'tag-conflict')
 assert.equal(reference.cached.commit, null)
 assert.equal(reference.remote.commit, before)
 assert.notEqual(before, after)
 for (const cache of ['node', 'native']) assert.equal(existsSync(join(dir, cache, 'bindings.json')), false)
})
