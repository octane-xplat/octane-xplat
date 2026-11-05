import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = await readFile(
  new URL('../src/theme/status-bar-scheme.mobile.ts', import.meta.url),
  'utf8',
)

const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
})

// Standalone bundles evaluate UI modules before Application.run installs
// Application.ios.nativeApp — the module-level applyStatusBarScheme must not
// probe the null native app with 'in' (issue #146).
function loadModule({ scheme = 'dark', nativeApp = null, root = undefined } = {}) {
  const displayed = []
  const schemeListeners = []
  const ios = { nativeApp }
  const Application = {
    ios,
    android: undefined,
    getRootView: () => root,
    on(event, callback) {
      if (event === 'displayed') {
        displayed.push(callback)
      }
    },
  }
  const context = vm.createContext({
    exports: {},
    require(name) {
      if (name === '@nativescript/core') {
        return { Application, Utils: {} }
      }
      assert.equal(name, './theme-scheme')
      return {
        getThemeScheme: () => scheme,
        onThemeSchemeChange: (callback) => schemeListeners.push(callback),
      }
    },
  })
  return { context, displayed, schemeListeners, ios, Application }
}

test('module evaluation with null nativeApp does not throw', () => {
  const { context, displayed, schemeListeners } = loadModule()
  assert.doesNotThrow(() => vm.runInContext(compiled, context))
  assert.equal(displayed.length, 1)
  assert.equal(schemeListeners.length, 1)
})

test('displayed applies the scheme once nativeApp exists', () => {
  const styles = []
  const root = {}
  const { context, displayed, ios } = loadModule({ root })
  vm.runInContext(compiled, context)

  // Application.run installs the UIApplication, then displayed fires.
  ios.nativeApp = {
    setStatusBarStyle(style) {
      styles.push(style)
    },
  }
  for (const callback of displayed) {
    callback()
  }

  assert.equal(root.statusBarStyle, 'light')
  assert.deepEqual(styles, [1])
})

test('displayed with nativeApp still null stays silent', () => {
  const { context, displayed } = loadModule()
  vm.runInContext(compiled, context)
  assert.doesNotThrow(() => {
    for (const callback of displayed) {
      callback()
    }
  })
})
