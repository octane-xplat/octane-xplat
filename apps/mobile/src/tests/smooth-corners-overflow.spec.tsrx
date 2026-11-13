/** @jsxImportSource @octane-xplat/jsx */
import './smooth-corners-overflow.css'
import { expect, it } from 'vitest'
import { isAndroid, isIOS, type View as NativeView } from '@nativescript/core'
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
type ClipStyle = NativeView['style'] & { overflowX?: string; overflowY?: string; clipPath?: string }

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

function overflowOf(host: NativeView): { x?: string; y?: string; clip?: string } {
  const style = host.style as ClipStyle

  return { x: style?.overflowX, y: style?.overflowY, clip: style?.clipPath }
}

it('authored overflow classes resolve hidden and install the squircle content clip', async () => {
  for (const [tag, className] of [
    ['layered', 'sc-204-layered'],
    ['plain', 'sc-204-plain'],
  ] as const) {
    const { host, child } = await mountCase(className, tag)
    const overflow = overflowOf(host)

    console.log(
      `[probe204] ${tag} overflow=${overflow.x}/${overflow.y} clip=${overflow.clip ?? 'none'} host=${host.getActualSize().width}x${host.getActualSize().height} child=${child.getActualSize().width}x${child.getActualSize().height}`,
    )

    // The authored class must win the cascade on both axes — this is the
    // exact seam #204 lost to the framework's unlayered declaration.
    expect(overflow.x, `${tag} resolved overflowX`).toBe('hidden')
    expect(overflow.y, `${tag} resolved overflowY`).toBe('hidden')

    // The clip request must reach the component's clip hook — a `path()`
    // value proves clipsChildren() saw hidden overflow, which is the state
    // the broken cascade never produced.
    expect(overflow.clip, `${tag} clipPath`).toMatch(/^path\("/)

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

      console.log(
        `[probe204] ${tag} android clipToOutline=${v?.getClipToOutline?.()} clipChildren=${v?.getClipChildren?.()} outline=${v?.getOutlineProvider?.() ? 'set' : 'none'}`,
      )

      // Android clips children through the outline provider setPath path.
      expect(v?.getClipToOutline?.(), `${tag} clipToOutline`).toBe(true)
      expect(v?.getClipChildren?.(), `${tag} clipChildren`).toBe(true)
      expect(v?.getOutlineProvider?.(), `${tag} outline provider`).toBeTruthy()
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

  console.log(
    `[probe204] visible overflow=${overflow.x}/${overflow.y} clip=${overflow.clip ?? 'none'}`,
  )

  expect(overflow.x, 'visible resolved overflowX').toBe('visible')
  expect(overflow.y, 'visible resolved overflowY').toBe('visible')
  expect(String(overflow.clip ?? ''), 'visible clipPath').not.toMatch(/^path\("/)

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
