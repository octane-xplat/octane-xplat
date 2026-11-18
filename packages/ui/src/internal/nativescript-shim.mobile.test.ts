import { expect, it } from 'vitest'
import * as nativescriptOctane from '@octane-xplat/nativescript-octane'
import { createObjectDriver } from 'octane/universal/native'

// Harness guard: compiled leaves import the bare renderer module
// '@octane-xplat/nativescript-octane', which the native vitest config
// aliases to tests/octane-native-shim.ts — the real package index pulls
// @nativescript/core and cannot load in node at all. If that alias ever
// stops applying (e.g. SSR externalization wins over resolve.alias), this
// file fails to load like every other mobile suite file.
it('resolves the bare renderer module to the node-loadable shim', () => {
  // The shim's registerElement is a zero-argument no-op; the real registry
  // call takes (name, class) and needs @nativescript/core at module scope.
  expect(nativescriptOctane.registerElement.length).toBe(0)
  expect(nativescriptOctane.registerElement('any-tag')).toBeUndefined()
})

it('re-exports the universal runtime through the shim', () => {
  expect(nativescriptOctane.createObjectDriver).toBe(createObjectDriver)
})
