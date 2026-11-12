// Copied into the isolated packed consumer: every package import resolves there.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, build } from 'vite'
import * as plugins from '@octane-xplat/build/vite'
import { macos } from '@octane-xplat/build/macos/vite'
import { linuxGtk } from '@octane-xplat/build/linux-gtk/vite'

assert.equal(typeof macos, 'function')
assert.equal(typeof linuxGtk, 'function')

const legacyMacOS = await import('@octane-xplat/build/macos/vite')
const legacyGtk = await import('@octane-xplat/build/linux-gtk/vite')

assert.equal(macos, legacyMacOS.xplatMacOS)
assert.equal(linuxGtk, legacyGtk.xplatLinuxGtk)
for (const [current, legacy] of Object.entries({
  css: 'xplatCss',
  boundary: 'xplatBoundary',
  tsrx: 'xplatTsrx',
  devBridge: 'xplatDevBridge',
  native: 'xplatNative',
  nodeEnvDefine: 'xplatNodeEnvDefine',
})) {
  assert.equal(typeof plugins[current], 'function')
  assert.equal(plugins[current], plugins[legacy], `${legacy} must preserve function identity`)
}

try {
  await import('@octane-xplat/cli/vite')
  assert.fail('Unexpected CLI installation in plugin-only fixture')
} catch (error) {
  assert.equal(error.code, 'ERR_MODULE_NOT_FOUND')
}

const root = process.cwd(),
  cache = join(root, 'node_modules/.cache/xplat/dev-bridge')

const result = {
  exports: Object.keys(plugins).sort(),
  nativeExtensions: plugins.nativeExtensions,
  nodeEnv: ['development', 'production', 'test'].map((mode) => plugins.nodeEnvDefine(mode)),
}

// Test the shipped helper as an internal implementation probe, without adding
// another public export. This reaches Babel's real transitive dependency graph.
const { nativeUnicodeRegex } = await import(
  new URL('./native-regex.js', import.meta.resolve('@octane-xplat/build/vite'))
)

const regexSources = [
  String.raw`const regex = /\p{L}+/u`,
  String.raw`const regex = /\P{L}/u`,
  String.raw`const regex = /[\p{L}_]+/v`,
  String.raw`const regex = new RegExp("\\p{L}+", "u")`,
]

result.nativeRegexMatches = []
for (const source of regexSources) {
  const transformed = await nativeUnicodeRegex().transform.call(
    { warn() {} },
    source,
    '/fixture/dependency.mjs?used',
  )

  assert.ok(transformed?.map)
  assert.ok(!transformed.code.includes('\\p{') && !transformed.code.includes('\\P{'))

  const actual = Function(transformed.code + '; return regex')(),
    expected = Function(source + '; return regex')()

  const matches = []

  for (const sample of ['héllo_', '日本', '123', '😀', 'a-b']) {
    const observed = actual.exec(sample),
      reference = expected.exec(sample)

    assert.deepEqual(observed, reference)
    matches.push(observed ? { value: observed[0], index: observed.index } : null)
  }

  result.nativeRegexMatches.push(matches)
}

const built = await build({ root, logLevel: 'silent', build: { write: false } })
const output = (Array.isArray(built) ? built : [built]).flatMap((bundle) => bundle.output)
const css = output
  .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
  .map((file) => String(file.source))
  .join('\n')

assert.ok(css.includes('.packed-web'), css)
assert.ok(!css.includes('must-not-ship'), css)
assert.ok(!css.includes('@platform'), css)
assert.ok(css.includes('--packed-existing:preserved'), css)
assert.ok(!css.includes('unprocessed'), css)
assert.ok(!css.includes('fallback-must-not-ship'), css)
result.productionCssFiltered = true
result.appPostcssPreserved = true

const server = await createServer({ root, logLevel: 'silent' })

try {
  await server.listen()

  const sessionFile = readdirSync(cache).find((file) => file.endsWith('.json'))

  assert.ok(sessionFile)

  const endpoint = JSON.parse(readFileSync(join(cache, sessionFile)))
  const mainResponse = await fetch(endpoint.url + '/src/main.js')

  assert.equal(mainResponse.status, 200)
  assert.ok((await mainResponse.text()).includes('/src/theme.web.css'))
  result.platformSiblingSelected = true

  const cssResponse = await fetch(endpoint.url + '/src/theme.web.css')

  assert.equal(cssResponse.status, 200)

  const source = await cssResponse.text()

  assert.ok(source.includes('.packed-web'))
  assert.ok(!source.includes('must-not-ship'))
  assert.ok(source.includes('preserved'))
  assert.ok(!source.includes('unprocessed'))
  result.devCssFiltered = true

  const unauthorized = await fetch(endpoint.url + '/__xplat_dev__/registry')

  assert.equal(unauthorized.status, 401)

  const headers = { 'content-type': 'application/json', 'x-xplat-dev-token': endpoint.token }
  const post = async (path, body) => {
    const response = await fetch(endpoint.url + '/__xplat_dev__' + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    assert.equal(response.status, 200)
    return response.json()
  }

  const announcement = {
    protocol: 'xplat-dev-actions',
    version: 1,
    appInstanceId: 'packed-instance',
    platform: 'web',
    revision: 1,
    announcedAt: new Date().toISOString(),
    actions: [{ id: 'fixture.echo', description: 'Packed transport fixture', effects: [] }],
  }

  await post('/registry', announcement)
} finally {
  await server.close()
}

result.sessionRemoved =
  !existsSync(cache) || readdirSync(cache).filter((file) => file.endsWith('.json')).length === 0

assert.equal(result.sessionRemoved, true)
// Exercise the packed build plugin's failure path after releasing the server.
writeFileSync(join(root, 'src/foreign.mobile.js'), 'export const foreign = true\n')
writeFileSync(join(root, 'src/main.js'), "import './foreign.mobile.js'\n")
await assert.rejects(build({ root, logLevel: 'silent', build: { write: false } }), (error) => {
  assert.match(error.message, /platform|foreign|mobile/i)
  return true
})

result.foreignModuleRejected = true
console.log(JSON.stringify(result))
