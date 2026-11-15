import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { buildTarget, boundary, css } from '../dist/vite.js'

const original = {
  target: process.env.XPLAT_TARGET,
  bundler: process.env.NATIVESCRIPT_BUNDLER_ENV,
  argv: process.argv,
}

function invocation(selected, bundler, args = []) {
  delete process.env.XPLAT_TARGET
  delete process.env.NATIVESCRIPT_BUNDLER_ENV
  if (selected !== undefined) process.env.XPLAT_TARGET = selected
  if (bundler !== undefined) process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify(bundler)
  process.argv = [original.argv[0], original.argv[1], ...args]
}

afterEach(() => {
  invocation(original.target)
  if (original.bundler !== undefined) process.env.NATIVESCRIPT_BUNDLER_ENV = original.bundler
  process.argv = original.argv
})

test('direct Vite defaults to web; target reads stay fresh between invocations', () => {
  invocation()
  assert.equal(buildTarget(), 'web')
  invocation('ios')
  assert.equal(buildTarget(), 'ios')
  invocation('android')
  assert.equal(buildTarget(), 'android')
})

for (const platform of ['ios', 'android', 'visionos', 'windows']) {
  test(`${platform}: CLI, direct NativeScript and low-level plugins agree`, () => {
    for (const [selected, env, args] of [
      [platform, undefined, []],
      [undefined, { platform }, []],
      [undefined, { [platform]: true }, []],
      [undefined, undefined, [`--env.${platform}`]],
      [undefined, undefined, [`--platform=${platform}`]],
    ]) {
      invocation(selected, env, args)
      assert.equal(buildTarget(), platform)
      assert.equal(css().api.platform, platform)
      const plugin = boundary()
      const warnings = []
      plugin.configResolved({ command: 'serve', root: '/app', environments: {} })
      plugin.moduleParsed.call(
        { warn: (message) => warnings.push(message) },
        { id: '/app/file.web.ts' },
      )
      assert.equal(warnings.length, 1, 'boundary must reject the web leaf on a native target')
    }
  })
}

test('conflicting and invalid targets fail instead of choosing a different platform', () => {
  invocation('ios', { platform: 'android' })
  assert.throws(buildTarget, /conflicts/)
  invocation('typo')
  assert.throws(buildTarget, /Unknown XPLAT_TARGET/)
  invocation(undefined, { platform: 'typo' })
  assert.throws(buildTarget, /Unknown NativeScript/)
  invocation(undefined, [])
  assert.throws(buildTarget, /must be an object/)
})
