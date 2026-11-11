/** @jsxImportSource @octane-xplat/jsx */
import { File, knownFolders, Utils } from '@nativescript/core'
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/ui'
import { Button, Text, View, ScrollableArea, TextInput, Slider } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../tools/probe/context'

const state = {
  phase: 'waiting',
  presses: 0,
  dismissals: 0,
  requests: [] as boolean[],
  errors: [] as string[],
  raw: [] as object[],
}

let command: (open: boolean) => void = () => {}
let publish = () => {}

export default function DrawerInputFixture() @{
  const [open, setOpen] = useState(false)

  command = setOpen

  <Drawer
    id="drawer-input"
    open={open}
    onOpenChange={(value) => {
      state.requests.push(value)
      setOpen(value)
      publish()
    }}
    onDismiss={() => {
      state.dismissals++
      publish()
    }}
    onError={(error) => {
      state.errors.push(String(error))
      publish()
    }}
    style={{ height: 600, width: 350 }}
    main={
      <View style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
        <Button
          id="drawer-open"
          label="Open navigation"
          style={{ height: 160 }}
          onPress={() => setOpen(true)}
        />
        <ScrollableArea id="drawer-scroll" axis="block" style={{ height: 440 }}>
          <View style={{ height: 2000, display: 'flex', flexDirection: 'column' }}>
            @for (const item of Array.from({ length: 40 }, (_, i) => i); key item) {
              <Text style={{ height: 50 }}>Row {item}</Text>
            }
          </View>
        </ScrollableArea>
      </View>
    }
    drawer={
      <View style={{ display: 'flex', flexDirection: 'column' }}>
        <Button
          id="drawer-button"
          label="Keep draft"
          style={{ height: 160 }}
          onPress={() => {
            state.presses++
            publish()
          }}
        />
        <TextInput id="drawer-text" label="Drawer notes" />
        <Slider id="drawer-slider" label="Drawer value" defaultValue={25} />
        <Button id="drawer-close" label="Close navigation" onPress={() => setOpen(false)} />
      </View>
    }
  />
}

export async function run(ctx: ProbeContext) {
  const root = await ctx.waitFor(() => ctx.find('drawer-input'))
  const panel = await ctx.waitFor(() => ctx.find('drawer-input-panel'))
  const button = await ctx.waitFor(() => ctx.find('drawer-button'))
  const scroll = await ctx.waitFor(() => ctx.find('drawer-scroll'))
  const slider = await ctx.waitFor(() => ctx.find('drawer-slider'))
  const text = await ctx.waitFor(() => ctx.find('drawer-text'))

  await ctx.waitFor(() => root.getActualSize().width > 100 && panel.getActualSize().width > 100)

  const raw = (event: { action: string }) => {
    state.raw.push({ action: event.action, at: Date.now(), policy: root.style.touchAction })
    if (state.raw.length > 40) {
      state.raw.shift()
    }
  }

  root.on('touch', raw)
  ctx.onCleanup(() => root.off('touch', raw))

  const file = File.fromPath(knownFolders.documents().path + '/drawer-input.json')
  const snapshots: object[] = []
  const snapshot = (raw = true) => ({
    ...state,
    raw: raw ? state.raw : undefined,
    requests: [...state.requests],
    errors: [...state.errors],
    x: panel.translateX,
    visibility: panel.visibility,
    width: panel.getActualSize().width,
    root: root.getLocationOnScreen(),
    button: button.getLocationOnScreen(),
    buttonSize: button.getActualSize(),
    scroll: scroll.scrollTop,
    viewport: scroll.getLocationOnScreen(),
    viewportSize: scroll.getActualSize(),
    slider: slider.getLocationOnScreen(),
    sliderSize: slider.getActualSize(),
    text: text.getLocationOnScreen(),
    textSize: text.getActualSize(),
    density: Utils.layout.getDisplayDensity(),
    at: Date.now(),
  })

  publish = () => file.writeTextSync(JSON.stringify(snapshot()))

  const timer = setInterval(() => {
    publish()
    snapshots.push(snapshot(false))
    if (snapshots.length > 600) {
      snapshots.shift()
    }
  }, 30)

  ctx.onCleanup(() => {
    clearInterval(timer)
    publish = () => {}
  })

  await ctx.waitFor(() => scroll.scrollHeight > scroll.clientHeight)
  scroll.scrollTo({ top: 600, behavior: 'instant' })
  await ctx.waitFor(() => Math.abs(scroll.scrollTop - 600) < 1)
  state.phase = 'scroll-before'
  publish()
  await ctx.waitFor(() => Math.abs(scroll.scrollTop - 600) > 30, { timeout: 60000 })
  ctx.assert('native vertical scrolling before Drawer claim', Math.abs(scroll.scrollTop - 600) > 30)
  state.phase = 'edge'
  publish()
  await ctx.waitFor(() => state.requests.includes(true), { timeout: 120000 })
  await ctx.waitFor(() => panel.translateX === 0)
  ctx.assert('edge-open reached measured endpoint', panel.translateX, 0)
  state.phase = 'nested-drag'
  publish()
  await ctx.waitFor(() => state.requests.includes(false), { timeout: 120000 })
  ctx.assert('drag from nested button suppresses activation', state.presses, 0)
  command(true)
  await ctx.waitFor(() => panel.translateX === 0)
  state.phase = 'fresh-tap'
  publish()
  await ctx.waitFor(() => state.presses === 1, { timeout: 120000 })
  ctx.assert('fresh independent button tap works', state.presses, 1)
  // Programmatic command replacement must invalidate a previous settle.
  command(false)
  await new Promise((resolve) => setTimeout(resolve, 70))
  command(true)
  await ctx.waitFor(() => panel.translateX === 0)
  ctx.assert('interrupted close settles back open', panel.translateX, 0)
  ctx.assert('no animation errors', state.errors.length, 0)
  command(false)
  await ctx.waitFor(() => panel.visibility === 'hidden')

  const before = scroll.scrollTop

  state.phase = 'scroll-after'
  publish()
  await ctx.waitFor(() => Math.abs(scroll.scrollTop - before) > 30, { timeout: 60000 })
  ctx.assert(
    'native vertical scrolling restored after close',
    Math.abs(scroll.scrollTop - before) > 30,
  )

  scroll.scrollTo({ top: 600, behavior: 'instant' })
  await new Promise((resolve) => setTimeout(resolve, 300))

  const requests = state.requests.length

  state.phase = 'scroll-edge'
  publish()
  await ctx.waitFor(() => state.requests.length > requests && state.requests.at(-1) === true, {
    timeout: 60000,
  })

  ctx.assert('closed edge opens over native scroll content', state.requests.at(-1), true)
  if (ctx.target === 'android') {
    const dismissals = state.dismissals

    state.phase = 'back'
    publish()
    await ctx.waitFor(() => state.dismissals > dismissals, { timeout: 60000 })
    ctx.assert('OS Back dismisses exactly once', state.dismissals, dismissals + 1)
    await ctx.waitFor(() => panel.visibility === 'hidden')
  }

  ctx.record('snapshots', snapshots)
  state.phase = 'done'
  publish()
}
