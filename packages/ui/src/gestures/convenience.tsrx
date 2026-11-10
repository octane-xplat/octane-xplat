import { usePanGesture$, usePinchGesture$ } from './hooks.tsrx'
import { compete, gestureLeaves } from './composition'
import type { GestureHostProps, GestureInput } from './types'

/** Convenience callbacks participate in the exact same owner; no parallel recognizers. */
export function useGestureInput(props: GestureHostProps): GestureInput | undefined {
  const pan = usePanGesture$({
    axis: 'both',
    enabled: Boolean(props.onPan),
    onStart: (sample) => props.onPan?.({ phase: 'start', sample }),
    onUpdate: (sample) => props.onPan?.({ phase: 'update', sample }),
    onFinalize: (terminal) => props.onPan?.({ phase: 'finish', terminal }),
  })

  const pinch = usePinchGesture$({
    enabled: Boolean(props.onPinch),
    onStart: (sample) => props.onPinch?.({ phase: 'start', sample }),
    onUpdate: (sample) => props.onPinch?.({ phase: 'update', sample }),
    onFinalize: (terminal) => props.onPinch?.({ phase: 'finish', terminal }),
  })

  if (props.gestures) {
    for (const leaf of gestureLeaves(props.gestures)) {
      if ((leaf.kind === 'pan' && props.onPan) || (leaf.kind === 'pinch' && props.onPinch)) {
        throw new Error(`Attach either a ${leaf.kind} handle or its convenience callback, not both`)
      }
    }
  }

  const inputs: GestureInput[] = []

  if (props.gestures) {
    inputs.push(props.gestures)
  }

  if (props.onPan) {
    inputs.push(pan)
  }

  if (props.onPinch) {
    inputs.push(pinch)
  }

  if (inputs.length < 2) {
    return inputs[0]
  }

  return compete(inputs[0], inputs[1], ...inputs.slice(2))
}
