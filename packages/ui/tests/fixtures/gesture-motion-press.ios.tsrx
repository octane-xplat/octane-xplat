/** @jsxImportSource @octane-xplat/jsx */
import { motion } from '@octane-xplat/motion'
import { useState } from 'octane'
import { File, knownFolders, Utils } from '@nativescript/core'
import { Text, Pressable } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../tools/probe/context'

const state = {
  task: 'gesture-ownership',
  phase: 'waiting',
  draft: 'unsaved',
  presses: 0,
  starts: 0,
  ends: 0,
  ins: 0,
  outs: 0,
  x: 0,
  source: '',
  pointer: false,
  callbacksUpdated: 0,
}

let publishState = () => {}

export default function NativePressFixture() {
  const [tick, setTick] = useState(0)

  return (
    <motion.View
      id="press-panel"
      style={{ height: 600, width: 350 }}
      drag="x"
      dragMomentum={false}
      onDragStart={() => {
        state.starts++
      }}
      onDrag={(_event, info) => {
        state.x = info.offset.x
        state.callbacksUpdated++
        setTick(tick + 1)
        publishState()
      }}
      onDragEnd={(_event, info) => {
        if (!info.cancelled) {
          state.ends++
        }

        publishState()
      }}
    >
      <Pressable
        id="press-button"
        accessibilityLabel="Close draft"
        style={{ height: 200, width: 350 }}
        onPress={(event) => {
          state.presses++
          state.draft = ''
          state.source = event.source
          state.pointer = event.pointer !== null
          publishState()
        }}
        onPressIn={() => {
          state.ins++
        }}
        onPressOut={() => {
          state.outs++
        }}
      >
        <Text>Unsaved draft</Text>
      </Pressable>
    </motion.View>
  )
}

export async function run(ctx: ProbeContext) {
  const panel = await ctx.waitFor(() => ctx.find('press-panel'))
  const button = await ctx.waitFor(() => ctx.find('press-button'))

  await ctx.waitFor(() => button.getActualSize().width > 100)
  Object.assign(state, {
    task: 'gesture-ownership',
    phase: 'ready',
    draft: 'unsaved',
    presses: 0,
    starts: 0,
    ends: 0,
    ins: 0,
    outs: 0,
    x: 0,
    source: '',
    pointer: false,
    callbacksUpdated: 0,
  })

  const file = File.fromPath(knownFolders.documents().path + '/gesture-native-press.json')
  const publish = () =>
    file.writeTextSync(
      JSON.stringify({
        ...state,
        at: button.getLocationOnScreen(),
        size: button.getActualSize(),
        createdAt: Date.now(),
        density: 1,
      }),
    )

  publishState = publish
  publish()
  await ctx.waitFor(() => state.ends === 1, { timeout: 60000, interval: 50 })
  await new Promise((resolve) => setTimeout(resolve, 500))
  ctx.assert('moving header OS swipe retains draft', state.draft, 'unsaved')
  ctx.assert('no trailing pointer activation', state.presses, 0)
  state.phase = 'after-swipe'
  publish()
  await ctx.waitFor(() => state.presses === 1, { timeout: 15000, interval: 50 })
  ctx.assert('next independent tap closes draft', state.draft, '')
  ctx.assert('semantic pointer coordinates available', state.pointer, true)
  ctx.assert('balanced pointer lifecycle', state.ins, state.outs)
  ctx.record('state', state)
}
