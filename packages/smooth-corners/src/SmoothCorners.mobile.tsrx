/** @jsxImportSource @octane-xplat/jsx */
import './SmoothCorners.css'
import { validateSurfaceProps } from './validation.ts'
import { useCallback, useEffect, useRef } from 'octane'
import { isIOS } from '@nativescript/core'
import type { View } from '@nativescript/core'
import { setSmoothCorners } from '@octane-xplat/nativescript-mason-core'
import {
  applySmoothShadow as applyIosShadow,
  disposeSmoothShadow as disposeIosShadow,
} from './apply.ios'

import {
  applySmoothShadow as applyAndroidShadow,
  disposeSmoothShadow as disposeAndroidShadow,
} from './apply.android'

import { outerLayoutProps, paintedStyle } from './layout-child'
import { createMasonSurfaceOwner } from './mason-surface'
import type { SmoothCornersProps } from './props'
import { clipsChildren, contentLayout, contentPaintReset, surfaceLayout } from './surface'

type SmoothNativeView = View & {
  readonly _view: unknown
  style: View['style'] & { overflowX?: string; overflowY?: string }
}

const applyShadow = isIOS ? applyIosShadow : applyAndroidShadow
const disposeShadow = isIOS ? disposeIosShadow : disposeAndroidShadow

/** The decorative surface is masked independently of the content host.
 * Parent layout metadata remains on the outer wrapper. */
export function SmoothCorners(props: SmoothCornersProps): unknown @{
  validateSurfaceProps(props, isIOS ? 'ios' : 'android')

  const state = useRef<{
    inner: SmoothNativeView | null
    surface: SmoothNativeView | null
    outer: SmoothNativeView | null
    props: SmoothCornersProps
  }>({
    inner: null,
    surface: null,
    outer: null,
    props,
  })

  const owner = useRef(createMasonSurfaceOwner(setSmoothCorners))

  state.current.props = props

  const apply = useCallback(() => {
    const s = state.current

    if (s.inner?._view) {
      const style = s.inner.style

      owner.current.update(
        s.inner,
        clipsChildren(style.overflowX, style.overflowY) ? s.props.corners : null,
      )
    }

    if (s.surface?._view) {
      owner.current.update(s.surface, s.props.corners)
    }

    if (s.outer) {
      applyShadow(s.outer, s.props)
    }
  }, [])

  const bind = useCallback(
    (which: 'inner' | 'surface' | 'outer') => (view: SmoothNativeView | null) => {
      const s = state.current
      const prev = s[which]

      if (prev && prev !== view) {
        prev.off?.('loaded', apply)
        prev.off?.('layoutChanged', apply)
        prev.style?.off?.('overflowXChange', apply)
        prev.style?.off?.('overflowYChange', apply)
        if (which === 'outer') {
          disposeShadow(prev)
        } else {
          owner.current.dispose(prev)
        }
      }

      s[which] = view
      if (!view) {
        return
      }

      if (which === 'surface') {
        view.isUserInteractionEnabled = false
        view.accessibilityHidden = true
      }

      view.on?.('loaded', apply)
      view.on?.('layoutChanged', apply)
      view.style?.on?.('overflowXChange', apply)
      view.style?.on?.('overflowYChange', apply)
      apply()
    },
    [apply],
  )

  const bindInner = useRef(bind('inner'))
  const bindOuter = useRef(bind('outer'))
  const bindSurface = useRef(bind('surface'))

  // Prop changes without a layout event still need a re-clip.
  useEffect(() => apply(), null)

  return (
    <masonview
      ref={bindOuter.current}
      className={['vx-smooth-corners-frame', props.className]}
      style={{
        display: 'grid',
        ...contentPaintReset,
        padding: 0,
        overflow: 'visible',
        ...outerLayoutProps(props).style,
      }}
    >
      <masonview
        ref={bindInner.current}
        id={props.id}
        className={['vx-smooth-corners', props.className]}
        style={{
          ...paintedStyle(props.style),
          ...contentPaintReset,
          ...contentLayout,
        }}
      >
        <masonview
          ref={bindSurface.current}
          className={props.className}
          style={{
            ...paintedStyle(props.style),
            ...surfaceLayout,
            borderWidth: props.border?.width ?? 0,
            borderColor: props.border?.color,
          }}
        />
        {props.children}
      </masonview>
    </masonview>
  )
}
