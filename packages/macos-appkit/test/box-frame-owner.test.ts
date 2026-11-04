import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'
import * as platform from './paint-native.ts'
import { native, CALayer } from './paint-native.ts'
import { registerStylesheet, unregisterStylesheet, computeCascade } from '@octane-xplat/css-engine'
import { setProjectionScale } from '../src/projection-paint.ts'

const hooks = mockNativeBoundary({
  module: new URL('./paint-native.ts', import.meta.url),
  exports: Object.keys(platform).filter((key) => key !== 'native'),
})
const { createBoxPaint } = await import('../src/box-paint.ts')
const { createNativeStyle } = await import('../src/native-style.ts')
const { createCssAnimations } = await import('../src/css-animations.ts')
hooks.deregister()
Object.assign(globalThis, { NSColorSpace: { sRGBColorSpace: {} } })

function fixture() {
  native.reset()
  const paint = createBoxPaint()
  const layer = new CALayer()
  const parent = new CALayer()
  parent.addSublayer(layer)
  const view: any = {
    layer,
    frame: { origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } },
    bounds: { origin: { x: 7, y: 9 }, size: { width: 100, height: 40 } },
  }
  const node: any = {
    id: 1,
    type: 'masonview',
    lifecycle: 'live',
    view,
    props: {},
    parent: null,
    children: [],
  }
  let previous = {}
  const apply = (next: Record<string, unknown>) => {
    node.props.style = next
    paint.applyBoxStyle(node, previous, next)
    previous = next
  }
  return { paint, node, view, layer, parent, apply }
}

function onlyFrame() {
  const tokens = native.tokens.filter((token) => token.removed === 0)
  assert.equal(tokens.length, 1)
  return tokens[0]
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 10))

test('one production coordinator owns percent radii/translates, repeated sync, removal and double disposal', () => {
  const fx = fixture()
  fx.apply({ borderRadius: '50%', translateX: '50%' })
  const token = onlyFrame()
  assert.equal(fx.layer.cornerRadius, 20)
  assert.deepEqual(fx.layer.transform, [['translate', 50, 0, 0]])
  fx.view.frame.size = fx.view.bounds.size = { width: 200, height: 80 }
  token.callback()
  assert.equal(fx.layer.cornerRadius, 40)
  assert.deepEqual(fx.layer.transform, [['translate', 100, 0, 0]])
  for (let i = 0; i < 3; i++) {
    fx.paint.syncGeometry(fx.node)
    fx.apply({ borderRadius: '50%', translateX: '50%' })
  }
  assert.equal(onlyFrame(), token)
  assert.equal(fx.layer.children.length, 0)
  fx.apply({})
  assert.equal(token.removed, 1)
  assert.equal(fx.layer.cornerRadius, 0)
  assert.deepEqual(fx.layer.transform, [])
  fx.paint.dispose(fx.node)
  fx.paint.dispose(fx.node)
  token.callback()
  assert.equal(fx.layer.cornerRadius, 0)
  assert.equal(token.removed, 1)
  assert.equal('boxFrameOwner' in fx.node, false)
  assert.equal('borderSpec' in fx.node, false)
})

test('per-side banded borders and per-corner masks retain their geometry without stacking', () => {
  const fx = fixture()
  fx.apply({
    borderTopWidth: 6,
    borderRightWidth: 3,
    borderColor: '#ff0000',
    borderStyle: 'double',
    borderTopLeftRadius: 8,
    borderBottomRightRadius: '25%',
  })
  const host = fx.layer.children[0]
  assert.ok(fx.layer.mask)
  assert.equal(host.frame.size.width, 100)
  assert.equal(host.children.filter((child) => !child.hidden).length, 4)
  assert.ok(host.children.some((child) => child.path.some((op: unknown[]) => op[0] === 'line')))
  for (let i = 0; i < 5; i++) {
    onlyFrame().callback()
  }
  assert.equal(fx.layer.children.length, 1)
  assert.equal(fx.layer.children[0], host)
  fx.apply({})
  assert.equal(fx.layer.children.length, 0)
  assert.equal(fx.layer.mask, null)
})

test('outset siblings and inset shadows resize and retire with their single owner', () => {
  const fx = fixture()
  fx.apply({
    borderRadius: 8,
    boxShadow: '1px 2px 3px red, 4px 5px 6px blue, inset 2px 3px 4px black',
  })
  assert.equal(fx.parent.children.length, 3)
  assert.equal(fx.layer.children.length, 1)
  const outsets = fx.parent.children.filter((child) => child !== fx.layer)
  assert.equal(outsets[0].shadowOpacity, 1)
  fx.view.frame.size = { width: 150, height: 60 }
  onlyFrame().callback()
  assert.equal(fx.layer.children[0].frame.size.width, 150)
  fx.paint.dispose(fx.node)
  assert.deepEqual(fx.parent.children, [fx.layer])
  assert.equal(fx.layer.children.length, 0)
})

test('outline resize preserves bounds geometry and origin-only frame notification semantics', () => {
  const fx = fixture()
  fx.apply({ outline: '2px dashed red', outlineOffset: 1, borderRadius: 4 })
  const outline = fx.layer.children[0]
  assert.deepEqual(outline.frame, { origin: { x: -3, y: -3 }, size: { width: 106, height: 46 } })
  const token = onlyFrame()
  fx.view.frame.origin.x = 30
  token.callback()
  assert.equal(fx.layer.children[0], outline)
  fx.view.bounds.size = { width: 160, height: 70 }
  token.callback()
  assert.equal(outline.frame.size.width, 166)
  assert.equal(outline.frame.size.height, 76)
  fx.apply({})
  assert.equal(outline.superlayer, null)
  assert.equal(token.removed, 1)
})

test('view replacement retires old frame/layers and held callbacks cannot repaint either owner', () => {
  const fx = fixture()
  fx.apply({ outline: '2px solid red', borderRadius: '50%', boxShadow: '0 2px 3px black' })
  const token = onlyFrame(),
    oldOutline = fx.layer.children[0]
  fx.node.view = { ...fx.view, layer: new CALayer() }
  fx.apply({ outline: '2px solid blue', borderRadius: '25%' })
  const replacement = onlyFrame()
  assert.notEqual(replacement, token)
  assert.equal(token.removed, 1)
  assert.equal(oldOutline.superlayer, null)
  const radius = fx.node.view.layer.cornerRadius
  token.callback()
  assert.equal(fx.node.view.layer.cornerRadius, radius)
  fx.paint.dispose(fx.node)
  replacement.callback()
  assert.equal(replacement.removed, 1)
})

test('projection compensation retains its narrow border/shadow writes and preserves authored transforms', () => {
  const fx = fixture()
  fx.apply({ borderRadius: 20, translateX: '50%', boxShadow: '0 4px 12px black' })
  const transform = fx.layer.transform
  setProjectionScale(fx.view, { x: 2, y: 2 })
  fx.paint.syncProjection(fx.node)
  assert.equal(fx.layer.cornerRadius, 10)
  assert.equal(fx.layer.transform, transform)
  assert.equal(fx.parent.children[0].shadowRadius, 6)
  setProjectionScale(fx.view, null)
  fx.paint.syncProjection(fx.node)
  assert.equal(fx.layer.cornerRadius, 20)
  fx.paint.dispose(fx.node)
})

test('setup callbacks and reentrant native frame delivery cannot recurse or stack observers', () => {
  const fx = fixture()
  let writes = 0
  native.onWrite = () => {
    writes++
    native.tokens.forEach((token) => token.callback())
  }
  fx.apply({ borderRadius: '50%' })
  assert.equal(writes, 1, 'synchronous registration delivery is not ready')
  onlyFrame().callback()
  assert.equal(writes, 2, 'frame writes cannot recursively deliver another paint')
  assert.equal(native.tokens.length, 1)
  fx.paint.dispose(fx.node)
})

test('late handles after reentrant replacement release once without clearing the new lease', () => {
  const fx = fixture()
  native.onAdd = () => {
    native.onAdd = undefined
    fx.node.view = { ...fx.view, layer: new CALayer() }
    fx.apply({ borderRadius: '25%' })
  }
  fx.apply({ borderRadius: '50%' })
  assert.equal(native.tokens.length, 2)
  assert.equal(native.tokens[0].removed, 1)
  const current = onlyFrame()
  native.tokens[0].callback()
  assert.equal(onlyFrame(), current)
  fx.paint.dispose(fx.node)
  assert.equal(current.removed, 1)
})

test('captured center cleanup retires before native reentry and contains release failure', () => {
  const fx = fixture()
  const warnings: string[] = [],
    warn = console.warn
  console.warn = (message) => warnings.push(message)
  try {
    fx.apply({ borderRadius: '50%' })
    const token = onlyFrame()
    native.onRemove = () => {
      token.callback()
      fx.paint.dispose(fx.node)
      throw Error('private native error')
    }
    fx.paint.dispose(fx.node)
    fx.paint.dispose(fx.node)
    assert.equal(token.removed, 1)
    assert.equal(fx.layer.cornerRadius, 0)
    assert.deepEqual(warnings, ['[macos-css] Box frame cleanup failed'])
  } finally {
    console.warn = warn
  }
})

test('failed observation retires held callbacks and permits a later registration', () => {
  const fx = fixture()
  const warn = console.warn
  console.warn = () => {}
  try {
    native.throwOnAdd = true
    fx.apply({ borderRadius: '50%' })
    const held = native.held!
    native.throwOnAdd = false
    fx.paint.syncGeometry(fx.node)
    const current = onlyFrame()
    assert.equal(native.tokens.length, 1)
    held()
    assert.equal(onlyFrame(), current)
    fx.paint.dispose(fx.node)
  } finally {
    console.warn = warn
  }
})

test('layered backgrounds share one frame lease and actual image-request completions become inert on retirement', async () => {
  const fx = fixture()
  fx.apply({ backgroundImage: 'url(p2-one.png), url(p2-two.png), linear-gradient(red, blue)' })
  const token = onlyFrame()
  const host = fx.layer.children[0]
  await delay()
  assert.deepEqual(native.decodes, ['p2-one.png', 'p2-two.png'])
  assert.equal(host.children.length, 3)
  assert.ok(host.children[0].contents)
  assert.ok(host.children[1].contents)
  fx.paint.syncGeometry(fx.node)
  assert.equal(onlyFrame(), token)
  fx.paint.dispose(fx.node)
  const contents = host.children[0].contents
  token.callback()
  assert.equal(host.children[0].contents, contents)
  assert.equal(host.superlayer, null)
  fx.apply({ backgroundImage: 'url(p2-retired.png)' })
  native.onDecode = () => fx.paint.dispose(fx.node)
  await delay()
  assert.equal(fx.layer.children.length, 0)
  assert.equal(native.tokens.at(-1)!.removed, 1)
})

test('paint disposal attempts independent releases after failure, restores baseline and cannot reenter acquisition', () => {
  const fx = fixture()
  fx.layer.cornerRadius = 7
  fx.apply({
    borderRadius: '50%',
    boxShadow: '1px 2px 3px black, 2px 3px 4px red',
    outline: '2px solid red',
  })
  const outset = fx.parent.children.find((child) => child !== fx.layer)!
  const outline = fx.layer.children.find((child) => child.borderWidth === 2)!
  const failure = Error('native shadow release')
  let releases = 0
  outset.removeFromSuperlayer = () => {
    releases++
    fx.paint.dispose(fx.node)
    fx.apply({ borderRadius: 90 })
    throw failure
  }
  assert.throws(
    () => fx.paint.dispose(fx.node),
    (error) => error === failure,
  )
  assert.equal(outline.superlayer, null)
  assert.equal(fx.layer.children.length, 0)
  assert.equal(fx.layer.cornerRadius, 7)
  assert.equal(native.tokens[0].removed, 1)
  fx.paint.dispose(fx.node)
  assert.equal(releases, 1, 'a failed native release is retired, never retried')
  assert.equal(fx.parent.children.length, 2, 'only the failing OS release may remain attached')
})

test('geometry sync migrates an explicitly replaced view without retaining its old lease', () => {
  const fx = fixture()
  fx.apply({ borderRadius: '50%' })
  const token = onlyFrame()
  fx.node.appliedStyle = { borderRadius: '50%' }
  fx.node.view = { ...fx.view, layer: new CALayer() }
  fx.paint.syncGeometry(fx.node)
  assert.equal(token.removed, 1)
  assert.equal(fx.node.view.layer.cornerRadius, 20)
  assert.notEqual(onlyFrame(), token)
  fx.paint.dispose(fx.node)
})

test('CSS animation frames and cancellation reach the production paint owner through native style', (context) => {
  const fx = fixture()
  context.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 })
  const style = createNativeStyle({
    boxPaint: fx.paint,
    registry: { behaviorOf: () => undefined, isManualLayoutParent: () => false },
    layout: { queueLayoutReconcile() {} },
  } as any)
  const animations = createCssAnimations({ nativeStyle: style })
  const node = fx.node
  node.computedStyle = { translateX: 0 }
  node.cssType = 'masonview'
  node.cssClasses = new Set(['p2-animated'])
  node.cssPseudoClasses = new Set()
  node.computedCustomProps = new Map()
  registerStylesheet(
    'p2-paint-animation',
    '@keyframes p2-slide { from { transform: translateX(0%); } to { transform: translateX(100%); } } .p2-animated { animation: p2-slide 1s linear infinite; }',
  )
  try {
    const infos = computeCascade(node).animations
    assert.ok(infos.length)
    animations.playKeyframeAnimations(node, infos)
    context.mock.timers.tick(500)
    assert.ok(Number(node.view.layer.transform[0][1]) > 0)
    const token = onlyFrame()
    animations.stopSubtreeAnimations(node)
    assert.deepEqual(node.view.layer.transform, [])
    assert.equal(
      native.tokens.filter((token) => token.removed === 0).length,
      0,
      'sampled point values do not require a percent frame lease',
    )
    assert.equal(token.removed, 1)
    fx.paint.dispose(node)
  } finally {
    unregisterStylesheet('p2-paint-animation')
  }
})

test('frame delivery repaints after the native backing-layer commit and pending work retires by identity', async () => {
  const fx = fixture()
  fx.apply({ translateX: '25%' })
  const token = onlyFrame()
  token.callback()
  fx.layer.transform = [] // AppKit completes its backing-layer write after notification.
  await delay()
  assert.deepEqual(fx.layer.transform, [['translate', 25, 0, 0]])
  token.callback()
  fx.paint.dispose(fx.node)
  await delay()
  assert.deepEqual(fx.layer.transform, [])
  assert.equal(token.removed, 1)
})

test('a superseded acquisition cannot dispose the replacement acquired during a native setter', () => {
  const fx = fixture()
  const replacement = { ...fx.view, layer: new CALayer() }
  let replace = true
  Object.defineProperty(fx.view, 'wantsLayer', {
    set() {
      if (!replace) {
        return
      }
      replace = false
      fx.node.view = replacement
      fx.apply({ borderRadius: '25%' })
    },
  })
  fx.apply({ borderRadius: '50%' })
  assert.equal(replacement.layer.cornerRadius, 10)
  const token = onlyFrame()
  assert.equal(token.view, replacement)
  token.callback()
  assert.equal(replacement.layer.cornerRadius, 10)
  fx.paint.dispose(fx.node)
  assert.equal(token.removed, 1)
})
