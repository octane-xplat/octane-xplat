import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const compile = async (name) =>
  ts.transpile(await readFile(new URL(`../src/ios/${name}`, import.meta.url), 'utf8'), {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  })

const compiled = await compile('liquid-glass-view.ios.ts')
const containerCompiled = await compile('liquid-glass-container-view.ios.ts')

// Effect/property replay and inherited host behavior, not UIKit geometry/input.
function fixture(glassSupported, materialHost = true, container = false) {
  const setter = 'setGlassEffect'
  const calls = []
  class UIVisualEffectView {
    display = 3
    contentView = { host: {} }
    effect = { kind: 'empty' }
  }

  class CoreView {
    setGlassEffect(value) {
      if (glassSupported) {
        this._applyGlassEffect(value, {
          effectType: 'glass',
          onCreate: () => calls.push(['create-overlay']),
        })
      }
    }
    _applyGlassEffect(value, options) {
      calls.push(['set', value, options])
      options.targetView.effect = { kind: options.effectType, value }
    }
    disposeNativeView() {
      this.native = undefined
      calls.push(['dispose', this.nativeViewProtected])
      this.nativeViewProtected = undefined
    }
  }

  class MasonView extends CoreView {
    get ios() {
      return (this.native ??= {})
    }
    createNativeView() {
      const view = this.ios

      calls.push(['create', view])
      return view
    }
    onMeasure(width, height) {
      calls.push(['mason-measure', width, height])
    }
    onLayout(...bounds) {
      calls.push(['mason-layout', ...bounds])
    }
  }

  class MaterialView extends MasonView {
    get ios() {
      return (this.native ??= new UIVisualEffectView())
    }
  }

  if (materialHost) {
    Object.defineProperty(MasonView, 'materialViewClass', { value: MaterialView })
  }

  const context = vm.createContext({
    exports: {},
    require: (name) => {
      if (name === '@nativescript/core') {
        return { View: CoreView, Utils: { supportsGlass: () => glassSupported } }
      }

      if (name === '@nativescript-community/octane') {
        return { ELEMENTS: new Map([['masonview', MasonView]]) }
      }

      if (name === '@octane-xplat/platform/ios') {
        return {
          UIBlurEffect: { effectWithStyle: (style) => ({ kind: 'blur', style }) },
          UIVisualEffectView,
          UIVisualEffect: { new: () => ({ kind: 'empty' }) },
        }
      }

      if (name === './liquid-glass-view.ios') {
        return context.exports
      }

      throw new Error(`Unexpected import: ${name}`)
    },
  })

  vm.runInContext(compiled, context)
  if (container) {
    vm.runInContext(containerCompiled, context)
  }

  const Host = container
    ? context.exports.LiquidGlassContainerView
    : context.exports.LiquidGlassView

  return { view: new Host(), calls, setter, MaterialView }
}

test('older iOS creates system material on the native effect root', () => {
  const { view } = fixture(false)
  const native = view.createNativeView()

  assert.equal(native, view.ios)
  assert.ok(native.contentView.host)
  assert.deepEqual(native.effect, { kind: 'blur', style: 8 })
})

test('older iOS retains system material on property replay and updates', () => {
  const { view, calls, setter } = fixture(false)

  view.nativeViewProtected = view.createNativeView()
  for (const value of [
    { variant: 'regular' },
    { variant: 'clear', interactive: true, tint: '#fff' },
  ]) {
    view[setter](value)
    assert.deepEqual(view.nativeViewProtected.effect, { kind: 'blur', style: 8 })
  }

  assert.equal(calls.filter(([name]) => name === 'set').length, 0)
})

test('modern glass forwards exact tint/variant/interaction config to its native root', () => {
  const { view, calls, setter } = fixture(true)

  view.nativeViewProtected = view.createNativeView()
  for (const interactive of [false, true]) {
    const config = { variant: 'clear', interactive, tint: '#123456', animateChangeDuration: 0 }

    view[setter](config)
    assert.equal(calls.at(-1)[1], config)
    assert.equal(calls.at(-1)[2].targetView, view.nativeViewProtected)
    assert.equal(calls.at(-1)[2].effectType, 'glass')
  }

  assert.equal(calls.some(([name]) => name === 'create-overlay'), false)
})

test('native disposal stays inherited and recreation restores fallback on a fresh root', () => {
  const { view, calls } = fixture(false)
  const first = view.createNativeView()

  view.nativeViewProtected = first
  view.disposeNativeView()
  assert.equal(view.nativeViewProtected, undefined)
  assert.equal(calls.at(-1)[0], 'dispose')

  const second = view.createNativeView()

  assert.notEqual(first, second)
  assert.ok(second.contentView.host)
  assert.deepEqual(second.effect, { kind: 'blur', style: 8 })
})

test('material roots inherit Mason measurement/placement and block default', () => {
  const { view, calls, MaterialView } = fixture(true)

  assert.ok(view instanceof MaterialView)
  assert.equal(view.ios.display, 3)
  view.onMeasure(353, 82)
  view.onLayout(5, 7, 358, 89)
  assert.deepEqual(calls, [
    ['mason-measure', 353, 82],
    ['mason-layout', 5, 7, 358, 89],
  ])
})

test('grouping uses the same Mason root and native container effect; older systems stay inert', () => {
  const { view, calls, setter, MaterialView } = fixture(true, true, true)

  assert.ok(view instanceof MaterialView)

  const root = view.createNativeView()
  const config = { spacing: 12 }

  view[setter](config)
  assert.equal(calls.at(-1)[2].targetView, root)
  assert.equal(calls.at(-1)[2].effectType, 'container')
  assert.equal(calls.at(-1)[1], config)

  const older = fixture(false, true, true)

  older.view[older.setter](config)
  assert.deepEqual(older.view.ios.effect, { kind: 'empty' })
})

test('component registers the material adapter and defaults interaction off while retaining escapes', async () => {
  const leaf = await readFile(new URL('../src/ios/LiquidGlass.ios.tsrx', import.meta.url), 'utf8')

  assert.match(leaf, /registerElement\('liquidglass', LiquidGlassView\)/)
  assert.match(leaf, /interactive: props\.interactive \?\? false/)
  assert.match(leaf, /applyEscapeProps\(v, props\)/)
  assert.match(leaf, /layoutChildProps\(props/)
  assert.match(leaf, /\{props\.children\}/)
})

test('container registers the Mason material root', async () => {
  const leaf = await readFile(
    new URL('../src/ios/LiquidGlassContainer.ios.tsrx', import.meta.url),
    'utf8',
  )

  assert.match(leaf, /registerElement\('liquidglasscontainer', LiquidGlassContainerView\)/)
})

test('older core builds fail explicitly when the native material-root capability is absent', () => {
  assert.throws(
    () => fixture(true, false),
    /requires Mason core with a native material layout root/,
  )
})
