import type { PanAdmission } from '@octane-xplat/ui/internal/gesture-input'
import type { AnimationResult, GestureSession, PanGestureOptions } from '@octane-xplat/ui'
import type { DrawerProps } from './props'

/** Presentation only. Input always belongs to the UI root coordinator. */
export interface DrawerPresentation {
  width(): number
  read(): number
  stop(): void
  write(revealed: number): void
  settle(revealed: number, reducedMotion: boolean): Promise<AnimationResult>
  dispose(): void
}

/** Preserve the engine's directional trigger and velocity projection. */
export function drawerDestination(
  revealed: number,
  width: number,
  delta: number,
  velocity: number,
): boolean {
  const projected = delta + 0.05 * velocity

  return projected > 20 || (projected >= -20 && revealed + projected > width / 2)
}

export type DrawerBinding = {
  pan: PanGestureOptions
  admission: PanAdmission
  sync(): void
  visible(): boolean
  dismiss(): void
  dispose(): void
}

export function bindDrawer(
  presentation: DrawerPresentation,
  read: () => DrawerProps,
): DrawerBinding {
  let internal = read().defaultOpen ?? false
  let disposed = false
  let generation = 0
  let width = 0
  let commanded = read().open ?? internal
  let settling: boolean | null = null
  let drag: { session: GestureSession; origin: number; translation: number } | null = null
  let admittedPosition = 0
  let commandRevision = 0
  let admittedRevision = 0
  const desired = () => read().open ?? internal
  const reportError = (error: unknown) => {
    if (disposed) {
      return
    }

    if (read().onError) {
      read().onError!(error)
    } else {
      console.error('[octane-xplat/drawer] animation failed', error)
    }
  }

  const stop = () => {
    generation++
    settling = null
    presentation.stop()
  }

  const request = (open: boolean) => {
    if (read().open === undefined) {
      internal = open
    }

    read().onOpenChange?.(open)
    if (!open) {
      read().onDismiss?.()
    }
  }

  const settle = (open: boolean, user: boolean) => {
    if (disposed || width <= 0) {
      return
    }

    stop()

    const token = generation

    settling = open
    try {
      void presentation.settle(open ? width : 0, read().reducedMotion === true).then(
        (result) => {
          if (disposed || generation !== token) {
            return
          }

          settling = null
          if (result.status === 'failed') {
            reportError(result.error)
            return
          }

          if (result.status !== 'finished') {
            return
          }

          if (user && open !== desired()) {
            request(open)
          }

          // A controlled owner can accept in its queued render; otherwise restore.
          queueMicrotask(sync)
        },
        (error) => {
          if (!disposed && token === generation) {
            settling = null
            reportError(error)
          }
        },
      )
    } catch (error) {
      settling = null
      reportError(error)
    }
  }

  const cancelDrag = () => {
    const active = drag

    drag = null
    active?.session.cancel()
  }

  const sync = () => {
    if (disposed) {
      return
    }

    const nextWidth = presentation.width()
    const next = desired()
    const geometryChanged = nextWidth !== width
    const commandChanged = next !== commanded

    if (geometryChanged || commandChanged || read().isGestureEnabled === false) {
      cancelDrag()
    }

    if (geometryChanged || commandChanged) {
      commandRevision++
      stop()
    }

    width = nextWidth
    commanded = next
    if (width <= 0) {
      return
    }

    presentation.write(presentation.read())
    if (drag) {
      return
    }

    if (settling !== null) {
      return
    }

    if (presentation.read() !== (next ? width : 0)) {
      settle(next, false)
    }
  }

  const admission: PanAdmission = {
    basis: 'host',
    enabled: () => !disposed && read().isGestureEnabled !== false,
    admit(position) {
      sync()
      admittedPosition = presentation.read()
      admittedRevision = commandRevision

      const x = position.local?.x

      return (
        !disposed &&
        read().isGestureEnabled !== false &&
        width > 0 &&
        x !== undefined &&
        x >= 0 &&
        (admittedPosition > 0 || x <= 40)
      )
    },
    intent(sample) {
      if (admittedRevision !== commandRevision) {
        return false
      }

      return admittedPosition <= 0
        ? sample.translation.x > 0
        : admittedPosition >= width
          ? sample.translation.x < 0
          : true
    },
  }

  const pan: PanGestureOptions = {
    axis: 'x',
    activation: { distance: 10, dominance: 1.2 },
    pointers: { min: 1, max: 1 },
    onStart(sample) {
      if (disposed || read().isGestureEnabled === false) {
        sample.session.cancel()
        return
      }

      stop()
      drag = { session: sample.session, origin: presentation.read(), translation: 0 }
    },
    onUpdate(sample) {
      if (!drag || drag.session !== sample.session) {
        return
      }

      presentation.write(Math.max(0, Math.min(width, drag.origin + sample.translation.x)))
      drag.translation = sample.translation.x
    },
    onEnd(sample) {
      if (!drag || drag.session !== sample.session) {
        return
      }

      const delta = sample.translation.x - drag.translation

      drag = null
      settle(drawerDestination(presentation.read(), width, delta, sample.velocity?.x ?? 0), true)
    },
    onCancel(sample) {
      if (!drag || drag.session !== sample.session) {
        return
      }

      drag = null
      settle(desired(), false)
    },
  }

  return {
    pan,
    admission,
    sync,
    visible: () => !disposed && (desired() || presentation.read() > 0),
    dismiss() {
      if (disposed || (!desired() && presentation.read() <= 0)) {
        return
      }

      cancelDrag()
      stop()
      request(false)
      queueMicrotask(sync)
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      cancelDrag()
      stop()
      presentation.dispose()
    },
  }
}
