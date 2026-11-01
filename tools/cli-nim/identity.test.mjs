import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, utimesSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import * as scope from '../../packages/cli/src/mcp/code-scope.ts'
import * as binding from '../../packages/cli/src/mcp/docs-binding.ts'
import { releaseMapping } from '../../packages/cli/src/mcp/release-map.ts'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/identity-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
function fixture() {
 const dir = mkdtempSync(join(tmpdir(), 'xplat-native-identity-'))
 fixtures.push(dir)
 return dir
}
after(() => { for (const dir of fixtures) rmSync(dir, { recursive: true, force: true }) })
function file(path, contents = 'export const value = 1\n') {
 mkdirSync(resolve(path, '..'), { recursive: true })
 writeFileSync(path, contents)
}
function json(path, value) { file(path, JSON.stringify(value)) }
function pkg(dir, name, version = '0.20.0') {
 json(join(dir, 'package.json'), { name, version })
 file(join(dir, 'src/index.ts'))
}
function expected(r) {
 try {
  let value
  switch (r.operation) {
   case 'hash': value = createHash('sha256').update(r.text).digest('hex'); break
   case 'number': value = String(r.value); break
   case 'mapping': value = releaseMapping(r.name, r.version, r.repo); break
   case 'installations': value = binding.resolveInstallations(r.root); break
   case 'development-docs': value = binding.developmentDocsDir(r.path); break
   case 'excluded': value = scope.exclusionReason(r.path); break
   case 'platforms': value = scope.filePlatforms(r.path); break
   case 'applies': value = scope.appliesToPlatform(r.path, r.platform); break
   case 'files': value = scope.listCorpusFiles(r.root, { platform: r.platform, limit: r.limit }); break
   case 'framework-roots': value = scope.frameworkRoots(r.root); break
   case 'repo-roots': value = scope.frameworkRepoRoots(r.root); break
   case 'corpora': value = scope.collectCorpora({ workspaceRoot: r.root, workspaceKind: r.kind, app: r.app }); break
   case 'reference': value = scope.codeRef(r.corpus, r.key); break
   case 'parse-reference': value = scope.parseCodeRef(r.reference); break
   case 'resolve': value = scope.resolveCodePath(r); break
   case 'key': value = scope.codeKeyFor(r.corpus, r.file); break
   default: throw Error('Unknown operation')
  }
  return JSON.parse(JSON.stringify({ ok: true, value: value ?? null }))
 } catch (error) { return { ok: false, message: error.message } }
}
function compare(requests) {
 const reference = requests.map(expected)
 const child = spawnSync(binary, [], {
  encoding: 'utf8', input: requests.map(r => JSON.stringify(r)).join('\n') + '\n',
  maxBuffer: 32 * 1024 * 1024, timeout: 20000, env: { ...process.env, PATH: '' },
 })
 assert.equal(child.status, 0, child.stderr)
 const actual = child.stdout.trim().split('\n').map(JSON.parse)
 assert.equal(actual.length, requests.length)
 const mismatches = []
 for (let i = 0; i < requests.length; i++) {
  try {
   assert.equal(actual[i].ok, reference[i].ok)
   if (reference[i].ok) assert.deepEqual(actual[i].value, reference[i].value)
  } catch { mismatches.push({ request: requests[i], expected: reference[i], actual: actual[i] }) }
 }
 if (mismatches.length) writeFileSync(join(root, 'research/nim-cli/mismatches-identity.json'), JSON.stringify(mismatches, null, 2))
 console.log(`${requests.length} identity/corpus differential cases checked`)
 assert.deepEqual(mismatches, [])
}

test('SHA-256 and release mappings match Node, including byte boundaries and Unicode', () => {
 const requests = ['', 'abc', 'café 😀', 'a\0b', ...[55, 56, 63, 64, 65, 127, 128, 129, 8193].map(n => 'a'.repeat(n))]
  .map(text => ({ operation: 'hash', text }))
 for (const name of ['tsrx-typegen', 'create-octane-xplat', '@octane-xplat/ui', '@octane-xplat/', '@other/lib', 'unknown']) {
  for (const repo of [undefined, null, 'https://example.invalid/repo']) requests.push({ operation: 'mapping', name, version: '1.2.3-beta.1', repo })
 }
 compare(requests)
})

test('number-to-string preserves shortest digits and JavaScript exponent thresholds', () => {
 const values = [0, -0, Number.MIN_VALUE, Number.MAX_VALUE, Number.EPSILON, 1e-7, 1e-6, 1e20, 1e21, 1.0000000000000001e20, 1.2345678901234567, Number.MAX_SAFE_INTEGER, -1e-7]
 const buffer = Buffer.alloc(8)
 let state = 0x12345678
 function word() { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0 }
 for (let i = 0; i < 512; i++) {
  buffer.writeUInt32LE(word(), 0); buffer.writeUInt32LE(word(), 4)
  const value = buffer.readDoubleLE()
  if (Number.isFinite(value)) values.push(value)
 }
 compare(values.map(value => ({ operation: 'number', value })))
})

test('installed docs identities preserve links, lock conflicts, peers, hoisting and provisional versions', () => {
 const requests = []
 for (const spec of [undefined, '^0.20.0', 'workspace:*', 'link:../ui', 'portal:../ui', 'file:./checkout', 'file:./archive.tgz', 'file:./missing', 'file:./missing.TAR.GZ', 'file:./ordinary-file', 'file:./missing\n']) {
  const dir = fixture(), app = join(dir, 'apps/demo')
  json(join(dir, 'package.json'), { workspaces: ['apps/*'] })
  json(join(app, 'package.json'), { dependencies: spec ? { '@octane-xplat/ui': spec } : {}, peerDependencies: { '@octane-xplat/peer': 'workspace:*' } })
  mkdirSync(join(app, 'checkout'), { recursive: true })
  file(join(app, 'archive.tgz'), 'test fixture')
  file(join(app, 'ordinary-file'), 'test fixture')
  pkg(join(dir, 'node_modules/@octane-xplat/ui'), '@octane-xplat/ui')
  pkg(join(dir, 'node_modules/@octane-xplat/undeclared'), '@octane-xplat/undeclared', '0.21.0')
  pkg(join(dir, 'node_modules/@octane-xplat/.hidden'), '@octane-xplat/.hidden')
  pkg(join(dir, 'node_modules/tsrx-typegen'), 'tsrx-typegen', '0.5.5')
  file(join(app, 'pnpm-lock.yaml'), `importers:\n  '.':\n    dependencies:\n      '@octane-xplat/ui': { version: '0.19.0(peer@1.0.0)' }\n      '@octane-xplat/peer': { version: '0.22.0' }\n      '@other/lib': '1.0.0'\n`)
  requests.push({ operation: 'installations', root: app }, { operation: 'framework-roots', root: app })
 }
 for (const lock of [
  "importers: {'.': {dependencies: {'@octane-xplat/ui': '0.20.0(peer@1)'}}}",
  "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: null, specifier: '0.20.0'}}}}",
  "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: 1.0}}}}",
  "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: 0}}}}",
  "importers: {'.': {dependencies: {'@octane-xplat/ui': {version: 'workspace:packages/ui'}}}}",
  "key: &name '@octane-xplat/ui'\nimporters: {'.': {dependencies: {*name : {version: '0.20.0'}}}}",
  'importers: {}\n---\nimporters: {}', 'importers: [',
 ]) {
  const dir = fixture()
  json(join(dir, 'package.json'), { dependencies: { '@octane-xplat/ui': '^0.20.0' } })
  file(join(dir, 'pnpm-lock.yaml'), lock)
  requests.push({ operation: 'installations', root: dir })
 }
 const dir = fixture(), app = join(dir, 'apps/demo')
 json(join(dir, 'package.json'), { packageManager: 'bun@1.4.4', workspaces: ['apps/*'] })
 json(join(app, 'package.json'), { name: 'demo', dependencies: { '@octane-xplat/ui': '^0.20.0' } })
 json(join(dir, 'bun.lock'), { workspaces: { 'apps/demo': { name: 'demo' } }, packages: { 'demo/@octane-xplat/ui': ['@octane-xplat/ui@0.21.0'] } })
 requests.push({ operation: 'installations', root: app })
 compare(requests)
 // Canonicalized package roots and malformed near manifests must follow Node resolution.
 const checkout = join(dir, 'checkout')
 pkg(checkout, '@octane-xplat/ui')
 mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
 symlinkSync(checkout, join(dir, 'node_modules/@octane-xplat/ui'), process.platform === 'win32' ? 'junction' : 'dir')
 compare([{ operation: 'installations', root: app }, { operation: 'framework-roots', root: app }])
 file(join(app, 'node_modules/@octane-xplat/ui/package.json'), '{')
 compare([{ operation: 'installations', root: app }])
 const scalarRequests = []
 for (const version of [true, 1, 1e21, 1e-7, 0.000001, 1.2345678901234567, 1.0000000000000001e20, [1, 2], { major: 1 }, null, '']) {
  const dir = fixture()
  json(join(dir, 'package.json'), {})
  pkg(join(dir, 'node_modules/@octane-xplat/ui'), '@octane-xplat/ui', version)
  scalarRequests.push({ operation: 'installations', root: dir })
 }
 compare(scalarRequests)
})

test('empty consumers never inherit the CLI cwd packages or documentation', () => {
 const dir = fixture()
 json(join(dir, 'package.json'), {})
 assert.deepEqual(binding.resolveInstallations(dir).packages, [])
 assert.equal(binding.developmentDocsDir(dir), null)
 compare([{ operation: 'installations', root: dir }, { operation: 'framework-roots', root: dir }, { operation: 'development-docs', path: dir }])
})

test('JSON manifest numbers round like JavaScript before identity hashing', () => {
 const requests = []
 for (const raw of ['9007199254740993', '-9007199254740993', '100000000000000016384', '9223372036854775807', '1.234567890123456789', '1e-10000']) {
  const dir = fixture()
  json(join(dir, 'package.json'), {})
  file(join(dir, 'node_modules/@octane-xplat/ui/package.json'), `{"name":"@octane-xplat/ui","version":${raw}}`)
  requests.push({ operation: 'installations', root: dir })
 }
 compare(requests)
})

test('development docs stop at the first marker, follow canonical roots and bound ancestry', () => {
 const requests = []
 for (const marker of ['.git', 'bun.lock', 'pnpm-workspace.yaml']) {
  for (const nearerMarker of [false, true]) {
   const dir = fixture(), pkgRoot = join(dir, 'packages/ui')
   pkg(pkgRoot, '@octane-xplat/ui')
   file(join(dir, marker), '')
   mkdirSync(join(dir, 'docs'))
   // A nearer marker without docs prevents a search into another workspace.
   if (nearerMarker) file(join(dir, 'packages', marker), '')
   requests.push({ operation: 'development-docs', path: pkgRoot })
  }
 }
 for (const depth of [6, 7, 8, 9]) {
  const dir = fixture(), nested = join(dir, ...Array(depth).fill('nested'))
  mkdirSync(nested, { recursive: true }); mkdirSync(join(dir, 'docs')); file(join(dir, '.git'), '')
  requests.push({ operation: 'development-docs', path: nested })
 }
 const dir = fixture(), target = join(dir, 'repo/packages/ui'), alias = join(dir, 'alias')
 mkdirSync(target, { recursive: true }); mkdirSync(join(dir, 'repo/docs')); file(join(dir, 'repo/bun.lock'), '{}')
 symlinkSync(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
 requests.push({ operation: 'development-docs', path: alias }, { operation: 'development-docs', path: join(dir, 'missing') })
 compare(requests)
})

test('code exclusions, platform tiers and reference syntax preserve exact source rules', () => {
 const requests = []
 const paths = ['index.ts', 'src/index.ts', 'src/ios/Button.mobile.tsrx', 'native/web/thing.android.ts', 'src/a.NATIVE.ts', '.hidden.ts', '.env', 'credentials.json', 'keys/cert.PEM', 'private/main.ts', 'src/.hidden/main.ts', 'node_modules/a.ts', 'research/a.ts', 'generated/a.ts', 'file.gen.js', 'file.GEN.js', 'source.js.map', 'prefix-bun.lock-thing.ts', 'pnpm-lock.ts', 'thing.nim', 'thing.TS', 'no-extension', 'web.ts', 'src/name.web\n.ts', 'x.mobile.css', 'macos/native/a.ts', 'src/😀.ts', '', 'directory/']
 for (const path of paths) {
  requests.push({ operation: 'excluded', path }, { operation: 'platforms', path })
  for (const platform of ['', 'web', 'ios', 'android', 'macos', 'windows', 'linux', 'unknown']) requests.push({ operation: 'applies', path, platform })
 }
 for (const corpus of ['app', 'framework', 'unknown']) {
  for (const key of ['', 'src/index.ts', '@octane-xplat/ui/Button.ts', 'a b/😀.ts', '../file.ts', 'a\nb', 'a\rb', 'a\u2028b', 'a\u2029b', 'a\n', 'a\r\n', 'a\r', 'a\u2028', 'a\u2029']) {
   requests.push({ operation: 'reference', corpus, key }, { operation: 'parse-reference', reference: scope.codeRef(corpus, key) })
  }
 }
 for (const reference of ['', 'XPLAT-code://app/a', 'xplat-code://app/', 'xplat-code://framework//', 'xplat-code://app/a?b#c']) requests.push({ operation: 'parse-reference', reference })
 compare(requests)
})

test('code enumeration preserves file size, binary, mtime, platform and truncation boundaries', () => {
 const dir = fixture()
 for (const path of ['z.ts', 'src/a.ts', 'src/b.web.ts', 'src/c.native.ts', 'src/😀.tsx', 'a.gen.ts', 'dist/index.ts', 'private/hidden.ts', '.hidden/a.ts', 'config.json']) file(join(dir, path))
 for (const size of [0, 1, 8192, 8193, scope.MAX_FILE_BYTES, scope.MAX_FILE_BYTES + 1]) {
  file(join(dir, `size-${size}.ts`), 'a'.repeat(size))
  file(join(dir, `nul-${size}.ts`), size ? 'a'.repeat(size - 1) + '\0' : '')
 }
 utimesSync(join(dir, 'z.ts'), 1700000000.123456, 1700000000.123456)
 symlinkSync(join(dir, 'z.ts'), join(dir, 'alias.ts'))
 symlinkSync(join(dir, 'src'), join(dir, 'linked-src'), process.platform === 'win32' ? 'junction' : 'dir')
 const requests = []
 for (const platform of [undefined, 'web', 'ios', 'macos']) for (const limit of [undefined, 0, 1, 2, 5, 100]) requests.push({ operation: 'files', root: dir, platform, limit })
 requests.push({ operation: 'files', root: join(dir, 'absent') })
 compare(requests)
})

test('direct code reads enforce both alias and canonical target scope and privacy', () => {
 const dir = fixture(), app = join(dir, 'apps/demo'), framework = join(dir, 'packages/ui'), outside = join(dir, 'other')
 for (const path of [join(app, 'src/index.ts'), join(app, 'private/secret.ts'), join(app, 'generated/a.ts'), join(outside, 'index.ts'), join(framework, 'src/Button.ts'), join(framework, 'private/secret.ts')]) file(path)
 symlinkSync(join(app, 'src/index.ts'), join(app, 'allowed.ts'))
 symlinkSync(join(app, 'private/secret.ts'), join(app, 'private-alias.ts'))
 symlinkSync(join(outside, 'index.ts'), join(app, 'outside.ts'))
 symlinkSync(join(app, 'src/index.ts'), join(app, 'private/allowed-target.ts'))
 symlinkSync(join(framework, 'private/secret.ts'), join(framework, 'src/private-alias.ts'))
 const alias = join(dir, 'aliased-app')
 symlinkSync(app, alias, process.platform === 'win32' ? 'junction' : 'dir')
 const corpora = [{ corpus: 'app', package: null, root: app, base: dir }, { corpus: 'framework', package: '@octane-xplat/ui', root: join(framework, 'src'), packageRoot: framework }]
 const requests = []
 for (const key of ['', '../other/index.ts', '/etc/fixture', 'other/index.ts', 'apps/demo/src/index.ts', 'apps/demo/./src/index.ts', 'apps/demo/src/missing.ts', 'apps/demo/allowed.ts', 'apps/demo/private-alias.ts', 'apps/demo/outside.ts', 'apps/demo/private/allowed-target.ts', 'apps/demo/generated/a.ts', 'apps/demo/src/../src/index.ts', 'apps/demo/src']) requests.push({ operation: 'resolve', corpora, corpus: 'app', key })
 for (const key of ['@octane-xplat/ui/Button.ts', '@octane-xplat/ui/private-alias.ts', '@octane-xplat/ui/../private/secret.ts', '@octane-xplat/ui/src/Button.ts', '@unknown/ui/Button.ts']) requests.push({ operation: 'resolve', corpora, corpus: 'framework', key })
 requests.push({ operation: 'resolve', corpora: [{ corpus: 'app', root: alias }], corpus: 'app', key: 'src/index.ts' }, { operation: 'resolve', corpora: [], corpus: 'app', key: 'a.ts' })
 for (const corpus of corpora) for (const name of ['src/index.ts', 'Button.ts']) requests.push({ operation: 'key', corpus, file: { abs: join(corpus.root, name), rel: name } })
 compare(requests)
})

test('corpora retain app labels, package identities and source roots without duplicate entries', () => {
 const dir = fixture(), app = join(dir, 'apps/demo')
 json(join(app, 'package.json'), { dependencies: { '@octane-xplat/ui': 'workspace:*' } })
 pkg(join(dir, 'node_modules/@octane-xplat/ui'), '@octane-xplat/ui')
 pkg(join(dir, 'packages/ui'), '@octane-xplat/ui')
 pkg(join(dir, 'packages/unknown'), undefined)
 pkg(join(dir, 'packages/.hidden'), '@octane-xplat/hidden')
 file(join(dir, 'packages/broken/package.json'), '{'); file(join(dir, 'packages/broken/src/one.ts'))
 json(join(dir, 'packages/no-source/package.json'), { name: 'no-source' })
 const requests = [{ operation: 'repo-roots', root: dir }, { operation: 'repo-roots', root: join(dir, 'missing') }]
 for (const kind of ['consumer', 'framework-repo']) for (const relativeRoot of [undefined, null, '.', 'apps/demo']) requests.push({ operation: 'corpora', root: dir, kind, app: { root: app, relativeRoot } })
 requests.push({ operation: 'corpora', root: dir, kind: 'framework-repo', app: null }, { operation: 'corpora', root: dir, kind: 'consumer' })
 compare(requests)
})

test('real repository installations and bounded source enumeration match the TypeScript reference', () => {
 compare([
  { operation: 'installations', root },
  { operation: 'installations', root: join(root, 'apps/web') },
  { operation: 'framework-roots', root: join(root, 'apps/web') },
  { operation: 'repo-roots', root },
  { operation: 'files', root: join(root, 'packages/cli/src'), limit: 20 },
 ])
})
