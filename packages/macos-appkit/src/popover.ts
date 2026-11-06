import type { Roots } from './roots'
import type { RootDirectoryReader } from './root-directory'
import {
  NSNotificationCenter,
  NSPopover,
  NSPopoverBehavior,
  NSPopoverDidCloseNotification,
  NSRectEdge,
  NSView,
  NSViewController,
} from '@octane-xplat/platform/macos'

import type { PropBag, PopupOptions } from './model'

interface Dependencies {
  roots: Pick<Roots, 'createMacOSRoot'>
  directory: Pick<RootDirectoryReader, 'fontFamilyForView'>
}

export type Popover = ReturnType<typeof createPopover>

export function createPopover(deps: Dependencies) {
  const openPopups = new Set<any>()

  // preferredEdge is the anchor edge the popover attaches to: 'top' places the
  // panel above the anchor (its MaxY edge). Numeric NSRectEdge values are the
  // fallback when the bridged enum object is absent.
  function popoverEdge(placement: string | undefined) {
    const edges = (typeof NSRectEdge === 'object' && NSRectEdge ? NSRectEdge : {}) as {
      [key: string]: number
    }

    switch (placement) {
      case 'bottom': {
        return edges.MinYEdge ?? 1
      }
      case 'left': {
        return edges.MinXEdge ?? 0
      }
      case 'right': {
        return edges.MaxXEdge ?? 2
      }
      case 'top':
      default: {
        return edges.MaxYEdge ?? 3
      }
    }
  }

  function popupFittingSize(contentView: NSView) {
    try {
      const direct = contentView.fittingSize
      if (direct && direct.width > 0 && direct.height > 0) {
        return { width: direct.width, height: direct.height }
      }

      const child = contentView.subviews?.objectAtIndex?.(0)?.fittingSize
      if (child && child.width > 0 && child.height > 0) {
        return { width: child.width, height: child.height }
      }
    } catch (error) {
      console.error('[macos-popup] fitting-size measurement failed', error)
    }

    return null
  }

  function showAnchoredPopup(options: PopupOptions) {
    let anchor = options?.anchor
    if (
      !anchor ||
      !anchor.window ||
      typeof NSPopover === 'undefined' ||
      typeof NSViewController === 'undefined'
    ) {
      return null
    }

    // `at` anchors the popup to a window point in top-left coordinates instead
    // of the view's bounds — the fixed-position path for useLayer.
    const at = options?.at
    let relativeRect = anchor.bounds
    if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) {
      const container = anchor.window?.contentView ?? anchor
      anchor = container
      // NSView coordinates are y-up; flip the top-left point.
      const height = Number(container.frame?.size?.height ?? 0)
      relativeRect = {
        origin: { x: Number(at.x), y: height - Number(at.y) },
        size: { width: 0, height: 0 },
      }
    }

    const contentView = NSView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    })

    const root = deps.roots.createMacOSRoot(contentView, {
      fontFamily: deps.directory.fontFamilyForView(anchor),
    })
    const popup = {
      popover: null as any,
      contentView,
      closed: false,
      closeObserver: null as any,
      update(props: PropBag) {
        if (popup.closed) {
          return
        }

        root.render(options.component, props)
        const size = popupFittingSize(contentView)
        if (size) {
          popup.popover!.contentSize = size
        }
      },
      close(dismissed = false) {
        if (popup.closed) {
          return
        }

        popup.closed = true
        openPopups.delete(popup)
        if (popup.closeObserver) {
          try {
            NSNotificationCenter.defaultCenter.removeObserver(popup.closeObserver)
          } catch {}

          popup.closeObserver = null
        }

        try {
          popup.popover?.close()
        } catch (error) {
          console.error('[macos-popup] popover close failed', error)
        }

        try {
          root.unmount()
        } catch (error) {
          console.error('[macos-popup] popup root unmount failed', error)
        }

        if (dismissed) {
          try {
            options.onClose?.()
          } catch (error) {
            console.error('[macos-popup] onClose callback failed', error)
          }
        }
      },
    }

    try {
      root.render(options.component, options.props ?? {})
    } catch (error) {
      console.error('[macos-popup] popup render failed', error)
      try {
        root.unmount()
      } catch {}

      return null
    }

    const controller = NSViewController.alloc().init()
    controller.view = contentView
    const fit = popupFittingSize(contentView)
    if (fit) {
      controller.preferredContentSize = fit
    }

    const popover = NSPopover.alloc().init()
    popover.contentViewController = controller
    const behaviors = (typeof NSPopoverBehavior === 'undefined' ? {} : NSPopoverBehavior) as {
      [key: string]: number
    }

    // Transient closes on outside interaction — the AppKit-native feel for a
    // hint layer. An explicit lightDismiss:false keeps the layer open until
    // the leaf closes it. The leaf still owns close() for hover-intent
    // dismissal.
    popover.behavior =
      options?.lightDismiss === false
        ? (behaviors.ApplicationDefined ?? 2)
        : (behaviors.Transient ?? 1)

    popover.animates = options.animates ?? true
    popup.popover = popover
    openPopups.add(popup)
    popup.closeObserver =
      NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
        typeof NSPopoverDidCloseNotification === 'undefined'
          ? 'NSPopoverDidCloseNotification'
          : NSPopoverDidCloseNotification,
        popover,
        null,
        () => popup.close(true),
      )

    try {
      popover.showRelativeToRectOfViewPreferredEdge(
        relativeRect,
        anchor,
        popoverEdge(options.placement),
      )
    } catch (error) {
      console.error('[macos-popup] popover presentation failed', error)
      popup.close()
      return null
    }

    return popup
  }
  return {
    openPopups,
    popupFittingSize,
    showAnchoredPopup,
  }
}
