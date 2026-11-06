import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { flipCommandsY, generateCommands } from '../src/path.ts'
import { clipsChildren } from '../src/surface.ts'

function load(platform, globals) {
  const source = readFileSync(new URL(`../src/apply.${platform}.ts`, import.meta.url), 'utf8')
  const js = stripTypeScriptTypes(source)
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '')
  const context = {
    generateCommands,
    flipCommandsY,
    Color: class {
      constructor(value) {
        this.ios = { CGColor: value }
        this.android = value
      }
    },
    Utils: { layout: { toDevicePixels: (value) => value } },
    ...globals,
  }
  runInNewContext(js, context)
  return context
}

const props = { corners: { radius: 24 }, border: { width: 3, color: 'blue' } }
const ios = load('ios', {
  CAShapeLayer: { new: () => ({ removeFromSuperlayer() {} }) },
  CGPathCreateMutable: () => ({}),
  CGPathMoveToPoint() {},
  CGPathAddLineToPoint() {},
  CGPathAddCurveToPoint() {},
  CGPathAddArc() {},
  CGPathCloseSubpath() {},
})
function iosView() {
  return {
    ios: { layer: { mask: null, bounds: {}, addSublayer() {} } },
    getActualSize: () => ({ width: 200, height: 120 }),
  }
}

test('iOS: visible content has no mask while its painted surface stays shaped', () => {
  const content = iosView()
  const surface = iosView()
  ios.applySmoothClip(content, props, false)
  ios.applySmoothClip(surface, props)
  assert.equal(content.ios.layer.mask, null)
  assert.equal(content.ios.clipsToBounds, false)
  assert.ok(surface.ios.layer.mask.path)
  assert.equal(surface.ios.__smoothBorder.lineWidth, 6)
})

test('iOS: hidden to visible removes only the owned mask and can be re-enabled', () => {
  const view = iosView()
  ios.applySmoothClip(view, { corners: 24 })
  const mask = view.ios.layer.mask
  ios.applySmoothClip(view, { corners: 24 }, false)
  assert.equal(view.ios.layer.mask, null)
  ios.applySmoothClip(view, { corners: 12 })
  assert.equal(view.ios.layer.mask, mask)
  const foreign = {}
  view.ios.layer.mask = foreign
  ios.applySmoothClip(view, { corners: 24 }, false)
  assert.equal(view.ios.layer.mask, foreign)
})

function extend(methods) {
  return class {
    constructor() {
      Object.assign(this, { setBounds() {} }, methods)
    }
  }
}
const android = load('android', {
  android: {
    graphics: {
      Path: class {
        moveTo() {}
        lineTo() {}
        cubicTo() {}
        arcTo() {}
        close() {}
      },
      RectF: class {},
      Paint: Object.assign(
        class {
          setStyle() {}
          setColor() {}
          setStrokeWidth() {}
        },
        {
          ANTI_ALIAS_FLAG: 1,
          Style: { FILL: 'fill', STROKE: 'stroke' },
        },
      ),
      PixelFormat: { TRANSLUCENT: 0 },
      drawable: { Drawable: { extend } },
    },
    view: { ViewOutlineProvider: { extend } },
    os: { Build: { VERSION: { SDK_INT: 35 } } },
  },
})
function androidView() {
  return {
    style: { backgroundColor: 'red' },
    getActualSize: () => ({ width: 200, height: 120 }),
    android: {
      setOutlineProvider(value) {
        this.outline = value
      },
      setClipToOutline(value) {
        this.clip = value
      },
      setClipChildren(value) {
        this.clipChildren = value
      },
      setClipToPadding(value) {
        this.clipPadding = value
      },
      setBackground(value) {
        this.background = value
      },
      setElevation(value) {
        this.elevation = value
      },
      getWidth: () => 200,
      getHeight: () => 120,
      invalidate() {},
    },
  }
}

test('Android: visible overflow disables child clipping and hidden restores it', () => {
  const view = androidView()
  android.applySmoothClip(view, props, false)
  assert.equal(view.android.clip, false)
  assert.equal(view.android.clipChildren, false)
  assert.equal(view.android.clipPadding, false)
  android.applySmoothClip(view, props, true)
  assert.equal(view.android.clip, true)
  android.applySmoothClip(view, props, false)
  assert.equal(view.android.clip, false)
})

test('Android: inside border clips its own paint operation', () => {
  const view = androidView()
  android.applySmoothClip(view, props, false)
  const calls = []
  view.android.background.draw({
    drawPath() {
      calls.push('draw')
    },
    save() {
      calls.push('save')
      return 7
    },
    clipPath() {
      calls.push('clip')
    },
    restoreToCount(value) {
      calls.push(['restore', value])
    },
  })
  assert.deepEqual(calls, ['draw', 'save', 'clip', 'draw', ['restore', 7]])
})

test('overflow defaults to visible and only hidden on both axes requests a curved clip', () => {
  assert.equal(clipsChildren(undefined), false)
  assert.equal(clipsChildren('visible'), false)
  assert.equal(clipsChildren('hidden'), true)
  assert.equal(clipsChildren('hidden', 'visible'), false)
})

test('Android: the outer shadow remains unclipped and clears when removed', () => {
  const view = androidView()
  view.style = {}
  android.applySmoothShadow(view, { corners: 24, shadow: { blur: 8 } })
  assert.equal(view.android.elevation, 8)
  assert.equal(view.android.clipChildren, false)
  android.applySmoothShadow(view, { corners: 24 })
  assert.equal(view.android.elevation, 0)
})

const macos = load('macos', {
  CAShapeLayer: { new: () => ({ removeFromSuperlayer() {} }) },
  NSBezierPath: {
    bezierPath: () => ({
      CGPath: {},
      moveToPoint() {},
      lineToPoint() {},
      curveToPointControlPoint1ControlPoint2() {},
      appendBezierPathWithArcWithCenterRadiusStartAngleEndAngleClockwise() {},
      closePath() {},
    }),
  },
  NSColor: { blackColor: { CGColor: 'black' } },
  NSMakeSize: (width, height) => ({ width, height }),
})

test('macOS: default content is unmasked and hidden clipping can be removed', () => {
  macos.applySmoothClip({ layer: null }, 200, 120, { corners: 24 }, false)
  const view = { layer: { mask: null } }
  macos.applySmoothClip(view, 200, 120, { corners: 24 }, false)
  assert.equal(view.layer.mask, null)
  macos.applySmoothClip(view, 200, 120, { corners: 24 }, true)
  const mask = view.layer.mask
  assert.ok(mask.path)
  macos.applySmoothClip(view, 200, 120, { corners: 24 }, false)
  assert.equal(view.layer.mask, null)
  const foreign = {}
  view.layer.mask = foreign
  macos.applySmoothClip(view, 200, 120, { corners: 24 }, false)
  assert.equal(view.layer.mask, foreign)
})
