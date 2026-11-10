/** @jsxImportSource @octane-xplat/jsx */
import { Slider, View, usePanGesture$ } from '@octane-xplat/ui'
import { postToPid } from '../../../../tools/probe/appkit-input'
import type { ProbeContext } from '../../../../tools/probe/context'

const state = { value: 50, changes: 0, parentStarts: 0 }

export default function Fixture() {
  const pan = usePanGesture$({
    axis: 'x',
    activation: { distance: 1 },
    onStart: () => state.parentStarts++,
  })

  return (
    <View gestures={pan} style={{ width: 400, height: 300 }}>
      <Slider
        id="gesture-volume"
        label="Volume"
        defaultValue={50}
        min={0}
        max={100}
        step={1}
        onValueChange={(value) => {
          if (typeof value === 'number') {
            state.value = value
            state.changes++
          }
        }}
      />
    </View>
  )
}

export async function run(ctx: ProbeContext) {
  const thumb = await ctx.waitFor(() => ctx.find('gesture-volume-thumb'))

  await ctx.waitFor(() => thumb.window && thumb.bounds.size.width > 0)

  const center = thumb.convertPointToView(
    {
      x: thumb.bounds.origin.x + thumb.bounds.size.width / 2,
      y: thumb.bounds.origin.y + thumb.bounds.size.height / 2,
    },
    null,
  )

  let sequence = 0
  const post = (type: number, x: number) =>
    postToPid(
      NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
        type,
        { x, y: center.y },
        0,
        NSProcessInfo.processInfo.systemUptime,
        thumb.window.windowNumber,
        null,
        ++sequence,
        1,
        1,
      ).CGEvent,
    )

  post(1, center.x)
  await new Promise((resolve) => setTimeout(resolve, 40))
  for (let step = 1; step <= 20; step++) {
    post(6, center.x + step * 2)
    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  post(2, center.x + 40)
  await ctx.waitFor(() => state.changes > 0, { timeout: 5000 })
  ctx.assert('adjustable thumb drag changes the slider', state.value > 50, true)
  ctx.assert('ancestor drag never claims the slider', state.parentStarts, 0)
  ctx.record('state', state)
  ctx.record(
    'evidence',
    'Window-targeted native mouse events posted through the OS queue; no keyboard or screen-reader qualification.',
  )
}
