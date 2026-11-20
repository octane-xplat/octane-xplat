import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript-classic'

// Isolate the macOS leaf; its only runtime import is the bridge accessor,
// which reads the host-installed global.
const source = readFileSync(
  new URL('../src/components/layout/resize-basis.macos.ts', import.meta.url),
  'utf8',
).replace(
  "import { appKitHost } from '../../internal/platform/host-bridge'",
  'const appKitHost = () => globalThis.__xplatAppKit',
)

const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
}).outputText

const { nativeBasisSource } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

test.afterEach(() => {
  delete globalThis.__xplatAppKit
})

test('AppKit resizable basis measures the container view frame', () => {
  const containerRef = { current: { frame: { size: { width: 420, height: 300 } } } }

  assert.equal(nativeBasisSource.measure(containerRef, 'horizontal'), 420)
  assert.equal(nativeBasisSource.measure(containerRef, 'vertical'), 300)
})

test('AppKit resizable basis falls back to the host windowSize', () => {
  // The host installs `windowSize` (a getter over the service window's
  // content bounds), not a getWindowSize() function — the GTK leaf's member.
  globalThis.__xplatAppKit = { windowSize: { width: 800, height: 600, orientation: 'landscape' } }

  assert.equal(nativeBasisSource.measure(undefined, 'horizontal'), 800)
  assert.equal(nativeBasisSource.measure(undefined, 'vertical'), 600)
  assert.equal(nativeBasisSource.measure({ current: null }, 'horizontal'), 800)
})

test('AppKit resizable basis reports null without a host or container', () => {
  assert.equal(nativeBasisSource.measure(undefined, 'horizontal'), null)
  assert.equal(nativeBasisSource.measure({ current: {} }, 'vertical'), null)
})
