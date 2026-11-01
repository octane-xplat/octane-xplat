import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { chunkMarkdown } from '../../packages/docs-search/src/chunks.ts'
import { listDocs, searchDocs, readPage, platformsOf, docRef, parseDocRef } from '../../packages/cli/src/mcp/docs-retrieval.ts'

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
