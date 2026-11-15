// Engine demo orchestration. All async work lives here — the universal
// compiler rejects async functions inside .tsrx, so EngineDemo.tsrx calls
// these entry points and receives status strings back through `report`.
import type { CanvasReady } from '@octane-xplat/canvas'
import { readModelBytes } from './model'
import { createPixiEngine } from './pixi-engine'
import { createPlayCanvasEngine } from './playcanvas-engine'
import type { EngineAdapter } from './types'

export type EngineSlot = 'playcanvas' | 'pixi3d'

const GL_ATTRIBUTES = { antialias: false, alpha: false, preserveDrawingBuffer: true }
const ROTATE_STEP = Math.PI / 6
const TAG = '[engine-demo]'

interface SlotState {
  adapter?: EngineAdapter
  modelLoaded: boolean
}

const slots: Record<EngineSlot, SlotState> = {
  playcanvas: { modelLoaded: false },
  pixi3d: { modelLoaded: false },
}

let report: (slot: EngineSlot, status: string) => void = () => {}
let modelBytes: Promise<ArrayBuffer> | undefined
let taps = 0

export function setEngineReporter(fn: (slot: EngineSlot, status: string) => void) {
  report = (slot, status) => {
    console.log(`${TAG} ${slot} ${status}`)
    fn(slot, status)
  }
}

function message(error: unknown): string {
  return (error as Error)?.message ?? String(error)
}

function bytes(): Promise<ArrayBuffer> {
  modelBytes ??= readModelBytes().then((buffer) => {
    console.log(`${TAG} model bytes: ${buffer.byteLength}`)
    return buffer
  })
  return modelBytes
}

/** Called from each Canvas' onReady. Opens webgl2 on the canvas itself so
 *  the same context attributes apply on web and the plugin on native. */
export function attachCanvas(slot: EngineSlot, ready: CanvasReady) {
  const state = slots[slot]
  if (state.adapter) {
    return
  }
  const adapter = slot === 'playcanvas' ? createPlayCanvasEngine() : createPixiEngine()
  state.adapter = adapter
  const canvas = ready.canvas as { getContext?: (kind: string, attrs?: unknown) => WebGL2RenderingContext | null }
  const gl = canvas.getContext?.('webgl2', GL_ATTRIBUTES)
  if (!gl) {
    report(slot, 'webgl2 unavailable')
    return
  }
  const width = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight
  report(slot, `gl ok ${width}x${height}`)
  Promise.resolve()
    .then(() => adapter.init(canvas, gl, width, height))
    .then(() => {
      report(slot, 'init ok, loading model')
      return bytes().then((data) => adapter.loadModel(data))
    })
    .then(() => {
      state.modelLoaded = true
      // A few frames so texture uploads settle before the status pixel read.
      for (let i = 0; i < 5; i++) {
        adapter.frame(1 / 60)
      }
      report(slot, `loaded | ${adapter.stats()}`)
    })
    .catch((error) => {
      console.log(`${TAG} ${slot} error: ${(error as Error)?.stack ?? error}`)
      report(slot, `error: ${message(error)}`)
    })
}

/** Tap target: rotate both loaded models a fixed step and render one frame
 *  each. Returns the tap counter for the status line. */
export function rotateEngines(): number {
  taps++
  console.log(`${TAG} tap ${taps}`)
  for (const slot of Object.keys(slots) as EngineSlot[]) {
    const { adapter, modelLoaded } = slots[slot]
    if (!adapter || !modelLoaded) {
      report(slot, `tap ${taps} | not loaded`)
      continue
    }
    try {
      adapter.rotate(ROTATE_STEP)
      adapter.frame(1 / 60)
      report(slot, `tap ${taps} | ${adapter.stats()}`)
    } catch (error) {
      report(slot, `tap ${taps} | error: ${message(error)}`)
    }
  }
  return taps
}
