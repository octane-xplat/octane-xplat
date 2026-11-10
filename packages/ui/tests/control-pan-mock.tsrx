import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { ControlPanOptions, ControlPanNotification } from '../src/gestures/control-types'

/** Slider value-policy fixture. Raw numbers here are test commands, not OS input. */
export function useControlPan(
  options: ControlPanOptions,
  callback: (event: ControlPanNotification) => void,
) {
  const latest = useRef({ options, callback }),
    host = useRef<any>(null)

  const dispatch = useCallback(
    (event: {
      state: number
      x?: number
      y?: number
      deltaX?: number
      deltaY?: number
      view?: { bounds?: object }
    }) => {
      const current = latest.current

      if (!current.options.enabled) {
        return
      }

      if (event.view?.bounds && host.current) {
        host.current.bounds = event.view.bounds
      }

      current.callback({
        phase: event.state === 1 ? 'start' : event.state === 2 ? 'update' : 'finish',
        translation: { x: event.deltaX ?? 0, y: event.deltaY ?? 0 },
        startLocal: {
          x: (event.x ?? 0) - (event.deltaX ?? 0),
          y: (event.y ?? 0) - (event.deltaY ?? 0),
        },
        positionLocal: { x: event.x ?? 0, y: event.y ?? 0 },
        cancelled: event.state === 0,
      })
    },
    [],
  )

  const sync = useCallback(() => {
    if (host.current) {
      host.current.props = {
        ...host.current.props,
        onPan: latest.current.options.enabled ? dispatch : undefined,
      }
    }
  }, [dispatch])

  useLayoutEffect(() => {
    latest.current = { options, callback }
    sync()
  }, [options, callback, sync])

  const ref = useCallback(
    (node: object | null) => {
      host.current = node
      sync()
    },
    [sync],
  )

  return { ref, onPan: undefined, nativeControl: false }
}
