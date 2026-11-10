import { createPanController, type PanAdmission } from './controller'
import type { PanGesture, PanGestureOptions } from './types'
import type { PressOptions } from './press'

/** @internal Framework-package integration; call only for a committed host. */
export interface ExternalGestureAdapter {
  pan(host: object, input: PanGesture, basis: 'host' | 'parent'): () => void
  press(host: object, options: PressOptions): () => void
}

export function createExternalGestureInput(adapter: ExternalGestureAdapter) {
  return {
    attachPan(host: object, options: PanGestureOptions, admission?: PanAdmission): () => void {
      const controller = createPanController(options)

      controller.admission = admission

      let release: () => void

      try {
        release = adapter.pan(host, controller.handle, admission?.basis ?? 'parent')
      } catch (error) {
        controller.dispose()
        throw error
      }

      return () => {
        try {
          release()
        } finally {
          controller.dispose()
        }
      }
    },
    observePress(host: object, callbacks: { start(): void; end(): void }): () => void {
      return adapter.press(host, {
        observeOnly: true,
        slop: 8,
        onPressIn: callbacks.start,
        onPressOut: callbacks.end,
      })
    },
  }
}

export type ExternalGestureInput = ReturnType<typeof createExternalGestureInput>
