/** @jsxImportSource @octane-xplat/jsx */
import { validateSurfaceProps } from './validation.ts'
import { useCallback, useEffect, useRef } from 'octane'
import { outerLayoutProps, paintedStyle } from './layout-child'
import { applySmoothClip, applySmoothShadow } from './apply.macos'
import type { SmoothCornersProps } from './props'
import { contentLayout, contentPaintReset, surfaceLayout } from './surface'
import type { NativeEvent } from '@octane-xplat/jsx/jsx-runtime'

interface SurfaceView {
  clipsToBounds: boolean
}

type SurfaceLayout = { view: SurfaceView; w: number; h: number }

function isSurfaceView(view: object): view is SurfaceView {
  return 'clipsToBounds' in view && typeof view.clipsToBounds === 'boolean'
}

// The shared host event type omits the AppKit layout payload. Validate it at
// this boundary rather than asserting an object shape in each callback.
function readLayout(event: NativeEvent<object>): SurfaceLayout {
  if (
    !('width' in event) ||
    typeof event.width !== 'number' ||
    !('height' in event) ||
    typeof event.height !== 'number' ||
    !isSurfaceView(event.object)
  ) {
    throw new Error('SmoothCorners requires an AppKit layout event with bounds and a native view')
  }

  return { view: event.object, w: event.width, h: event.height }
}

/** The painted surface is independent of the optional content clip. */
export function SmoothCorners(props: SmoothCornersProps): unknown @{
  validateSurfaceProps(props, 'macos')

  const state = useRef<{
    props: SmoothCornersProps
    inner: SurfaceLayout | null
    surface: SurfaceLayout | null
    outer: SurfaceLayout | null
  }>({ props, inner: null, surface: null, outer: null })

  state.current.props = props

  const apply = useCallback(() => {
    const { inner, surface, outer, props: current } = state.current

    if (inner) {
      applySmoothClip(
        inner.view,
        inner.w,
        inner.h,
        { ...current, border: undefined },
        inner.view.clipsToBounds === true,
      )
    }

    if (surface) {
      applySmoothClip(surface.view, surface.w, surface.h, current)
    }

    if (outer) {
      applySmoothShadow(outer.view, outer.w, outer.h, current)
    }
  }, [])

  const innerLayout = useCallback((e: NativeEvent<object>) => {
    state.current.inner = readLayout(e)
    apply()
  }, [])

  const surfaceLayoutChanged = useCallback((e: NativeEvent<object>) => {
    state.current.surface = readLayout(e)
    apply()
  }, [])

  const outerLayout = useCallback((e: NativeEvent<object>) => {
    state.current.outer = readLayout(e)
    apply()
  }, [])

  useEffect(() => apply(), null)

  return (
    <masonview
      onLayoutChanged={outerLayout}
      className={props.className}
      style={{
        display: 'grid',
        ...contentPaintReset,
        padding: 0,
        overflow: 'visible',
        ...outerLayoutProps(props).style,
      }}
    >
      <masonview
        onLayoutChanged={innerLayout}
        id={props.id}
        className={['vx-smooth-corners', props.className]}
        style={{
          display: 'grid',
          ...paintedStyle(props.style),
          ...contentPaintReset,
          ...contentLayout,
        }}
      >
        <masonview
          onLayoutChanged={surfaceLayoutChanged}
          className={props.className}
          style={{ ...paintedStyle(props.style), ...surfaceLayout, pointerEvents: 'none' }}
        />
        {props.children}
      </masonview>
    </masonview>
  )
}
