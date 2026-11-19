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

  // Platform identity is fixed at produce and readable during module setup —
  // motion's clock picks its time source this way — while every other
  // environment member still rejects until configured.
  assert.equal(api.Application.ios, true)
  assert.equal(api.Application.android, false)
  assert.throws(() => api.Application.on, /environment read during module setup/)
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
  assert.equal(api.Application.ios, true)
  assert.equal(api.Application.android, false)
  assert.equal(api.Application.primaryWindow, undefined)
  assert.throws(() => api.Application.iosNativeApp, /unsupported application read/)
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
    assert.equal(api.Application.ios, false);
    assert.equal(api.Application.android, true);
    assert.throws(() => api.Application.foregroundActivity, /unsupported application read/);
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

test('producer launch inputs validate bounded persisted-string declarations', () => {
  const base = {
    version: 1,
    entry: './screen.tsrx',
    exportName: 'Startup',
    seed: {},
    environment: { width: 320, height: 640, reducedMotion: false },
  }
  const input = {
    name: 'theme-preference',
    source: 'appSettings.string',
    values: ['dark', 'light'],
    default: null,
  }
  const parse = (extra) => parseProducerConfig(JSON.stringify({ ...base, ...extra }), '/app/startup.json')

  assert.deepEqual(parse({ launchInputs: [input] }).launchInputs, [input])
  assert.equal(parse({}).launchInputs, undefined)
  // A non-null default still adds its declared value point, not a null tree.
  assert.deepEqual(parse({ launchInputs: [{ ...input, default: 'light' }] }).launchInputs[0].default, 'light')
  // Two inputs of 1+null and 1 declared value give the 2x2 product bound.
  assert.equal(
    parse({
      launchInputs: [
        input,
        { ...input, name: 'density', values: ['compact'], default: 'compact' },
      ],
    }).launchInputs.length,
    2,
  )

  for (const launchInputs of [
    [],
    'dark',
    [{ ...input, source: 'userDefaults.string' }],
    [{ ...input, values: ['a', 'b', 'c', 'd', 'e'] }],
    [{ ...input, values: ['a', 'a'] }],
    [{ ...input, values: [] }],
    [{ ...input, values: [1] }],
    [{ ...input, default: 'sepia' }],
    [{ ...input, default: undefined }],
    [{ ...input, name: 'has\nnewline' }],
    [{ ...input, name: 'x'.repeat(129) }],
    [{ ...input, name: 'systemAppearance' }],
    [{ name: 'theme-preference' }],
    [input, input],
    [input, { ...input, name: 'other' }].concat(
      Array.from({ length: 7 }, (_, index) => ({ ...input, name: 'n' + index, default: 'dark' })),
    ),
    // 3x3 product: each input contributes two values plus the null point.
    [input, { ...input, name: 'second' }],
    // Three inputs (3x3x2) exceed the product bound as well.
    [input, { ...input, name: 'a' }, { ...input, name: 'b', values: ['x'] }],
    // 3x2 product also exceeds the four-declared-bind bound (each point is
    // still crossed with light/dark systemAppearance).
    [input, { ...input, name: 'a', values: ['x'] }],
  ]) {
    assert.throws(
      () => parse({ launchInputs }),
      undefined,
      'Accepted ' + JSON.stringify(launchInputs),
    )
  }
  // Four declared bind points (2x2) remain legal: eight scheme trees total.
  assert.equal(
    parse({
      launchInputs: [
        { ...input, name: 'a', values: ['x'] },
        { ...input, name: 'b', values: ['y'] },
      ],
    }).launchInputs.length,
    2,
  )
})

test('build host ApplicationSettings exposes only the declared launch bind', () => {
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
    assert.throws(() => api.ApplicationSettings.getString('theme-preference'), /during module setup/);
    api.configureNativeBuildHost('light', { width: 320, height: 640, reducedMotion: false }, { 'theme-preference': 'dark' });
    assert.equal(api.ApplicationSettings.getString('theme-preference'), 'dark');
    assert.equal(api.ApplicationSettings.getString('theme-preference', 'fallback'), 'dark');
    assert.throws(() => api.ApplicationSettings.getString('undeclared'), /undeclared/);
    assert.throws(() => api.ApplicationSettings.setString, /unsupported native read/);
    assert.throws(() => api.ApplicationSettings.hasKey, /unsupported native read/);
    assert.ok(api.nativeBuildHostEvidence().reads.includes('ApplicationSettings.getString:theme-preference'));
  `,
    ],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
})

test('a null launch bind resolves like an absent persisted key', () => {
  const module = new URL('../src/native-api.mjs', import.meta.url).href
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import assert from 'node:assert/strict';
    globalThis.XPLAT_HOME_PLATFORM = 'ios';
    const api = await import(${JSON.stringify(module)});
    api.configureNativeBuildHost('dark', { width: 320, height: 640, reducedMotion: false }, { 'theme-preference': null });
    assert.equal(api.ApplicationSettings.getString('theme-preference'), undefined);
    assert.equal(api.ApplicationSettings.getString('theme-preference', 'app'), 'app');
  `,
    ],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stderr)
})
