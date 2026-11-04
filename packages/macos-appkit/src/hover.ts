import type { Actions } from './actions'
import type { ContextMenu } from './context-menu'
import { createAppKitPointerMotion } from './pointer-motion'
import {
  NSCursor,
  NSEvent,
  NSMenuItem,
  NSObject,
  NSTrackingArea,
  NSTrackingAreaOptions,
  NSView,
  interop,
} from '@octane-xplat/platform/macos'
import { registerGestureClass } from './gestures'

interface Dependencies {
  actions: Pick<Actions, 'invokeAction'>
  contextMenu: Pick<ContextMenu, 'menuActionTarget'>
}

export type Hover = ReturnType<typeof createHover>

export function createHover(deps: Dependencies) {
  // Pointer-intent plumbing: NSTrackingArea-backed hover observation and an
  // NSPopover surface for anchored hint layers (Tooltip/Hoverable). Reached by
  // packages/ui macOS leaves through the __xplatAppKit host global — ui never
  // links macos-node-api directly.

  const hoverRecordsByArea = new Map<object, any>()

  const hoverRecordByView = new WeakMap<object, any>()

  // Pointer-motion areas share the hover target but not its records —
  // dispatchHover only sees hoverRecordsByArea entries.
  const pointerMotion = createAppKitPointerMotion()

  const TRACKING_OPTS = (
    typeof NSTrackingAreaOptions === 'undefined' ? {} : NSTrackingAreaOptions
  ) as { [key: string]: number }

  const trackingOpt = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

  const HOVER_TRACKING_OPTIONS =
    trackingOpt(TRACKING_OPTS.MouseEnteredAndExited, 0x01) |
    trackingOpt(TRACKING_OPTS.ActiveAlways, 0x80) |
    trackingOpt(TRACKING_OPTS.InVisibleRect, 0x200)

  function dispatchHover(area: any, phase: 'enter' | 'exit') {
    const record = hoverRecordsByArea.get(area)
    if (record) {
      if (phase === 'enter') {
        record.inside = true
        if (record.hidesCursor) {
          NSCursor.hide()
          record.cursorHidden = true
        } else if (record.cursor) {
          record.cursor.push()
          record.pushed = true
        }
      } else {
        record.inside = false
        if (record.pushed) {
          NSCursor.pop()
          record.pushed = false
        }

        if (record.cursorHidden) {
          NSCursor.unhide()
          record.cursorHidden = false
        }
      }
    }
    const handler = phase === 'enter' ? record?.enter : record?.exit
    if (typeof handler !== 'function') {
      return
    }

    try {
      handler()
    } catch (error) {
      console.error('[macos-hover] hover handler failed', error)
    }
  }

  function observeHover(view: NSView, handlers: { enter?: () => void; exit?: () => void }) {
    if (
      !view ||
      typeof view.addTrackingArea !== 'function' ||
      typeof NSTrackingArea === 'undefined' ||
      !hoverTrackingTarget
    ) {
      return () => {}
    }

    // A re-registration (tooltip arriving after a cursor style, or vice
    // versa) keeps the cursor fields — they belong to the view, not the area.
    const previous = hoverRecordByView.get(view)
    unobserveHover(view)
    const area = NSTrackingArea.alloc().initWithRectOptionsOwnerUserInfo(
      { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
      HOVER_TRACKING_OPTIONS,
      hoverTrackingTarget,
      null,
    )

    if (!area) {
      return () => {}
    }

    view.addTrackingArea(area)
    const record = {
      view,
      area,
      enter: handlers?.enter,
      exit: handlers?.exit,
      cursor: previous?.cursor,
      hidesCursor: previous?.hidesCursor,
    }
    hoverRecordsByArea.set(area, record)
    hoverRecordByView.set(view, record)
    return () => unobserveHover(view)
  }

  function unobserveHover(view: NSView) {
    const record = hoverRecordByView.get(view)
    if (!record) {
      return
    }

    hoverRecordByView.delete(view)
    hoverRecordsByArea.delete(record.area)
    if (record.pushed) {
      NSCursor.pop()
    }
    if (record.cursorHidden) {
      NSCursor.unhide()
    }
    try {
      view.removeTrackingArea(record.area)
    } catch (error) {
      console.error('[macos-hover] failed to remove tracking area', error)
    }
  }

  let hoverTrackingTarget: any = null

  try {
    class HoverTrackingTarget extends NSObject {
      static ObjCExposedMethods = {
        // Keys are ObjC selectors verbatim — colon included, matching
        // ButtonActionTarget. Bare names register colon-free selectors
        // that AppKit never sends.
        'mouseEntered:': { params: [NSEvent], returns: interop.types.void },
        'mouseExited:': { params: [NSEvent], returns: interop.types.void },
        'mouseMoved:': { params: [NSEvent], returns: interop.types.void },
      }

      static {
        registerGestureClass(this)
      }

      mouseEntered(event: NSEvent) {
        dispatchHover(event?.trackingArea, 'enter')
        pointerMotion.dispatch(event?.trackingArea, 'enter', event)
      }

      mouseExited(event: NSEvent) {
        dispatchHover(event?.trackingArea, 'exit')
        pointerMotion.dispatch(event?.trackingArea, 'exit', event)
      }

      mouseMoved(event: NSEvent) {
        pointerMotion.dispatch(event?.trackingArea, 'move', event)
      }
    }

    hoverTrackingTarget = HoverTrackingTarget.new()
  } catch (error) {
    console.error(
      '[macos-hover] tracking target registration failed — hover affordances disabled',
      error,
    )
  }

  try {
    class MenuActionTarget extends NSObject {
      static ObjCExposedMethods = {
        'menuItemSelected:': { params: [NSMenuItem], returns: interop.types.void },
      }

      static {
        registerGestureClass(this)
      }

      menuItemSelected(sender: NSMenuItem) {
        deps.actions.invokeAction(sender.tag)
      }
    }

    deps.contextMenu.menuActionTarget = MenuActionTarget.new()
  } catch (error) {
    console.error('[macos-leaf] menu target registration failed — context menus disabled', error)
  }
  return {
    hoverRecordsByArea,
    hoverRecordByView,
    pointerMotion,
    HOVER_TRACKING_OPTIONS,
    observeHover,
    unobserveHover,
    get hoverTrackingTarget() {
      return hoverTrackingTarget
    },
    set hoverTrackingTarget(value: typeof hoverTrackingTarget) {
      hoverTrackingTarget = value
    },
  }
}
