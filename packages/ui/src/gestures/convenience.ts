import {
  createPanController,
  createPinchController,
  type PanController,
  type PinchController,
} from './controller'

import { compete, gestureLeaves } from './composition'
import type { GestureHostProps, GestureInput, PanSample, PinchSample, Terminal } from './types'

/** Allocate convenience controllers only after commit, only when their callback exists. */
export function createConvenienceInput() {
  let pan: PanController | null = null,
    pinch: PinchController | null = null

  let version = 0

  return {
    current(snapshot: ConvenienceSnapshot) {
      return snapshot.version === version
    },
    commit(props: GestureHostProps): ConvenienceSnapshot {
      const identity = ++version

      if (props.gestures) {
        for (const leaf of gestureLeaves(props.gestures)) {
          if ((leaf.kind === 'pan' && props.onPan) || (leaf.kind === 'pinch' && props.onPinch)) {
            throw new Error(
              `Attach either a ${leaf.kind} handle or its convenience callback, not both`,
            )
          }
        }
      }

      if (props.onPan) {
        const callback = props.onPan
        const options = {
          axis: 'both' as const,
          onStart: (sample: PanSample) => callback({ phase: 'start', sample }),
          onUpdate: (sample: PanSample) => callback({ phase: 'update', sample }),
          onFinalize: (terminal: Terminal<PanSample>) => callback({ phase: 'finish', terminal }),
        }

        if (pan) {
          pan.commit(options)
        } else {
          pan = createPanController(options)
        }
      } else {
        const old = pan

        pan = null
        old?.dispose()
      }

      if (version !== identity) {
        return { version: identity }
      }

      if (props.onPinch) {
        const callback = props.onPinch
        const options = {
          onStart: (sample: PinchSample) => callback({ phase: 'start', sample }),
          onUpdate: (sample: PinchSample) => callback({ phase: 'update', sample }),
          onFinalize: (terminal: Terminal<PinchSample>) => callback({ phase: 'finish', terminal }),
        }

        if (pinch) {
          pinch.commit(options)
        } else {
          pinch = createPinchController(options)
        }
      } else {
        const old = pinch

        pinch = null
        old?.dispose()
      }

      if (version !== identity) {
        return { version: identity }
      }

      const inputs: GestureInput[] = []

      if (props.gestures) {
        inputs.push(props.gestures)
      }

      if (pan) {
        inputs.push(pan.handle)
      }

      if (pinch) {
        inputs.push(pinch.handle)
      }

      return {
        version: identity,
        input: inputs.length < 2 ? inputs[0] : compete(inputs[0], inputs[1], ...inputs.slice(2)),
      }
    },
    dispose() {
      version++

      const oldPan = pan,
        oldPinch = pinch

      pan = null
      pinch = null
      try {
        oldPan?.dispose()
      } finally {
        oldPinch?.dispose()
      }
    },
  }
}

export type ConvenienceInput = ReturnType<typeof createConvenienceInput>

interface ConvenienceSnapshot {
  readonly version: number
  readonly input?: GestureInput
}
