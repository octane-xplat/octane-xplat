/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useRef } from 'octane'
import 'octane/signals'
import type { BorderBeamProps } from '../../props'
import { useMediaQuery$ } from '../../internal/platform/use-media-query.tsrx'
import { styleRecord } from '../../internal/layout/style-merge'
import { beamRadius } from './border-beam'

export interface BorderBeamPainter {
  update(host: object, radius: number, reducedMotion: boolean): void
  clear(): void
}

export function useBorderBeamFrame(props: BorderBeamProps, createPainter: () => BorderBeamPainter) {
  const host = useRef<object | null>(null)
  const painter = useRef<BorderBeamPainter | null>(null)
  const reducedMotion = useMediaQuery$('(prefers-reduced-motion: reduce)').get()
  const radius = beamRadius(props.radius)
  const active = props.active !== false
  const options = useRef({ radius, active, reducedMotion })

  options.current = { radius, active, reducedMotion }

  const sync = useCallback(() => {
    const view = host.current
    const { radius, active, reducedMotion } = options.current

    if (view && active) {
      painter.current ??= createPainter()
      painter.current.update(view, radius, reducedMotion)
    } else {
      painter.current?.clear()
    }
  }, [createPainter])

  const bind = useCallback(
    (view: object | null) => {
      if (host.current !== view) {
        painter.current?.clear()
        host.current = view
      }

      sync()
    },
    [sync],
  )

  useLayoutEffect(sync, [sync, radius, active, reducedMotion])
  useLayoutEffect(() => () => painter.current?.clear(), [])

  return {
    id: props.id,
    className: ['vx-view', props.className],
    style: { ...styleRecord(props.style), borderRadius: radius },
    ref: bind,
    onLayoutChanged: sync,
    onLoaded: sync,
    onUnloaded: () => painter.current?.clear(),
  }
}
