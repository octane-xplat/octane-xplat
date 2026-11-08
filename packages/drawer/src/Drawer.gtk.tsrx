/** @jsxImportSource @octane-xplat/jsx */
import Gdk from 'gi://Gdk?version=4.0'
import Gtk from 'gi://Gtk?version=4.0'
import { useEffect, useRef, useState } from 'octane'
import {
  createPortal as createUniversalPortal,
  type UniversalRenderable,
} from 'octane/universal/native'

import { cx } from '@octane-xplat/lib'
import * as gtkUi from '@octane-xplat/ui'
import { mergeStyle } from './style-merge'
import type { DrawerProps } from './props'

const createPortal = (children: unknown, target: unknown) =>
  createUniversalPortal(children as UniversalRenderable, target)

// `themeSchemeClasses` is a gtk/macos barrel export — the package's default
// types (what the shared cross-leaf typecheck resolves) do not declare it.
// Reading through the namespace keeps one ui module instance in the bundle,
// so the root Theme's scope class and the resolved scheme reach the
// detached panel host the same way they do for ui's own overlay leaves.
const themeSchemeClasses: () => string =
  typeof gtkUi === 'object' &&
  gtkUi !== null &&
  'themeSchemeClasses' in gtkUi &&
  typeof gtkUi.themeSchemeClasses === 'function'
    ? gtkUi.themeSchemeClasses
    : () => ''

/** Open drawer registrations, in overlay creation order — the Gtk.Overlay
 *  stacks layer children in add order, so the last entry is the topmost
 *  drawer. Escape arbitration happens entirely in GTK propagation: the
 *  renderer's eager window-level key controller forwards Escape to the
 *  shared layer stack first (ui dialogs, sheets and popovers claim it while
 *  they sit on top), and the drawer's own bubble controller — added later
 *  on the same window — only sees the key when no registered ui layer
 *  claimed it. Among drawers, only the topmost dismisses. A ui layer
 *  registered before an opening drawer keeps Escape priority while
 *  covered: the leaf cannot inspect the ui stack's entries, which is the
 *  one ordering difference from the old shared-stack leaf. */
const drawerLayers: { root: unknown }[] = []
const topDrawer = (root: unknown): { root: unknown } | undefined => {
  for (let i = drawerLayers.length - 1; i >= 0; i--) {
    if (drawerLayers[i].root === root) {
      return drawerLayers[i]
    }
  }

  return undefined
}

/** Edge-docked panel over a modal scrim (Astryx `Drawer`), GTK leaf. The
 *  open state mounts a modal overlay layer — the scrim covers the window
 *  and the panel docks start and fills height — because GTK's `masonview`
 *  falls back to `Gtk.Box` emulation (no overlapping grid cells). `main`
 *  renders inline. Scrim presses and Escape request dismissal; modal
 *  suppression keeps pointer input off the covered content. */
export function Drawer(props: DrawerProps): unknown @{
  const latest = useRef(props)

  latest.current = props

  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const open = props.open ?? internal
  const sentinel = useRef<any>(null)
  const [layer, setLayer] = useState<any>(null)
  const requestDismiss = () => {
    if (latest.current.open === undefined) {
      setInternal(false)
    }

    latest.current.onOpenChange?.(false)
    latest.current.onDismiss?.()
  }

  const dismiss = useRef(requestDismiss)

  dismiss.current = requestDismiss

  useEffect(() => {
    const view = sentinel.current

    if (!view || !open) {
      return
    }

    const l = view.createOverlayLayer({
      modal: true,
      scrim: true,
      align: { h: 'start', v: 'fill' },
      onScrimPress: () => dismiss.current(),
    })

    setLayer(l)
    l.setVisible(true)

    const root = view.get_root?.()
    const entry = { root }
    let keys: any = null

    if (typeof root?.add_controller === 'function') {
      drawerLayers.push(entry)
      keys = new Gtk.EventControllerKey()
      keys.connect('key-pressed', (_controller: any, keyval: number) => {
        if (keyval !== Gdk.KEY_Escape || topDrawer(root) !== entry) {
          return false
        }

        dismiss.current()
        return true
      })

      root.add_controller(keys)
    }

    return () => {
      const index = drawerLayers.indexOf(entry)

      if (index >= 0) {
        drawerLayers.splice(index, 1)
      }

      try {
        if (keys) {
          root.remove_controller(keys)
        }
      } catch {
        // The window is already gone; GTK drops orphaned controllers.
      }

      l.dispose()
      setLayer(null)
    }
  }, [open])

  <>
    {props.main}
    <masonview
      id={props.id}
      ref={(v: any) => {
        sentinel.current = v
      }}
      style={mergeStyle(
        { flexDirection: 'column' },
        mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
      )}
    />
    {open && layer
      ? createPortal(
          <masonview
            className={cx('vx-drawer-panel', themeSchemeClasses(), props.className)}
            style={mergeStyle(
              // The portal target is a Gtk.Box — flexGrow is what
              // expands a child to fill its height there.
              { flexDirection: 'column', flexGrow: 1, height: '100%' },
              [{ display: 'flex', width: props.width ?? 280 }, props.style],
            )}
            accessibilityLabel={props.accessibilityLabel ?? 'Navigation'}
          >
            {props.drawer}
          </masonview>,
          layer.target,
        )
      : null}
  </>
}
