/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import { Canvas, type CanvasContextKind, type CanvasReady } from '@octane-xplat/canvas'
import { initialInput } from './Control.tsrx'

const contexts = ['2d', 'webgl', 'webgl2', 'webgpu'] as const

export function Control(props: {
  disposed: () => void
  canvasReady: (kind: CanvasContextKind, ready: CanvasReady) => void
}) @{
  const [count, setCount, getCount] = useState(0)
  useEffect(() => props.disposed, [])

  <masonview
    id="layout"
    width={240}
    horizontalAlignment="left"
    style={{ display: 'flex', flexDirection: 'column' }}
  >
    <button id="action" text="Increment" onTap={() => setCount(getCount() + 1)} />
    <textfield id="input" text={initialInput} />
    <label id="value" text={`initial:${count}`} />
    @for (const kind of contexts; key kind) {
      <Canvas
        id={`canvas-${kind}`}
        context={kind}
        width={40}
        height={20}
        onReady={(ready) => props.canvasReady(kind, ready)}
      />
    }
  </masonview>
}
