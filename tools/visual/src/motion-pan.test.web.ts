import { expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { attachPan } from '../../../packages/motion/src/pan.web'

type PointerStep = { type: 'move'; x: number; y: number } | { type: 'down' } | { type: 'up' }

// Trusted OS-level pointer input via the realPointer browser command (see
// vitest.config.ts). Points are in the test iframe's viewport coordinates.
const realPointer = (steps: PointerStep[]) =>
  (commands as unknown as { realPointer(steps: PointerStep[]): Promise<void> }).realPointer(steps)

// Host pinned at iframe coords (100,100)–(220,220); the nested button covers
// its top-left 40px so drags can start clear of it and release on top of it.
const panRig = (axis: true | 'x' | 'y' = true) => {
  const host = document.createElement('div')
  const button = document.createElement('button')

  host.style.cssText = 'position:fixed;left:100px;top:100px;width:120px;height:120px'
  button.style.cssText = 'position:absolute;left:0;top:0;width:40px;height:40px'
  button.textContent = 'nested'
  host.append(button)
  document.body.append(host)

  const calls: string[] = []
  let pointerId = -1
  let cancelled = false
  const off = attachPan(host, axis, {
    start: (event: PointerEvent) => {
      calls.push('start')
      pointerId = event.pointerId
    },
    move: () => calls.push('move'),
    end: (_event: PointerEvent, info: { cancelled: boolean }) => {
      calls.push('end')
      cancelled = info.cancelled
    },
  })

  return {
    host,
    button,
    calls,
    off,
    get pointerId() {
      return pointerId
    },
    get cancelled() {
      return cancelled
    },
  }
}

it('preserves real nested button and input clicks before the drag threshold', async () => {
  const host = document.createElement('div')
  const button = document.createElement('button')
  const input = document.createElement('input')

  button.textContent = 'Nested motion action'
  host.append(button, input)
  document.body.append(host)

  let clicks = 0
  let starts = 0

  button.addEventListener('click', () => clicks++)

  const off = attachPan(host, true, {
    start: () => starts++,
    move() {},
    end() {},
  })

  try {
    await userEvent.click(button)
    expect(clicks).toBe(1)
    await userEvent.click(input)
    expect(document.activeElement).toBe(input)
    expect(starts).toBe(0)
  } finally {
    off()
    host.remove()
  }
})

it('defers capture until the 8px threshold and releases it at pointerup', async () => {
  const rig = panRig()

  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 164, y: 160 },
    ])

    expect(rig.calls).toEqual([])

    await realPointer([{ type: 'move', x: 176, y: 160 }])
    expect(rig.calls).toEqual(['start', 'move'])
    expect(rig.pointerId).not.toBe(-1)
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(true)

    await realPointer([{ type: 'move', x: 190, y: 160 }])
    expect(rig.calls).toEqual(['start', 'move', 'move'])

    await realPointer([{ type: 'up' }])
    expect(rig.calls).toEqual(['start', 'move', 'move', 'end'])
    expect(rig.cancelled).toBe(false)
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(false)
  } finally {
    rig.off()
    rig.host.remove()
  }
})

it('keeps tracking a drag that exits the host bounds', async () => {
  const rig = panRig()

  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 60, y: 160 },
    ])

    expect(rig.calls).toEqual(['start', 'move'])
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(true)

    await realPointer([{ type: 'move', x: 40, y: 160 }])
    expect(rig.calls).toEqual(['start', 'move', 'move'])

    await realPointer([{ type: 'up' }])
    expect(rig.calls).toEqual(['start', 'move', 'move', 'end'])
    expect(rig.cancelled).toBe(false)
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(false)
  } finally {
    rig.off()
    rig.host.remove()
  }
})

it('ends an active drag as cancelled on pointercancel and releases capture', async () => {
  const rig = panRig()

  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 176, y: 160 },
    ])

    expect(rig.calls).toEqual(['start', 'move'])
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(true)

    // Real cancellation sources (touch scroll, OS gestures) are not available
    // to a headless mouse; dispatching pointercancel at the capture element —
    // where the browser would deliver it — drives the same handler against the
    // genuinely captured pointer.
    rig.host.dispatchEvent(
      new PointerEvent('pointercancel', { pointerId: rig.pointerId, bubbles: true }),
    )

    expect(rig.calls).toEqual(['start', 'move', 'end'])
    expect(rig.cancelled).toBe(true)
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(false)
  } finally {
    rig.off()
    rig.host.remove()
  }
})

it('releases capture when the pan detaches mid-drag', async () => {
  const rig = panRig()

  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 176, y: 160 },
    ])

    expect(rig.calls).toEqual(['start', 'move'])
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(true)

    rig.off()
    expect(rig.host.hasPointerCapture(rig.pointerId)).toBe(false)
  } finally {
    rig.off()
    rig.host.remove()
  }
})

it.each([110, 210])(
  'suppresses the drag-tail click starting at %i and recovers',
  async (origin) => {
    const rig = panRig()
    let buttonClicks = 0
    let hostClicks = 0

    rig.button.addEventListener('click', () => buttonClicks++)
    rig.host.addEventListener('click', () => hostClicks++)
    try {
      // Start on the nested button or host, cross slop, and return to the button.
      await realPointer([
        { type: 'move', x: origin, y: origin },
        { type: 'down' },
        { type: 'move', x: 180, y: 180 },
        { type: 'move', x: 110, y: 110 },
        { type: 'up' },
      ])

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(rig.calls).toEqual(['start', 'move', 'move', 'end'])
      expect(buttonClicks).toBe(0)
      // Capture retargets the tail to the host; neither action should run.
      expect(hostClicks).toBe(0)

      rig.button.focus()
      await userEvent.keyboard('{Enter}')
      expect(buttonClicks).toBe(1)
      await userEvent.click(rig.button)
      expect(buttonClicks).toBe(2)
      expect(hostClicks).toBe(2)
    } finally {
      rig.off()
      rig.host.remove()
    }
  },
)

it('abandons an off-axis press on a single-axis host and resets cleanly', async () => {
  const rig = panRig('x')
  let buttonClicks = 0

  rig.button.addEventListener('click', () => buttonClicks++)
  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 160, y: 180 },
      { type: 'move', x: 180, y: 180 },
      { type: 'up' },
    ])

    // The vertical exit abandons the gesture before activation: no start, no
    // end, and the rest of the press is ignored.
    expect(rig.calls).toEqual([])

    await userEvent.click(rig.button)
    expect(buttonClicks).toBe(1)

    // A later in-axis press activates normally.
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 180, y: 160 },
      { type: 'up' },
    ])

    expect(rig.calls).toEqual(['start', 'move', 'end'])
    expect(rig.cancelled).toBe(false)
  } finally {
    rig.off()
    rig.host.remove()
  }
})

it('keeps a real nested tap below slop after a cancelled drag', async () => {
  const rig = panRig()
  let clicks = 0

  rig.button.addEventListener('click', () => clicks++)
  try {
    await realPointer([
      { type: 'move', x: 160, y: 160 },
      { type: 'down' },
      { type: 'move', x: 180, y: 160 },
    ])

    rig.host.dispatchEvent(
      new PointerEvent('pointercancel', {
        pointerId: rig.pointerId,
        bubbles: true,
      }),
    )

    await realPointer([{ type: 'up' }])
    expect(rig.calls).toEqual(['start', 'move', 'end'])
    expect(rig.cancelled).toBe(true)
    await realPointer([
      { type: 'move', x: 110, y: 110 },
      { type: 'down' },
      { type: 'move', x: 114, y: 110 },
      { type: 'up' },
    ])

    expect(clicks).toBe(1)
    expect(rig.calls).toEqual(['start', 'move', 'end'])
  } finally {
    rig.off()
    rig.host.remove()
  }
})
