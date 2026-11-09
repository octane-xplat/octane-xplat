/** @jsxImportSource @octane-xplat/jsx */
import { useCallback } from 'octane'
import type { View } from '@nativescript/core'

import { outerLayoutProps, paintedStyle } from './layout-child'
import type { SmoothCornersProps } from './props'
import { contentPaintReset, surfaceLayout } from './surface'

// Windows leaf — no native squircle clip/shadow hook exists for the WinUI
// host yet. The same three-host layout renders with ordinary corners; the
// surface still paints and stays out of hit-testing and accessibility.
export function SmoothCorners(props: SmoothCornersProps): unknown @{
  const bindSurface = useCallback(
    (view: (View & { isUserInteractionEnabled: boolean; accessibilityHidden: boolean }) | null) => {
      if (view) {
        view.isUserInteractionEnabled = false
        view.accessibilityHidden = true
      }
    },
    [],
  )

  return (
    <masonview style={{ display: 'grid', overflow: 'visible', ...outerLayoutProps(props).style }}>
      <masonview
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
          ref={bindSurface}
          className={props.className}
          style={{ ...paintedStyle(props.style), ...surfaceLayout }}
        />
        {props.children}
      </masonview>
    </masonview>
  )
}
