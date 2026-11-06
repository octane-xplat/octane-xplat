import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript-classic'

// Issue #149: an SVGKFastImageView held under a collapsed/hidden ancestor is
// never asked to draw, so layer.contents stays nil after the reveal. The
// vendored SVGView must request display once it gains positive bounds or its
// own visibility is restored.
const source = readFileSync(
  new URL('../src/vendor/ui-svg/src/index.ios.ts', import.meta.url),
  'utf8',
)

const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const visibilityProperty = { setNative: Symbol('visibility') }

class Base {
  onLayout(left, top, right, bottom) {
    this.laidOut = [left, top, right, bottom]
  }

  onMeasure(width, height) {
    this.measured = [width, height]
  }

  [visibilityProperty.setNative](value) {
    this.nativeViewProtected.hidden = value !== 'visible'
  }
}

const exports = {}
runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === '@nativescript/core') {
      return {
        CoreTypes: { Visibility: { visible: 'visible', collapse: 'collapse', hidden: 'hidden' } },
        visibilityProperty,
        File: class File {},
        ImageAsset: class ImageAsset {},
        Utils: { layout: { toDevicePixels: (size) => size } },
        knownFolders: { currentApp: () => ({ path: '' }) },
        path: { join: (...parts) => parts.join('/') },
      }
    }
    if (name === './index.common') {
      return {
        SVGView: Base,
        srcProperty: { setNative: Symbol('src') },
        stretchProperty: { setNative: Symbol('stretch') },
      }
    }
    if (name === './svg-use') {
      return { resolveSvgUse: (markup) => markup }
    }
    throw new Error(`Unexpected import: ${name}`)
  },
})

// Model UIKit: setNeedsDisplay produces backing contents only for a view that
// is not hidden — the dropped-while-hidden behavior behind issue #149.
function makeNative({ width = 0, height = 0, hidden = false } = {}) {
  const layer = { contents: null }
  return {
    bounds: { size: { width, height } },
    hidden,
    layer,
    image: { size: { width: 24, height: 24 } },
    displayRequests: 0,
    setNeedsDisplay() {
      this.displayRequests += 1
      if (!this.hidden) {
        layer.contents = { backing: true }
      }
    },
  }
}

function makeView(native) {
  const view = new exports.SVGView()
  view.nativeViewProtected = native
  return view
}

test('collapse→visible cycle leaves non-nil backing contents', () => {
  const native = makeNative()
  const view = makeView(native)

  // Laid out at zero bounds while the ancestor is collapsed: nothing to draw.
  view.onLayout(0, 0, 0, 0)
  assert.equal(native.displayRequests, 0)

  // Reveal: the parent unhides and the view gains positive bounds.
  native.bounds = { size: { width: 72, height: 72 } }
  view.onLayout(0, 0, 72, 72)

  assert.equal(native.displayRequests, 1)
  assert.notEqual(native.layer.contents, null)
})

test('visibility restored over positive bounds requests display', () => {
  const native = makeNative({ width: 72, height: 72, hidden: true })
  const view = makeView(native)

  view[visibilityProperty.setNative]('collapse')
  assert.equal(native.displayRequests, 0)

  view[visibilityProperty.setNative]('visible')
  assert.equal(native.displayRequests, 1)
  assert.notEqual(native.layer.contents, null)
})

test('drawn or still-hidden views are not re-marked for display', () => {
  const drawn = makeNative({ width: 72, height: 72 })
  drawn.layer.contents = { backing: true }
  const view = makeView(drawn)
  view.onLayout(0, 0, 72, 72)
  view[visibilityProperty.setNative]('visible')
  assert.equal(drawn.displayRequests, 0)

  const hidden = makeNative({ width: 72, height: 72, hidden: true })
  const hiddenView = makeView(hidden)
  hiddenView.onLayout(0, 0, 72, 72)
  assert.equal(hidden.displayRequests, 0)
})
