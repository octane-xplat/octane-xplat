/** @jsxImportSource @octane-xplat/jsx */
import { NativeCanvas } from './native/NativeCanvas.tsrx'
import { getGPU } from './gpu.windows'
import type { CanvasReady, CanvasProps } from './props'

function layoutStyle({ width, height, style }: CanvasProps): CanvasProps['style'] {
  if (typeof style !== 'string') {
    return { width, height, ...style }
  }

  const declaration = (property: string, value: number | string | undefined) =>
    value === undefined ? '' : `${property}: ${typeof value === 'number' ? `${value}dip` : value};`

  return declaration('width', width) + declaration('height', height) + style
}

export function Canvas(props: CanvasProps): unknown @{
  const ready = ({ canvas }: CanvasReady) => {
    // The NAPI canvas reads navigator.gpu when a caller requests WebGPU,
    // including when onReady defers context acquisition to the caller.
    getGPU()
    props.onReady?.({ canvas, context: props.context ? canvas.getContext(props.context) : null })
  }

  <NativeCanvas {...props} context={undefined} style={layoutStyle(props)} onReady={ready} />
}
