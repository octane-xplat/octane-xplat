/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo, useCallback, useEffect, useRef } from 'octane'
import type { ColorAreaProps } from '../../props'
import type { ColorAreaViewProps } from '../../internal-props'
import { refList } from '../../internal/accessibility/ref-list'
import { cx } from '@octane-xplat/lib'
import { useMeasure$ } from '../layout/useMeasure.tsrx'
import { useControlPan } from '../../gestures/control.tsrx'
import type { ControlPanNotification } from '../../gestures/control-types'
import { applyNativeProps } from '../../internal/platform/platformProps'
import { nativeAccessibilityRole } from '../overlays/escape-props'
import { LinearGradient } from '../media/LinearGradient.tsrx'
import { hsbToHex, type Hsb } from '../../theme/color'
import { useColorState } from '../../theme/color-state.tsrx'

const THUMB = 16

/** Internal 2D area view — saturation left→right, brightness top→bottom.
 *  Drag adjusts by delta from the value at `began` (no tap-to-position v1). */
export function ColorAreaView(props: ColorAreaViewProps): unknown @{
  const measure = useMeasure$()
  const measuredBounds = measure.bounds$.get()
  const drag = useRef<Hsb | null>(null)
  const host = useRef<any>(null)
  const lastTarget = useRef<any>(null)
  const adjust = (dir: number) => {
    if (props.isDisabled) {
      return
    }

    props.onHsb({ ...props.hsb, b: Math.min(1, Math.max(0, props.hsb.b + dir * 0.05)) })
    props.onHsbEnd()
  }

  const adjustRef = useRef((dir: number) => {
    void dir
  })

  adjustRef.current = adjust

  const bindHost = useCallback((el: any) => {
    host.current = el
    measure.ref(el)
    if (el) {
      el.on?.('accessibilityIncrement', () => adjustRef.current(1))
      el.on?.('accessibilityDecrement', () => adjustRef.current(-1))
    }
  }, [])

  // Prefer measured bounds; fall back to the gesture target's own size —
  // the same source controls.macos uses, and it keeps pan working before
  // the first layoutChanged arrives.
  const targetSize = () => {
    const size = lastTarget.current?.getActualSize?.()

    return size && size.width > 0 ? size : measuredBounds
  }

  const w = measuredBounds?.width ?? 0
  const h = measuredBounds?.height ?? 0
  const { s, b } = props.hsb

  const input = useControlPan(
    { axis: 'both', enabled: !props.isDisabled },
    (e: ControlPanNotification) => {
      if (props.isDisabled && e.phase !== 'finish') {
        return
      }

      if (e.phase === 'start') {
        lastTarget.current = host.current
        drag.current = { ...props.hsb }
        return
      }

      if (e.phase === 'update') {
        const size = targetSize()
        const next =
          size && size.width > 0 && size.height > 0 && drag.current
            ? {
                h: props.hsb.h,
                s: Math.min(1, Math.max(0, drag.current.s + e.translation.x / size.width)),
                b: Math.min(1, Math.max(0, drag.current.b - e.translation.y / size.height)),
              }
            : null

        if (next) {
          props.onHsb(next)
        }
      } else {
        if (drag.current) {
          props.onHsbEnd()
        }

        drag.current = null
      }
    },
  )

  const inputRef = useMemo(() => refList(bindHost, input.ref), [bindHost, input.ref])

  useEffect(() => {
    applyNativeProps(host.current, props)
  })

  const thumbX = Math.min(Math.max(s * w - THUMB / 2, 0), Math.max(w - THUMB, 0))
  const thumbY = Math.min(Math.max((1 - b) * h - THUMB / 2, 0), Math.max(h - THUMB, 0))

  <masonview
    id={props.id}
    testID={props.testID}
    className={cx('vx-color-area', props.className)}
    style={mergeStyle({ display: 'grid', height: 160 }, styleRecord(props.style))}
    accessibilityRole={nativeAccessibilityRole('adjustable')}
    accessibilityLabel={props.accessibilityLabel ?? 'color'}
    accessibilityValue={`saturation ${Math.round(s * 100)}%, brightness ${Math.round(b * 100)}%`}
    onPan={input.onPan}
    ref={inputRef}
  >
    <masonview
      className="vx-color-area-hue"
      style={mergeStyle(
        { display: 'flex' },
        {
          backgroundColor: hsbToHex({ h: props.hsb.h, s: 1, b: 1 }),
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        },
      )}
    />
    <LinearGradient
      colors={['#ffffff', 'rgba(255,255,255,0)']}
      direction="horizontal"
      className="vx-color-area-sat"
      style={{
        display: 'flex',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    />
    <LinearGradient
      colors={['rgba(0,0,0,0)', '#000000']}
      direction="vertical"
      className="vx-color-area-val"
      style={{
        display: 'flex',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    />
    <masonview
      className="vx-color-area-thumb"
      style={mergeStyle(
        { display: 'flex' },
        {
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          borderWidth: 2,
          borderColor: '#ffffff',
          backgroundColor: hsbToHex(props.hsb),
          translateX: thumbX,
          translateY: thumbY,
          position: 'absolute',
        },
      )}
    />
  </masonview>
}

/** Two-dimensional color picker for a channel pair. */
export function ColorArea(props: ColorAreaProps): unknown @{
  const color = useColorState(props, '#ff0000')

  <ColorAreaView
    hsb={color.hsb}
    onHsb={color.set}
    onHsbEnd={color.end}
    isDisabled={props.isDisabled}
    id={props.id}
    testID={props.testID}
    className={props.className}
    style={props.style}
    accessibilityLabel={props.accessibilityLabel}
  />
}
