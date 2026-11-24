import { Application, Button, GridLayout, Label, Page, TextField } from '@nativescript/core'
// oxlint-disable-next-line xplat/no-ns-deep-import -- Exercise the root/subpath constructor identity regression in this fixture.
import { Button as DeepButton } from '@nativescript/core/ui/button'
import { getGPU, type CanvasContextKind, type CanvasReady } from '@octane-xplat/canvas'
import { View as MasonView } from '@octane-xplat/nativescript-masonkit'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { Control } from './Control.tsrx'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const page = new Page()
const host = new GridLayout()
page.content = host
let disposed = 0
const canvases = new Map<CanvasContextKind, CanvasReady>()
const root = renderNativeScriptApp(host, Control, {
  disposed: () => disposed++,
  canvasReady: (kind: CanvasContextKind, ready: CanvasReady) => canvases.set(kind, ready),
})
const entry = { create: () => page }

if (Application.started) {
  Application.resetRootView(entry)
} else {
  Application.run(entry)
}

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 30))

function check2D(context: CanvasReady['context'], color: string, rgba: string) {
  context.fillStyle = color
  context.fillRect(0, 0, 4, 4)
  check(context.getImageData(0, 0, 1, 1).data.join(',') === rgba, '2D readback failed')
}

async function checkCanvases(deadline: number) {
  while (canvases.size < 4 && Date.now() < deadline) {
    await delay()
  }
  for (const kind of ['2d', 'webgl', 'webgl2', 'webgpu'] as const) {
    const ready = canvases.get(kind)
    check(ready?.context, `Missing ${kind} Canvas context`)
    const { canvas, context } = ready
    check(Math.abs(canvas.getActualSize().width - 40) < 1, 'Canvas layout width is not 40 DIP')
    if (kind === '2d') {
      check2D(context, '#ff0000', '255,0,0,255')
    } else if (kind === 'webgpu') {
      const gpu = getGPU()
      const adapter = await gpu.requestAdapter()
      check(adapter, 'No Windows WebGPU adapter')
      const device = await adapter.requestDevice()
      try {
        context.configure({ device, format: gpu.getPreferredCanvasFormat() })
        const encoder = device.createCommandEncoder()
        encoder
          .beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0, g: 0, b: 1, a: 1 },
              },
            ],
          })
          .end()
        device.queue.submit([encoder.finish()])
        await device.queue.onSubmittedWorkDone()
      } finally {
        context.unconfigure()
        device.destroy()
      }
    } else {
      context.clearColor(0, 1, 0, 1)
      context.clear(context.COLOR_BUFFER_BIT)
      const pixel = new Uint8Array(4)
      context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel)
      check(pixel.join(',') === '0,255,0,255', `${kind} readback failed`)
    }
  }
  console.log('WINDOWS_CANVAS_PASS')
}

async function run() {
  const deadline = Date.now() + 20_000
  const layout = page.getViewById('layout')
  const action = page.getViewById('action')
  const input = page.getViewById('input')
  const value = page.getViewById('value')
  check(Button === DeepButton && action instanceof Button, 'Core constructor identity split')
  check(input instanceof TextField && input.text === 'Editable', 'Missing Core TextField')
  check(layout instanceof MasonView && value instanceof Label, 'Missing Mason or Core Label')
  while ((!page.isLoaded || action.getActualSize().width <= 0) && Date.now() < deadline) {
    await delay()
  }
  const width = layout.getActualSize().width
  const loaded = page.isLoaded
  console.log(`WINDOWS_CORE_LAYOUT width=${width} loaded=${loaded}`)
  const peer = action.nativeViewProtected
  check(peer && input.nativeViewProtected, 'Missing WinUI control peers')
  await checkCanvases(deadline)

  action.notify({ eventName: Button.tapEvent, object: action })
  await delay()
  check(value.text === 'initial:1', 'Core event did not update the Octane tree')
  console.log('WINDOWS_CORE_READY')

  let activeAction = action
  if (import.meta.hot) {
    let updatedValue = page.getViewById('value')
    while (
      !(updatedValue instanceof Label && updatedValue.text === 'updated:1') &&
      Date.now() < deadline + 30_000
    ) {
      await delay()
      updatedValue = page.getViewById('value')
    }
    check(
      updatedValue instanceof Label && updatedValue.text === 'updated:1',
      'Hot edit did not preserve component state',
    )
    check(Application.getRootView() === page, 'Hot edit replaced the host Page')
    const button = page.getViewById('action')
    check(button instanceof Button && button.nativeViewProtected, 'Missing WinUI peer after edit')
    activeAction = button
    activeAction.notify({ eventName: Button.tapEvent, object: activeAction })
    await delay()
    check(String(updatedValue.text) === 'updated:2', 'Hot edit changed tap delivery')
    const canvas = page.getViewById('canvas-2d')
    check(canvas?.nativeViewProtected, 'Hot edit detached the Canvas peer')
    const ready = canvases.get('2d')
    check(ready && ready.canvas === canvas, 'Hot edit lost the Canvas view')
    const canvasDeadline = Date.now() + 5000
    let context = ready.canvas.getContext('2d')
    while (!context && Date.now() < canvasDeadline) {
      await delay()
      context = ready.canvas.getContext('2d')
    }
    check(context, 'Hot edit lost the 2D context')
    check2D(context, '#0000ff', '0,0,255,255')
    console.log('WINDOWS_CANVAS_HOT')
    console.log(
      `WINDOWS_CORE_HOT sameView=${activeAction === action} samePeer=${activeAction.nativeViewProtected === peer}`,
    )
  }

  const disposalsBeforeUnmount = disposed
  root.unmount()
  await delay()
  check(disposed === disposalsBeforeUnmount + 1, 'Octane did not dispose the live effect')
  // The driver detaches the subtree as a unit. Its internal parent links may survive.
  check(
    host.getChildrenCount() === 0 && !layout.parent,
    'Octane did not detach the Mason subtree from its Core host',
  )
  check(
    !action.hasListeners(Button.tapEvent) && !activeAction.hasListeners(Button.tapEvent),
    'Unmount retained a Core tap listener',
  )
  console.log('WINDOWS_CORE_TEARDOWN')
  check(
    loaded && Math.abs(width - 240) < 1,
    `Expected a 240 DIP Mason layout; measured ${width}, page loaded ${loaded}`,
  )
  console.log('WINDOWS_CORE_PASS')
}

import.meta.hot?.dispose(() => root.unmount())
void run().catch((error) => console.error('WINDOWS_CORE_FAIL', error.stack ?? String(error)))
