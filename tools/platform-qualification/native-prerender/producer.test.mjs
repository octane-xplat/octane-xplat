import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { compileLaunchConstraints } from './producer/launch-constraints.mjs'

test('AOT launch guards retain every dimension-sensitive query and omit unread viewport inputs', () => {
  const environment = { width: 402, height: 874, reducedMotion: false }
  const plain = compileLaunchConstraints(['(prefers-color-scheme: dark)'], environment)
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
  ]) {
    const compiled = compileLaunchConstraints([query], environment)
    assert.deepEqual(compiled.dimensionQueries, [query])
    assert.deepEqual(compiled.constraints.slice(2), [
      { input: 'width', min: 402, max: 402 },
      { input: 'height', min: 874, max: 874 },
    ])
  }
})

test('fixed Home build host rejects native capabilities and captures deferred registration', async () => {
  const api = await import('./producer/native-api.mjs')
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
  const module = new URL('./producer/native-api.mjs', import.meta.url).href
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
