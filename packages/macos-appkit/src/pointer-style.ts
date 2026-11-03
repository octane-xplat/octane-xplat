import type { createHover } from './hover'
import type { ElementNode } from './model'
import { NSCursor } from '@octane-xplat/platform/macos'

interface Dependencies {
  hover: Pick<
    ReturnType<typeof createHover>,
    'hoverRecordByView' | 'unobserveHover' | 'observeHover'
  >
}

export function createPointerStyle(deps: Dependencies) {
  // CSS cursor keywords → the AppKit cursor pushed while the pointer is inside
  // the view's tracking area. 'none' hides the cursor instead; keywords with no
  // AppKit equivalent (diagonal resizes, wait, zoom, cell, help) keep the
  // inherited cursor and warn once.
  const CSS_CURSORS: Record<string, string> = {
    auto: 'arrowCursor',
    default: 'arrowCursor',
    pointer: 'pointingHandCursor',
    text: 'IBeamCursor',
    'vertical-text': 'IBeamCursorForVerticalLayout',
    crosshair: 'crosshairCursor',
    move: 'openHandCursor',
    grab: 'openHandCursor',
    grabbing: 'closedHandCursor',
    'col-resize': 'resizeLeftRightCursor',
    'ew-resize': 'resizeLeftRightCursor',
    'e-resize': 'resizeRightCursor',
    'w-resize': 'resizeLeftCursor',
    'row-resize': 'resizeUpDownCursor',
    'ns-resize': 'resizeUpDownCursor',
    'n-resize': 'resizeUpCursor',
    's-resize': 'resizeDownCursor',
    'not-allowed': 'operationNotAllowedCursor',
    copy: 'dragCopyCursor',
    alias: 'dragLinkCursor',
    'context-menu': 'contextualMenuCursor',
    disappearing: 'disappearingItemCursor',
  }

  // The hover record's `inside` flag lets a mid-hover cursor change retake the
  // right cursor immediately; pushed/unhide bookkeeping pairs with pop/unhide.
  function syncCursor(node: ElementNode) {
    const view = node.view!
    const name = node.styleCursor
    const hidesCursor = name === 'none'
    let cursor: any = null
    if (name != null && !hidesCursor) {
      const property = CSS_CURSORS[String(name)]
      if (property) {
        cursor = (NSCursor as any)[property]
      } else {
        console.warn(
          '[macos-css] unsupported cursor ' + JSON.stringify(name) + ' (on <' + node.type + '>)',
        )
      }
    }

    const release = (record: any) => {
      if (record.pushed) {
        NSCursor.pop()
        record.pushed = false
      }
      if (record.cursorHidden) {
        NSCursor.unhide()
        record.cursorHidden = false
      }
    }

    if (!cursor && !hidesCursor) {
      const record = deps.hover.hoverRecordByView.get(view)
      if (record) {
        release(record)
        record.cursor = null
        record.hidesCursor = false
        if (!record.enter && !record.exit) {
          deps.hover.unobserveHover(view)
        }
      }

      return
    }

    let record = deps.hover.hoverRecordByView.get(view)
    if (!record) {
      deps.hover.observeHover(view, {})
      record = deps.hover.hoverRecordByView.get(view)
      if (!record) {
        return
      }
    }

    release(record)
    record.cursor = cursor
    record.hidesCursor = hidesCursor
    if (record.inside) {
      if (hidesCursor) {
        NSCursor.hide()
        record.cursorHidden = true
      } else if (cursor) {
        cursor.push()
        record.pushed = true
      }
    }
  }

  // user-select only reaches selectable text — labels and html views; editable
  // controls keep their own editing affordance.
  function syncUserSelect(node: ElementNode) {
    const value = node.styleUserSelect
    // `selectable` reads readonly on the generated NSTextField type; the
    // setter exists on every AppKit text control.
    if (value === 'none') {
      ;(node.view as any).selectable = false
    } else if (value === 'text' || value === 'all') {
      ;(node.view as any).selectable = true
    } else {
      // auto/inherit/absent — restore the element's authored default.
      ;(node.view as any).selectable = node.type === 'htmlview'
    }
  }
  return {
    syncCursor,
    syncUserSelect,
  }
}
