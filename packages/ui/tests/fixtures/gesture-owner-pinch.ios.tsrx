/** @jsxImportSource @octane-xplat/jsx */
import { File, knownFolders, Utils } from '@nativescript/core'
import { View, Text, usePanGesture$, usePinchGesture$, compete } from '@octane-xplat/ui'
import type { PinchGesture } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../tools/probe/context'

const state = {
  panStarts: 0,
  panCancels: 0,
  panEnds: 0,
  panCancelReason: '',
  pinchStarts: 0,
  updates: 0,
  ends: 0,
  cancels: 0,
  scale: 1,
  maxPointers: 0,
  finalCount: -1,
}

let publish = () => {}
let pinchHandle: PinchGesture | null = null

export default function Fixture() {
  const pan = usePanGesture$({
    axis: 'y',
    onStart() {
      state.panStarts++
      publish()
    },
    onCancel(_sample, reason) {
      state.panCancels++
      state.panCancelReason = reason
      publish()
    },
    onEnd() {
      state.panEnds++
      publish()
    },
  })

  const pinch = usePinchGesture$({
    onStart() {
      state.pinchStarts++
      publish()
    },
    onUpdate(sample) {
      state.updates++
      state.scale = sample.scale
      state.maxPointers = Math.max(state.maxPointers, sample.pointerCount)
      publish()
    },
    onEnd(sample) {
      state.ends++
      state.scale = sample.scale
      state.finalCount = sample.pointerCount
      publish()
    },
    onCancel() {
      state.cancels++
      publish()
    },
  })

  pinchHandle = pinch
  return (
    <View style={{ height: 700, width: 400 }}>
      <View id="gesture-panel" gestures={compete(pinch, pan)} style={{ height: 500, width: 400 }}>
        <Text>Pinch surface</Text>
      </View>
    </View>
  )
}

export async function run(ctx: ProbeContext) {
  const panel = await ctx.waitFor(() => ctx.find('gesture-panel'))

  await ctx.waitFor(
    () =>
      panel.nativeViewProtected?.window &&
      panel.getActualSize().width > 200 &&
      panel.getActualSize().height > 200,
  )

  const report = File.fromPath(knownFolders.documents().path + '/gesture-owner-pinch.json')

  publish = () =>
    report.writeTextSync(JSON.stringify({ task: 'gesture-ownership', phase: 'running', ...state }))

  report.writeTextSync(
    JSON.stringify({
      task: 'gesture-ownership',
      phase: 'ready',
      at: panel.getLocationOnScreen(),
      size: panel.getActualSize(),
    }),
  )

  await ctx.waitFor(() => state.ends + state.cancels > 0, { timeout: 60000, interval: 50 })
  await ctx.waitFor(() => pinchHandle!.pointerCount$.get() === 0, { timeout: 5000, interval: 20 })
  ctx.record('state', state)
  ctx.assert('one claimed native pinch', state.pinchStarts, 1)
  ctx.assert('one successful pinch release', state.ends, 1)
  ctx.assert('no pinch cancellation', state.cancels, 0)
  ctx.assert('two real concurrent pointers observed', state.maxPointers, 2)
  ctx.assert('cumulative scale increased', state.scale > 1.5, true)
  ctx.assert('dismiss pan never claimed', state.panStarts, 0)
  ctx.assert('no down contacts after final lift', pinchHandle!.pointerCount$.get(), 0)
}
