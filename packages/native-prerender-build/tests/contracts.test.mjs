import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { parseProducerConfig } from '../src/config.mjs'
import { checkIfMediaQueryMatches, setCssMediaQueryEvaluator } from '../src/mobile-media-query.mjs'

import { compileLaunchConstraints } from '../src/launch-constraints.mjs'

test('mobile AOT rejects media inputs that differ from the live NativeScript resolver', () => {
  const environment = { width: 402, height: 874, reducedMotion: false }
  const plain = compileLaunchConstraints(
    ['(prefers-color-scheme: dark)', 'screen and (prefers-color-scheme: light)'],
    environment,
  )

  assert.deepEqual(
    plain.constraints.map((row) => row.input),
    ['fontScale', 'reducedMotion'],
  )

  for (const query of [
    '(min-width: 800px)',
    '(height >= 500px)',
    '(orientation: landscape)',
    'not (max-device-width: 600px)',
    '(WIDTH: 402px)',
    '(prefers-reduced-motion: reduce)',
    '(min-resolution: 2dppx)',
    '(unknown-feature: yes)',
  ]) {
    assert.throws(() => compileLaunchConstraints([query], environment), /not aligned with live CSS/)
  }
})

test('mobile selector evaluation does not inherit AppKit hover support', () => {
  setCssMediaQueryEvaluator(() => true)
  assert.equal(checkIfMediaQueryMatches('(hover: hover)'), false)
  assert.equal(checkIfMediaQueryMatches('(prefers-color-scheme: dark)'), true)
  assert.doesNotThrow(() => compileLaunchConstraints(['(hover: hover)'], { reducedMotion: false }))
  assert.throws(
    () => compileLaunchConstraints(['not (prefers-color-scheme: dark)'], { reducedMotion: false }),
    /not aligned/,
  )

  assert.throws(
    () =>
      compileLaunchConstraints(['(hover: hover), (prefers-color-scheme: dark)'], {
        reducedMotion: false,
      }),
    /not aligned/,
  )

  setCssMediaQueryEvaluator(undefined)
})

test('fixed Home build host rejects native capabilities and captures deferred registration', async () => {
  const api = await import('../src/native-api.mjs')

  assert.throws(() => api.Application.ios, /environment read during module setup/)
  assert.throws(() => new api.View(), /unsupported native allocation/)
  assert.throws(() => new api.SVGView(), /unsupported native allocation/)
  assert.throws(() => api.Utils.openUrl, /unsupported native read/)
  assert.throws(() => api.Color(), /unsupported native call/)

  let factoryCalled = false

  api.registerElement('svgview', () => {
    factoryCalled = true
    return api.SVGView
  })

  assert.equal(factoryCalled, false)
  assert.throws(() => api.registerElement('svgview', () => api.SVGView), /duplicate registration/)
  assert.throws(() => api.registerElement('unknown', () => api.View), /unsupported/)
  assert.throws(() => api.configureNativeBuildHost('system'), /invalid/)
  api.configureNativeBuildHost('dark')
  assert.equal(api.isIOS, true)
  assert.equal(api.isAndroid, false)
  assert.equal(api.Application.systemAppearance(), 'dark')
  assert.equal(Boolean(api.Application.ios), true)
  assert.equal(api.Application.android, undefined)
  assert.equal(api.Application.primaryWindow, undefined)
  assert.throws(() => api.Application.ios.nativeApp, /unsupported native read/)
  assert.throws(() => api.Application.on, /unsupported application read/)
  assert.throws(() => {
    api.Application.primaryWindow = {}
  }, /native state writes/)

  assert.throws(() => {
    api.Utils.openUrl = () => {}
  }, /native state writes/)

  assert.throws(
    () => Object.defineProperty(api.View, 'native', { value: true }),
    /native state writes/,
  )

  assert.throws(() => api.configureNativeBuildHost('light'), /repeated/)
  assert.deepEqual(api.nativeBuildHostEvidence().registrations, ['svgview'])
})

test('Android build facts select Android without exposing native service objects', () => {
  const module = new URL('../src/native-api.mjs', import.meta.url).href
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import assert from 'node:assert/strict';
    globalThis.XPLAT_HOME_PLATFORM = 'android';
    const api = await import(${JSON.stringify(module)});
    assert.equal(api.isIOS, false);
    assert.equal(api.isAndroid, true);
    api.configureNativeBuildHost('light');
    assert.equal(api.Application.ios, undefined);
    assert.equal(Boolean(api.Application.android), true);
    assert.throws(() => api.Application.android.foregroundActivity, /unsupported native read/);
    assert.equal(api.nativeBuildHostEvidence().platform, 'android');
  `,
    ],
    { encoding: 'utf8' },
  )

  assert.equal(result.status, 0, result.stderr)
})

test('producer configuration resolves its entry and retains explicit seed and launch inputs', () => {
  const value = {
    version: 1,
    entry: './screen.tsrx',
    exportName: 'Startup',
    seed: { title: 'Launch', count: 0 },
    environment: { width: 320, height: 640, reducedMotion: true },
  }

  const config = parseProducerConfig(JSON.stringify(value), '/app/startup.json')

  assert.equal(config.entry, '/app/screen.tsrx')
  assert.deepEqual(config.seed, value.seed)
  assert.deepEqual(config.environment, value.environment)
  for (const replacement of [
    null,
    [],
    { ...value, typo: true },
    { ...value, version: 2 },
    { ...value, entry: '' },
    { ...value, exportName: 'x;sideEffect()' },
    { ...value, seed: [] },
    { ...value, environment: { ...value.environment, width: 0 } },
    { ...value, environment: { ...value.environment, reducedMotion: 'false' } },
  ]) {
    assert.throws(() => parseProducerConfig(JSON.stringify(replacement), '/app/startup.json'))
  }

  assert.throws(() => parseProducerConfig(' '.repeat(1024 * 1024 + 1), '/app/startup.json'), /1MiB/)
})
