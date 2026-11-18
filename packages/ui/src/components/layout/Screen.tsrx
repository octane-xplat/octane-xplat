/** @jsxImportSource @octane-xplat/jsx */
import { RootLayout } from '@nativescript/core'
import { attachForeignChild, detachForeignChild } from '@octane-xplat/nativescript-octane'
import { useEffect, useMemo, useRef } from 'octane'
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ScreenProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import {
  registerRootLayout,
  registerScreenOverlayHost,
  unregisterRootLayout,
  unregisterScreenOverlayHost,
} from './root-layout'
import { attachTapToBlur } from '../../internal/keyboard/tap-to-blur'

// The screen shell is a Mason view so a first screen can be prerendered
// natively. Overlays layer over it in a separate RootLayout (decision #163):
// the shell ref attaches that host outside reconciliation, after the commit
// and before any descendant effect opens an overlay. The native startup
// producer never commits refs, so its tree contains only Mason views.
// Children go in a single inner column (decision #39); the host is the
// shell's only other child, positioned over it by `.vx-screen-overlays`.
// Both hosts use their assigned bounds without native safe-area adjustment;
// SafeArea owns padding.
const OVERLAY_HOST_STYLE = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }

function createOverlayHost(): RootLayout {
  const host = new RootLayout()

  host.className = 'vx-screen-overlays'
  host.iosIgnoreSafeArea = true
  // Empty host areas pass touches to the screen content beneath.
  host.isPassThroughParentEnabled = true
  // Inline local styles, as the driver writes them, bind to the Mason leaf.
  for (const [key, value] of Object.entries(OVERLAY_HOST_STYLE)) {
    Reflect.set(host.style, key, value)
  }
  // Overlay and sheet services mount on the most recently loaded host.
  host.on('loaded', () => registerRootLayout(host))
  host.on('unloaded', () => unregisterRootLayout(host))
  return host
}

/**
 * Route-level container providing the screen's safe-area/status context. Import from `@octane-xplat/ui`.
 *
 * @see ScreenProps, SafeAreaProps.
 */
export function Screen(props: ScreenProps): unknown @{
  const shellView = useRef<any>(null)

  useEffect(() => {
    if (shellView.current) {
      applyEscapeProps(shellView.current, props)
    }
  }, [props.ios, props.android, props.web])

  const shellRef = useMemo(() => {
    let shell: any
    let host: RootLayout | undefined

    return (view: any) => {
      if (view === shell) {
        return
      }

      if (shell && host) {
        unregisterScreenOverlayHost(shell)
        unregisterRootLayout(host)
        detachForeignChild(host)
        host = undefined
      }

      shell = view
      shellView.current = view
      if (view) {
        host = createOverlayHost()
        attachForeignChild(view, host)
        registerScreenOverlayHost(view, host)
      }
    }
  }, [])

  <masonview
    iosIgnoreSafeArea={true}
    className="vx-screen-shell"
    id={props.id}
    ref={shellRef}
  >
    <masonview
      iosIgnoreSafeArea={true}
      className={cx('vx-screen-content', props.className)}
      style={mergeStyle({ display: 'flex' }, props.style)}
      ref={(v: any) => {
        if (v) {
          attachTapToBlur(v)
        }
      }}
    >
      {props.children}
    </masonview>
  </masonview>
}
