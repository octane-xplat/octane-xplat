/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { ResizeHandleProps } from '../../props'
import { useControlPan } from '../../gestures/control.tsrx'
import type { ControlPanNotification } from '../../gestures/control-types'
import { refList } from '../../internal/accessibility/ref-list'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Pressable } from '../actions/Pressable.tsrx'

/** ResizeHandle — draggable separator bound to a useResizable region.
 *  Native leaf: pan gestures drive the same _onResize{Start,Move,End,
 *  Cancel} lifecycle; a double-tap toggles collapse; arrows are a
 *  pointer-platform behavior (web). The handle is focusable for
 *  assistive tech via `accessibilityRole="adjustable"`. */
export function ResizeHandle(props: ResizeHandleProps): unknown @{
  const direction = props.direction ?? 'horizontal'
  const isHorizontal = direction === 'horizontal'
  const sign = props.isReversed ? -1 : 1
  const resizable = props.resizable
  const started = useRef(false)
  const lastTap = useRef(0)

  const input = useControlPan(
    { axis: isHorizontal ? 'x' : 'y', enabled: !props.isDisabled && Boolean(resizable) },
    (e: ControlPanNotification) => {
      if ((props.isDisabled && e.phase !== 'finish') || !resizable) {
        return
      }

      const delta = (isHorizontal ? e.translation.x : e.translation.y) * sign

      if (e.phase === 'start') {
        started.current = true
        resizable._onResizeStart()
      } else if (e.phase === 'update') {
        if (started.current) {
          resizable._onResizeMove(delta)
        }
      } else {
        // ended / cancelled
        if (started.current) {
          started.current = false
          if (e.cancelled) {
            resizable._onResizeCancel?.()
          } else {
            resizable._onResizeEnd()
          }
        }
      }
    },
  )

  const onTap = () => {
    if (props.isDisabled || !resizable?._collapsible) {
      return
    }

    // Double-tap toggles collapse — the touch analog of dblclick.
    const now = Date.now()

    if (now - lastTap.current < 400) {
      lastTap.current = 0
      resizable._onResizeStart()
      resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size)
      resizable._onResizeEnd()
    } else {
      lastTap.current = now
    }
  }

  const collapsed = resizable?._isCollapsed ?? false
  const pillSide =
    props.pillPlacement === 'auto' || props.pillPlacement == null
      ? collapsed
        ? 'center'
        : props.isReversed
          ? 'end'
          : 'start'
      : props.pillPlacement

  <Pressable
    id={props.id}
    className={cx(
      'vx-resize-handle',
      isHorizontal ? 'vx-resize-handle--h' : 'vx-resize-handle--v',
      props.position === 'overlay' && 'vx-resize-handle--overlay',
      props.hasDivider && 'vx-resize-handle--divider',
      props.isAlwaysVisible && 'vx-resize-handle--always',
      'vx-resize-handle--pill-' + pillSide,
      collapsed && 'vx-resize-handle--collapsed',
      props.isDisabled && 'vx-resize-handle--disabled',
      props.className,
    )}
    style={props.style}
    disabled={props.isDisabled}
    accessibilityRole="adjustable"
    accessibilityLabel={props.label ?? 'Resize handle'}
    accessibilityValue={resizable ? String(Math.round(resizable._size)) : undefined}
    ref={refList(input.ref, (view: any) => applyEscapeProps(view, props))}
    onPress={onTap}
  >
    {props.children ?? <masonview className="vx-resize-handle-pill" style={{ display: 'flex' }} />}
  </Pressable>
}
