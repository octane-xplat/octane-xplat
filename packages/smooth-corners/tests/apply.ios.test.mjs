import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript-classic'
import { generateCommands } from '../src/path.ts'

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/apply.ios.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

const exports = {}
runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === '@nativescript/core') {
      return { Color: class {} }
    }
    if (name === './path') {
      return { generateCommands }
    }
    throw new Error(`Unexpected import: ${name}`)
  },
  CAShapeLayer: { new: () => ({ path: null }) },
  CGPathCreateMutable: () => ({}),
  CGPathMoveToPoint() {},
  CGPathAddLineToPoint() {},
  CGPathAddCurveToPoint() {},
  CGPathAddArc() {},
  CGPathCloseSubpath() {},
})

const props = { corners: { radius: 24, curve: 'squircle', smoothing: 0.6 } }

function surface() {
  return {
    ios: { layer: { mask: null } },
    redraws: [],
    getActualSize: () => ({ width: 200, height: 400 }),
    _redrawNativeBackground(...args) {
      this.redraws.push(args)
      // NativeScript clearLayerMask restores originalMask (normally null).
      this.ios.layer.mask = null
      return args[0]
    },
  }
}

test('keeps the squircle through background redraws without layout events', () => {
  const view = surface()
  exports.applySmoothClip(view, props)
  const mask = view.ios.layer.mask
  assert.ok(mask)
  for (let i = 0; i < 3; i++) {
    assert.equal(view._redrawNativeBackground(i, 'extra'), i)
    assert.equal(view.ios.layer.mask, mask)
  }
  assert.deepEqual(view.redraws, [
    [0, 'extra'],
    [1, 'extra'],
    [2, 'extra'],
  ])
})

test('wraps redraw only once and allows clip geometry to update', () => {
  const view = surface()
  exports.applySmoothClip(view, props)
  const redraw = view._redrawNativeBackground
  const firstPath = view.ios.layer.mask.path
  view.getActualSize = () => ({ width: 240, height: 480 })
  exports.applySmoothClip(view, props)
  assert.equal(view._redrawNativeBackground, redraw)
  assert.notEqual(view.ios.layer.mask.path, firstPath)
  view._redrawNativeBackground(null)
  assert.equal(view.ios.layer.mask, view.ios.__smoothMask)
})

test('does not restore removed masks or masks owned elsewhere', () => {
  const view = surface()
  exports.applySmoothClip(view, props)
  for (const mask of [null, {}]) {
    view.ios.layer.mask = mask
    view._redrawNativeBackground(null)
    assert.equal(view.ios.layer.mask, null)
  }
})

test('keeps the mask and propagates errors from background drawing', () => {
  const view = surface()
  const error = new Error('redraw failed')
  view._redrawNativeBackground = function () {
    this.ios.layer.mask = null
    throw error
  }
  exports.applySmoothClip(view, props)
  assert.throws(
    () => view._redrawNativeBackground(null),
    (caught) => caught === error,
  )
  assert.equal(view.ios.layer.mask, view.ios.__smoothMask)
})

test('does not copy a mask onto a replacement native view', () => {
  const view = surface()
  const replacement = { layer: { mask: null } }
  view._redrawNativeBackground = function () {
    this.ios = replacement
  }
  exports.applySmoothClip(view, props)
  view._redrawNativeBackground(null)
  assert.equal(replacement.layer.mask, null)
})

test('ignores unavailable or zero-sized native views', () => {
  exports.applySmoothClip(null, props)
  exports.applySmoothClip({}, props)
  const view = surface()
  const redraw = view._redrawNativeBackground
  view.getActualSize = () => ({ width: 0, height: 0 })
  exports.applySmoothClip(view, props)
  assert.equal(view.ios.layer.mask, null)
  assert.equal(view._redrawNativeBackground, redraw)
})
