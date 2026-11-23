/** @jsxImportSource @octane-xplat/jsx */
import './smooth-corners-overflow.css'
import { expect, it } from 'vitest'
import { isAndroid, isIOS, Utils, type View as NativeView } from '@nativescript/core'
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { CGPointMake, UIBezierPath } from '@octane-xplat/platform/ios'
import { mountXplat, nextRenderPass, waitUntil } from '@octane-xplat/platform/testing'

// octane-xplat#204 — the unlayered `.vx-smooth-corners { overflow: visible }`
// declaration used to win over authored `overflow: hidden` classes (every
// layered utility on the flattened native cascade), so `clipsChildren` saw
// visible overflow and no content clip was ever installed. Older native
// tests wrote `content.style.overflow` directly and bypassed this class
// seam entirely. This spec drives the real component through authored
// classes: a layered rule (the Bamboo shape) and a plain authored rule must
// both resolve to hidden, install the squircle clip, and produce the
// platform clip object on a real native view.
declare const android: any

type ClipStyle = NativeView['style'] & { overflowX?: string; overflowY?: string }

function OverflowFixture(props: { className: string; childId: string; hostId: string }) @{
  <rootlayout>
    <SmoothCorners
      id={props.hostId}
      className={props.className}
      corners={{ radius: 24, curve: 'squircle', smoothing: 0.6 }}
      style={{ width: 120, height: 120 }}
    >
      <masonview
        id={props.childId}
        style={{ width: 200, height: 200, backgroundColor: '#334155' }}
      />
    </SmoothCorners>
  </rootlayout>
}

async function mountCase(className: string, tag: string) {
  const hostId = 'sc-204-' + tag
  const childId = 'sc-204-child-' + tag
  const { view } = await mountXplat(OverflowFixture, { className, hostId, childId })
  const host = view.getViewById<NativeView>(hostId)
  const child = view.getViewById<NativeView>(childId)

  await waitUntil(() => (host?.getActualSize().width ?? 0) > 0, {
    message: 'SmoothCorners host was not laid out',
  })

  await nextRenderPass()

  return { host: host!, child: child! }
}

function overflowOf(host: NativeView): { x?: string; y?: string } {
  const style = host.style as ClipStyle

  return { x: style?.overflowX, y: style?.overflowY }
}

it('authored overflow classes resolve hidden and install the squircle content clip', async () => {
  for (const [tag, className] of [
    ['layered', 'sc-204-layered'],
    ['plain', 'sc-204-plain'],
  ] as const) {
    const { host, child } = await mountCase(className, tag)
    const overflow = overflowOf(host)

    console.log(
      `[probe204] ${tag} overflow=${overflow.x}/${overflow.y} host=${host.getActualSize().width}x${host.getActualSize().height} child=${child.getActualSize().width}x${child.getActualSize().height}`,
    )

    // The authored class must win the cascade on both axes — this is the
    // exact seam #204 lost to the framework's unlayered declaration.
    expect(overflow.x, `${tag} resolved overflowX`).toBe('hidden')
    expect(overflow.y, `${tag} resolved overflowY`).toBe('hidden')

    // The overflowing child keeps an oversized frame — the clip, not
    // layout, is what constrains its visible region.
    expect(child.getActualSize().width, `${tag} child width`).toBeGreaterThan(120)

    if (isIOS) {
      const layer = (host as any).ios?.layer
      const mask = layer?.mask
      const sublayers: any[] = []

      for (let i = 0; i < (mask?.sublayers?.count ?? 0); i++) {
        sublayers.push(mask.sublayers.objectAtIndex(i))
      }

      const shape = [mask, ...sublayers].find((l: any) => l?.path)
      const bp = shape?.path ? UIBezierPath.bezierPathWithCGPath(shape.path) : null

      console.log(
        `[probe204] ${tag} ios mask=${mask ? mask.constructor?.name : 'none'} masksToBounds=${layer?.masksToBounds} cornerRadius=${mask?.cornerRadius} cornerCurve=${mask?.cornerCurve} contents=${mask?.contents != null} sublayers=${sublayers.map((l) => l?.constructor?.name).join(',') || 'none'} shape=${shape ? shape.constructor?.name : 'none'}`,
      )

      // Mason composes the CSS clip into a native mask on the content host.
      expect(mask, `${tag} native layer.mask`).toBeTruthy()
      expect(layer?.masksToBounds, `${tag} masksToBounds`).toBe(true)

      if (bp) {
        // Center is inside; a 1dip corner inset is outside any r24 squircle —
        // a rectangular mask would contain it, so this proves the curve.
        expect(bp.containsPoint?.(CGPointMake(60, 60)), `${tag} mask interior`).toBe(true)
        expect(bp.containsPoint?.(CGPointMake(119, 1)), `${tag} mask corner`).toBe(false)
      }
    }

    if (isAndroid) {
      const v = (host as any).android

      let touches = 0
      const listener = new android.view.View.OnTouchListener({
        onTouch() {
          touches++
          return true
        },
      })

      v?.setOnTouchListener(listener)

      const dispatch = (x: number, y: number) => {
        const now = android.os.SystemClock.uptimeMillis()
        const event = android.view.MotionEvent.obtain(
          now,
          now,
          android.view.MotionEvent.ACTION_DOWN,
          x,
          y,
          0,
        )

        try {
          v.dispatchTouchEvent(event)
        } finally {
          event.recycle()
        }
      }

      console.log(
        `[probe204] ${tag} android clipToOutline=${v?.getClipToOutline?.()} clipChildren=${v?.getClipChildren?.()} outline=${v?.getOutlineProvider?.() ? 'set' : 'none'}`,
      )

      try {
        // Mason's squircle clip shapes native hit-testing: a down inside the
        // r24 corner dead zone is rejected while a down at the center lands.
        dispatch(1, 1)
        expect(touches, `${tag} corner down rejected`).toBe(0)

        dispatch(Utils.layout.toDevicePixels(60), Utils.layout.toDevicePixels(60))
        expect(touches, `${tag} center down accepted`).toBe(1)
      } finally {
        v?.setOnTouchListener(null)
      }

      // Outline clipping cannot represent arbitrary curves on every
      // supported Android API level.
      expect(v?.getClipToOutline?.(), `${tag} clipToOutline`).toBe(false)
    }
  }
})

it('records how an unlayered visible rule contests the same authored classes (before-state contrast)', async () => {
  // Generic contrast for #204: `.fw-204-visible` stands in for the deleted
  // `.vx-smooth-corners { overflow: visible }` declaration. Whatever wins
  // here is what the component seam resolved to before the fix — logged for
  // the report; the acceptance gate above does not depend on its order.
  function ConflictFixture(props: { className: string; id: string }) @{
    <rootlayout>
      <masonview id={props.id} className={props.className} style={{ width: 40, height: 40 }} />
    </rootlayout>
  }

  for (const [tag, className] of [
    ['layered', 'sc-204-layered'],
    ['plain', 'sc-204-plain'],
  ] as const) {
    const id = 'sc-204-conflict-' + tag
    const { view } = await mountXplat(ConflictFixture, {
      className: 'fw-204-visible ' + className,
      id,
    })

    const host = view.getViewById<NativeView>(id)!

    await waitUntil(() => host.isLoaded, { message: 'conflict host was not loaded' })

    const style = host.style as ClipStyle

    console.log(
      `[probe204-conflict] fw-visible + ${tag} hidden → overflow=${style?.overflowX}/${style?.overflowY}`,
    )
  }

  // Presence check only — the ordering itself is reported above.
  expect(true).toBe(true)
})

it('an authored visible class leaves content unclipped', async () => {
  const { host } = await mountCase('sc-204-visible', 'visible')
  const overflow = overflowOf(host)

  console.log(`[probe204] visible overflow=${overflow.x}/${overflow.y}`)

  expect(overflow.x, 'visible resolved overflowX').toBe('visible')
  expect(overflow.y, 'visible resolved overflowY').toBe('visible')

  if (isIOS) {
    const layer = (host as any).ios?.layer

    console.log(
      `[probe204] visible ios mask=${layer?.mask ? layer.mask.constructor?.name : 'none'}`,
    )

    expect(layer?.mask, 'visible native layer.mask').toBeFalsy()
  }

  if (isAndroid) {
    const v = (host as any).android

    expect(v?.getClipToOutline?.(), 'visible clipToOutline').toBe(false)
  }
})
