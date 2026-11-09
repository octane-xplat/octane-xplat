/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { View } from '../../../packages/ui/src/components/layout/View.web.tsrx'
import type { PanEvent } from '../../../packages/ui/src/props'

type Step = { type: 'move'; x: number; y: number } | { type: 'down' } | { type: 'up' }
const input = (steps: Step[]) =>
  (commands as unknown as { realPointer(steps: Step[]): Promise<void> }).realPointer(steps)

function rig(nested = false) {
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  const outer: PanEvent[] = [],
    inner: PanEvent[] = []

  const record = (event: PanEvent) => outer.push(event)
  const recordInner = (event: PanEvent) => inner.push(event)
  let clicks = 0

  act(() =>
    root.render(
      <View
        onPan={record}
        style={{ position: 'fixed', left: 100, top: 100, width: 200, height: 200 }}
      >
        <View onPan={nested ? recordInner : undefined} style={{ width: 200, height: 200 }}>
          <button onClick={() => clicks++} style={{ width: 40, height: 40 }}>
            Tap
          </button>
        </View>
      </View>,
    ),
  )

  const host = container.firstElementChild as HTMLElement
  let pointer = -1

  host.addEventListener('pointerdown', (e) => {
    pointer = e.pointerId
  })

  return {
    host,
    outer,
    inner,
    get pointer() {
      return pointer
    },
    get clicks() {
      return clicks
    },
    close() {
      act(() => root.unmount())
      container.remove()
    },
  }
}

it('keeps real nested taps and delayed capture, then ends a captured drag once', async () => {
  const r = rig()

  try {
    await userEvent.click(r.host.querySelector('button')!)
    expect(r.clicks).toBe(1)
    r.outer.length = 0
    await input([
      { type: 'move', x: 180, y: 180 },
      { type: 'down' },
      { type: 'move', x: 184, y: 180 },
    ])

    expect(r.host.hasPointerCapture(r.pointer)).toBe(false)
    await input([{ type: 'move', x: 210, y: 180 }])
    expect(r.host.hasPointerCapture(r.pointer)).toBe(true)
    await input([{ type: 'up' }])
    expect(r.outer.map((e) => e.state)).toEqual(['began', 'moved', 'moved', 'ended'])
    expect(r.outer.at(-1)?.dx).toBe(30)
  } finally {
    await input([{ type: 'up' }])
    r.close()
  }
})

it.each([false, true])(
  'cancels nested pending capture takeover (next move: %s)',
  async (nextMove) => {
    const r = rig(true)

    try {
      await input([
        { type: 'move', x: 180, y: 180 },
        { type: 'down' },
        { type: 'move', x: 210, y: 180 },
      ])

      // Document listeners run inner first, then outer. Outer capture replaces
      // inner's pending capture; the next input delivers browser capture events.
      if (nextMove) {
        await input([{ type: 'move', x: 220, y: 180 }])
      }

      expect(r.host.hasPointerCapture(r.pointer)).toBe(true)
      await input([{ type: 'up' }])
      expect(r.inner.map((e) => e.state)).toEqual(['began', 'moved', 'cancelled'])
      expect(r.outer.map((e) => e.state)).toEqual(
        nextMove ? ['began', 'moved', 'moved', 'ended'] : ['began', 'moved', 'ended'],
      )
    } finally {
      await input([{ type: 'up' }])
      r.close()
    }
  },
)

it('cancels browser capture theft once and permits the next interaction', async () => {
  const r = rig()
  const thief = document.createElement('div')

  document.body.append(thief)
  try {
    await input([
      { type: 'move', x: 180, y: 180 },
      { type: 'down' },
      { type: 'move', x: 210, y: 180 },
      { type: 'move', x: 220, y: 180 },
    ])

    expect(r.host.hasPointerCapture(r.pointer)).toBe(true)
    thief.setPointerCapture(r.pointer)
    await input([{ type: 'move', x: 230, y: 180 }, { type: 'up' }])
    expect(r.outer.map((e) => e.state)).toEqual(['began', 'moved', 'moved', 'cancelled'])
    await userEvent.click(r.host.querySelector('button')!)
    expect(r.clicks).toBe(1)
    expect(r.outer.slice(-2).map((e) => e.state)).toEqual(['began', 'ended'])
  } finally {
    await input([{ type: 'up' }])
    r.close()
    thief.remove()
  }
})
