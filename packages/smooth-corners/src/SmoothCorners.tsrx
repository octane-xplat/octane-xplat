/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef } from 'octane'
import { isIOS } from '@nativescript/core'
import type { View } from '@nativescript/core'
import { applySmoothClip as applyIosClip, applySmoothShadow as applyIosShadow } from './apply.ios'
import {
  applySmoothClip as applyAndroidClip,
  applySmoothShadow as applyAndroidShadow,
} from './apply.android'

import { outerLayoutProps, paintedStyle } from './layout-child'
import type { SmoothCornersProps } from './props'
import { clipsChildren, contentPaintReset, surfaceLayout } from './surface'

type SmoothNativeView = View & { style: View['style'] & { overflowX?: string; overflowY?: string } }

const applyClip = isIOS ? applyIosClip : applyAndroidClip
const applyShadow = isIOS ? applyIosShadow : applyAndroidShadow

/** The decorative surface is masked independently of the content host.
 * Parent layout metadata remains on the outer wrapper. */
export function SmoothCorners(props: SmoothCornersProps): unknown @{
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

  state.current.props = props

  const apply = useCallback(() => {
    const s = state.current

    if (s.inner) {
      const style = s.inner.style

      applyClip(
        s.inner,
        { ...s.props, border: undefined, shadow: undefined },
        clipsChildren(style.overflowX, style.overflowY),
      )
    }

    if (s.surface) {
      applyClip(s.surface, { ...s.props, shadow: undefined })
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
      style={{ display: 'grid', overflow: 'visible', ...outerLayoutProps(props).style }}
    >
      <masonview
        ref={bindInner.current}
        id={props.id}
        className={['vx-smooth-corners', props.className]}
        style={{
          display: 'grid',
          position: 'relative',
          ...paintedStyle(props.style),
          ...contentPaintReset,
        }}
      >
        <masonview
          ref={bindSurface.current}
          className={props.className}
          style={{ ...paintedStyle(props.style), ...surfaceLayout }}
        />
        {props.children}
      </masonview>
    </masonview>
  )
}
