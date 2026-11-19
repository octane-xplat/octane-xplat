import { useLayoutEffect, useRef } from 'octane'
import { usePanGesture$ } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
import { motion, useMotionValue, useTransform, useReducedMotion } from '@octane-xplat/motion'
import { createVideoGeometry } from './video-geometry'
import type { VideoGeometrySpec } from './video-geometry'

/** App controls; callbacks run only for the current completed endpoint. */
export type VideoCropControls = { open(): void; close(): void }
/** This is an app-owned composition, not an additional framework animation engine. */
export function VideoCropSurface(props: {
  geometry: VideoGeometrySpec
  children?: ViewProps['children']
  onControls?: (controls: VideoCropControls | undefined) => void
  onClosed?: () => void
}) {
  // 1. Own animation values and the current crop geometry for this surface.
  const progress$ = useMotionValue(0)
  const revision$ = useMotionValue(0)
  const model = useRef(createVideoGeometry(props.geometry))
  const latest = useRef(props)
  const prefersReduced = useReducedMotion()
  const reduced = useRef(prefersReduced)

  reduced.current = prefersReduced
  latest.current = props

  const generation = useRef(0)
  const stable = useRef<0 | 1>(0)
  const disposed = useRef(false)
  const drag = useRef<{ origin: number; startY: number; stable: 0 | 1; distance: number }>({
    origin: 0,
    startY: 0,
    stable: 0,
    distance: 1,
  })

  // 2. Settle to an endpoint, ignoring results from replaced or disposed runs.
  const clamp = (p: number) => Math.max(0, Math.min(1, p))
  const settle = (target: 0 | 1, velocity?: number) => {
    if (disposed.current) {
      return
    }

    const token = ++generation.current
    const run = progress$.animate(
      target,
      reduced.current ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 32, velocity },
      clamp,
    )

    void run.finished.then((result) => {
      if (result !== 'finished' || token !== generation.current || disposed.current) {
        return
      }

      stable.current = target
      if (target === 0) {
        latest.current.onClosed?.()
      }
    })
  }

  // 3. Bind a pan gesture to the current progress and settle on release.
  const pan$ = usePanGesture$({
    axis: 'y',
    onStart(sample) {
      generation.current++
      progress$.stop()
      drag.current = {
        origin: progress$.get(),
        startY: sample.position.window.y,
        stable: stable.current,
        distance: Math.max(1, latest.current.geometry.overlay.height * 0.5),
      }
    },
    onUpdate(sample) {
      progress$.set(
        clamp(
          drag.current.origin -
            (sample.position.window.y - drag.current.startY) / drag.current.distance,
        ),
      )
    },
    onEnd() {
      settle(progress$.get() < 0.5 ? 0 : 1, progress$.getVelocity())
    },
    onCancel() {
      settle(drag.current.stable, 0)
    },
  })

  // 4. Derive the rendered pose and clipping from the shared progress.
  const x$ = useTransform([progress$, revision$], ([p]) => model.current.sample(p).x)
  const y$ = useTransform([progress$, revision$], ([p]) => model.current.sample(p).y)
  const scale$ = useTransform([progress$, revision$], ([p]) => model.current.sample(p).scale)
  const clip$ = useTransform([progress$, revision$], ([p]) => model.current.sample(p).clipPath)

  // 5. Refresh the geometry when props change and release owned work on cleanup.
  useLayoutEffect(() => {
    model.current = model.current.rebase(props.geometry, progress$.get())
    revision$.set(revision$.get() + 1)
  }, [props.geometry])

  useLayoutEffect(() => {
    props.onControls?.({ open: () => settle(1), close: () => settle(0) })
    return () => {
      disposed.current = true
      generation.current++
      progress$.stop()
      props.onControls?.(undefined)
    }
  }, [])

  return (
    <motion.View
      layout={false}
      gestures={pan$}
      style={{
        position: 'absolute',
        left: props.geometry.overlay.x,
        top: props.geometry.overlay.y,
        width: props.geometry.overlay.width,
        height: props.geometry.overlay.height,
        boxSizing: 'border-box',
        x: x$,
        y: y$,
        scale: scale$,
        clipPath: clip$,
      }}
    >
      {props.children}
    </motion.View>
  )
}
