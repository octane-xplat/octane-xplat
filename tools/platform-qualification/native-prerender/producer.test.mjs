import assert from 'node:assert/strict'
import test from 'node:test'

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
