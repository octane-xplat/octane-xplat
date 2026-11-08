import type { Popover } from './popover'
import {
  NSBackingStoreType,
  NSNotificationCenter,
  NSObject,
  NSView,
  NSViewController,
  NSWindow,
  NSWindowStyleMask,
  interop,
} from '@octane-xplat/platform/macos'

import { registerGestureClass } from './gestures'
import type { PropBag } from './model'
import { createNativeSheet } from './sheet.macos'

interface Dependencies {
  popover: Pick<Popover, 'popupFittingSize'>
}

export function createSheetBridge(deps: Dependencies) {
  const sheetWindowCancels = new WeakMap<NSWindow, () => void>()

  const sheetAnchorChanges = new WeakMap<NSView, () => void>()

  class AppKitSheetWindow extends NSWindow {
    static ObjCExposedMethods = {
      'cancelOperation:': { params: [NSObject], returns: interop.types.void },
    }
    static {
      registerGestureClass(this)
    }
    cancelOperation(_sender: NSObject) {
      sheetWindowCancels.get(this)?.()
    }
  }

  // Observe attachment directly, including an initially-open sheet mounted before
  // its anchor reaches a window. A hidden zero-size child adds no layout surface.
  class AppKitSheetAnchorObserver extends NSView {
    static ObjCExposedMethods = {
      viewDidMoveToWindow: { params: [], returns: interop.types.void },
    }
    static {
      registerGestureClass(this)
    }
    viewDidMoveToWindow() {
      super.viewDidMoveToWindow()
      sheetAnchorChanges.get(this)?.()
    }
  }

  function presentSheet(view: NSView, options: PropBag) {
    return createNativeSheet(view, options ?? {}, {
      makeContent: () =>
        NSView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 480, height: 1 } }),
      makeWindow(content, size, cancel) {
        const controller = NSViewController.alloc().init()

        controller.view = content

        const sheet = AppKitSheetWindow.alloc().initWithContentRectStyleMaskBackingDefer(
          { origin: { x: 0, y: 0 }, size },
          NSWindowStyleMask.Titled | NSWindowStyleMask.Closable,
          NSBackingStoreType.Buffered,
          false,
        )

        try {
          sheet.releasedWhenClosed = false
          sheet.contentViewController = controller
          sheetWindowCancels.set(sheet, cancel)
          return sheet
        } catch {
          try {
            sheet.close()
          } catch {}

          throw Error('Sheet construction failed')
        }
      },
      releaseWindow: (sheet) => {
        sheetWindowCancels.delete(sheet)
      },
      watchWindow(anchor, notify) {
        const observer = AppKitSheetAnchorObserver.alloc().initWithFrame({
          origin: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
        })

        observer.hidden = true
        sheetAnchorChanges.set(observer, notify)

        const cleanup = () => {
          sheetAnchorChanges.delete(observer)
          observer.removeFromSuperview()
        }

        try {
          anchor.addSubview(observer)
          return cleanup
        } catch {
          cleanup()
          throw Error('Sheet anchor unavailable')
        }
      },
      observeClose(window, notify) {
        const center = NSNotificationCenter.defaultCenter
        const token = center.addObserverForNameObjectQueueUsingBlock(
          'NSWindowWillCloseNotification',
          window,
          null,
          notify,
        )

        return () => center.removeObserver(token)
      },
      fittingSize: deps.popover.popupFittingSize,
    })
  }

  return {
    presentSheet,
  }
}
