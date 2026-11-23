import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

// Source execution with a fake navigator/Intl module graph. No browser,
// prerender, or installed resolution is proved.
const files = ['locale.web.ts', 'device.web.ts']
const compiled = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      ts.transpileModule(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText,
    ]),
  ),
)

const plain = (value) => JSON.parse(JSON.stringify(value))
function load(navigator) {
  const context = vm.createContext(navigator === undefined ? { Intl } : { Intl, navigator }),
    cache = {}

  function require(name) {
    const file = files.find((file) => './' + file.slice(0, -3) === name)

    if (!file) {
      if (name.startsWith('./') || name === '@octane-xplat/lib/capability') {
        return {}
      }

      throw new Error('Unexpected metadata import')
    }

    if (!cache[file]) {
      const exports = (cache[file] = {})

      vm.runInContext(`(function(exports, require) {${compiled[file]}\n})`, context)(
        exports,
        require,
      )
    }

    return cache[file]
  }

  return { require, context }
}

test('web metadata separates script/region and retains canonical full locale tags', () => {
  for (const [tag, expected] of [
    ['zh-Hant-TW', { tag: 'zh-Hant-TW', language: 'zh', region: 'TW' }],
    ['sr-Latn-RS', { tag: 'sr-Latn-RS', language: 'sr', region: 'RS' }],
    ['es-419', { tag: 'es-419', language: 'es', region: '419' }],
    ['en-US-u-ca-gregory', { tag: 'en-US-u-ca-gregory', language: 'en', region: 'US' }],
    ['fr', { tag: 'fr', language: 'fr', region: '' }],
    ['zh-Hant', { tag: 'zh-Hant', language: 'zh', region: '' }],
  ]) {
    assert.deepEqual(plain(load({ language: tag }).require('./locale.web').locale), expected)
  }
})

test('web metadata has a valid documented fallback without a usable navigator tag', () => {
  assert.deepEqual(plain(load(undefined).require('./locale.web').locale), {
    tag: 'en',
    language: 'en',
    region: '',
  })

  for (const language of [undefined, null, '', 'not_a_valid_locale_!']) {
    assert.deepEqual(plain(load({ language }).require('./locale.web').locale), {
      tag: 'en',
      language: 'en',
      region: '',
    })
  }
})

test('web device metadata shares the locale snapshot and parses the OS version', () => {
  const root = load({
    language: 'zh-Hant-TW',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  })

  assert.equal(root.require('./device.web').device.language, 'zh')
  assert.equal(root.require('./device.web').device.region, 'TW')
  assert.equal(root.require('./device.web').device.osVersion, '10.15.7')
  assert.deepEqual(plain(root.require('./device.web').device), {
    os: 'web',
    osVersion: '10.15.7',
    model: 'browser',
    manufacturer: '',
    language: 'zh',
    region: 'TW',
  })
})
