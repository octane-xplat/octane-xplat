import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { computeCascade, registerStylesheet, stylesheetScope } from '@octane-xplat/css-engine'
import { commandsToD, flipCommandsY, generateCommands } from '../src/path.ts'
import { clipsChildren } from '../src/surface.ts'

function load(platform, globals) {
  const source = readFileSync(new URL(`../src/apply.${platform}.ts`, import.meta.url), 'utf8')
  const js = stripTypeScriptTypes(source)
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '')

  const context = {
    generateCommands,
    commandsToD,
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
    style: {},
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
  assert.equal(content.style.clipPath, undefined)
  assert.equal(
    surface.style.clipPath,
    `path("${commandsToD(generateCommands(200, 120, props.corners))}")`,
  )

  assert.equal(surface.ios.layer.mask, null)
  assert.equal(surface.ios.__smoothMask, undefined)
  assert.equal(surface.ios.__smoothBorder.lineWidth, 6)
})

test('iOS: disabling clears only the owned CSS path, not an unrelated native mask', () => {
  const view = iosView()

  ios.applySmoothClip(view, { corners: 24 })

  const path = view.style.clipPath
  const foreign = {}

  view.ios.layer.mask = foreign
  ios.applySmoothClip(view, { corners: 24 }, false)
  assert.equal(view.style.clipPath, 'none')
  assert.equal(view.ios.layer.mask, foreign)
  ios.applySmoothClip(view, { corners: 24 })
  assert.equal(view.style.clipPath, path)
  view.style.clipPath = 'circle(50%)'
  ios.applySmoothClip(view, { corners: 24 }, false)
  assert.equal(view.style.clipPath, 'circle(50%)')
})

test('iOS: resizing refreshes the exact Mason path and leaves redraw untouched', () => {
  const view = iosView()
  const redraw = () => {}

  view._redrawNativeBackground = redraw
  ios.applySmoothClip(view, props)

  const previous = view.style.clipPath

  view.getActualSize = () => ({ width: 240, height: 160 })
  ios.applySmoothClip(view, props)
  assert.notEqual(view.style.clipPath, previous)
  assert.equal(
    view.style.clipPath,
    `path("${commandsToD(generateCommands(240, 160, props.corners))}")`,
  )

  assert.equal(view._redrawNativeBackground, redraw)
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

// ---- Class cascade → clipsChildren seam (issue #204) ----------------------
//
// Authored overflow must always win on a SmoothCorners content host. Browsers
// and the desktop engine rank unlayered rules above every @layer, and the
// native transform flattens layers so equal-specificity classes follow
// registration order. A package stylesheet pinning `overflow` therefore broke
// either authored shape; the visible default instead relies on the platform's
// initial value, so authored classes govern unconditionally.

// Whatever stylesheets the package ships right now — registered after the
// authored sheet so a competing default loses only when it actually
// outranks authored rules (the failure order the issue observed).
const packageSheets = readdirSync(new URL('../src', import.meta.url))
  .filter((name) => name.endsWith('.css'))
  .sort()
  .map((name) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8'))

let sheetSeq = 0

function registerAuthored(css) {
  const id = `smooth-cascade-${sheetSeq++}`

  registerStylesheet(id, css)
  for (const [index, sheet] of packageSheets.entries()) {
    registerStylesheet(`${id}-pkg-${index}`, sheet)
  }
}

function smoothHost(classes, style) {
  const n = {
    id: 'smooth-host',
    type: 'masonview',
    cssType: 'masonview',
    cssClasses: new Set(classes),
    cssPseudoClasses: new Set(),
    parent: null,
    children: [],
    props: { className: classes.join(' '), style },
  }

  n.getChildIndex = (child) => n.children.indexOf(child)
  n.getChildAt = (index) => n.children[index]
  n.getChildrenCount = () => n.children.length
  return n
}

// Mason expands `overflow` into per-axis longhands; engines that keep the
// shorthand feed both axes from the one key, matching style.overflow reads.
function resolvedClip(node) {
  const { style } = computeCascade(node, stylesheetScope())

  return clipsChildren(style.overflowX ?? style.overflow, style.overflowY ?? style.overflow)
}

test('authored classes govern content clipping through the class cascade', () => {
  // Bamboo utilities land inside a named layer — an unlayered package rule
  // outranks them in browsers and the desktop engine alike.
  registerAuthored('@layer utilities { .clip-utility { overflow: hidden } }')
  assert.equal(resolvedClip(smoothHost(['vx-smooth-corners', 'clip-utility'])), true)

  // Equal-specificity unlayered classes resolve by registration order after
  // the native transform flattens layers — package sheets registered last.
  registerAuthored('.clip-plain { overflow: hidden }')
  assert.equal(resolvedClip(smoothHost(['vx-smooth-corners', 'clip-plain'])), true)

  // Explicit authored visible still suppresses the clip.
  registerAuthored('.keep-open { overflow: visible }')
  assert.equal(resolvedClip(smoothHost(['vx-smooth-corners', 'keep-open'])), false)

  // No authored overflow: the platform initial is visible — no clip.
  assert.equal(resolvedClip(smoothHost(['vx-smooth-corners'])), false)

  // An inline style still outranks every class.
  assert.equal(resolvedClip(smoothHost(['vx-smooth-corners'], { overflow: 'hidden' })), true)

  // The resolved flag drives the iOS clip write Mason turns into a mask.
  const view = iosView()

  ios.applySmoothClip(view, props, resolvedClip(smoothHost(['vx-smooth-corners', 'clip-utility'])))
  assert.equal(
    view.style.clipPath,
    `path("${commandsToD(generateCommands(200, 120, props.corners))}")`,
  )
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
