/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { SheetContent } from './sheet-content.tsrx'
import type { PercentLengthType } from '@nativescript/core'
import { useEffect, useRef, useState } from 'octane'
import { GridLayout, Screen, isAndroid, isIOS } from '@nativescript/core'
import { createPortal } from '../../internal/platform/native-portal'
import { SizeProvider } from '../layout/size-context'
import type { BottomSheetProps } from '../../props'

import { cx } from '@octane-xplat/lib'
import { applyThemeClasses } from '../../theme/theme-host'
import { rootLayoutFor } from '../layout/root-layout'
import { createOverlayLifetime } from './overlay-lifetime'
import { attachSheetDetents, type SheetDetentsController } from './sheet-detents'
import { normalizeSnapPoints } from './sheet-snap'
import {
  createKeyboardOverlayHost,
  keyboardOverlayAnimation,
} from '../../internal/keyboard/keyboard-overlay-host'

import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { attachTapToBlur } from '../../internal/keyboard/tap-to-blur'

interface ToastOwner {
  hasChild?(v: any): boolean
  getPopupIndex?(v: any): number
  removeChild?(v: any): void
  close?(v: any): Promise<unknown> | void
}

const screenVh = () => Screen.mainScreen.heightDIPs

/** `height` budget → dips; null keeps the content-sized panel. */
function sheetHeightDips(height: BottomSheetProps['height'], vh: number): number | null {
  if (height == null || height === 'capped') {
    return vh * 0.62
  }

  if (height === 'hug') {
    return null
  }

  if (height === 'tall') {
    return vh * 0.92
  }

  if (typeof height === 'number') {
    return height
  }

  const trimmed = String(height).trim()

  if (trimmed.endsWith('%')) {
    return (parseFloat(trimmed) / 100) * vh
  }

  return parseFloat(trimmed) || null
}

/** The sheet's content — rendered in its portal host. */
function BottomSheetBody(props: { children?: any; layerDepth: number }) @{
  <>
    <LayerDepthProvider value={props.layerDepth}>
      <SizeProvider value={null}>{props.children}</SizeProvider>
    </LayerDepthProvider>
  </>
}

/** One open bottom-sheet host on a RootLayout: theme classes, bottom
 *  docking, grabber + snap/swipe gestures, keyboard lift, tap-to-blur.
 *  Shared by the declarative standalone and the imperative service. */
export function attachBottomSheetHost(
  host: GridLayout,
  props: {
    label?: string
    height?: BottomSheetProps['height']
    snapPoints?: BottomSheetProps['snapPoints']
    purpose?: BottomSheetProps['purpose']
    className?: any
    style?: any
    ios?: Record<string, any>
    android?: Record<string, any>
  },
  lifetime: ReturnType<typeof createOverlayLifetime>,
  closeNow: () => void,
): () => void {
  const purpose = props.purpose ?? 'info'

  host.horizontalAlignment = 'stretch'
  host.verticalAlignment = 'bottom'
  host.accessibilityLabel = props.label ?? ''
  if (props.style) {
    Object.assign(host.style, props.style)
  }

  Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined)

  const detentFractions = props.snapPoints?.length
    ? normalizeSnapPoints(props.snapPoints, screenVh())
    : []

  // Snap points fix the height to the largest stop; otherwise apply the
  // height budget (capped default keeps content from covering the screen).
  const sizedHeight = detentFractions.length ? null : sheetHeightDips(props.height, screenVh())

  if (sizedHeight != null) {
    host.height = sizedHeight
  }

  const ctl: SheetDetentsController = attachSheetDetents(host, detentFractions, closeNow, {
    dismissible: purpose !== 'required',
    swipeOnly: !detentFractions.length,
  })

  lifetime.own(ctl.detach)
  lifetime.own(attachTapToBlur(host))
  return () => ctl.enter()
}

/** Declarative in-window bottom sheet with controlled or uncontrolled visibility. */
export function BottomSheet(props: BottomSheetProps): unknown @{
  const sentinel = useRef<any>(null)
  const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const open = props.isOpen ?? internal
  const requestChange = (isOpen: boolean) => {
    if (props.isOpen === undefined) {
      setInternal(isOpen)
    }

    props.onOpenChange?.(isOpen)
  }

  const shown = useRef<{
    host: GridLayout
    lifetime: ReturnType<typeof createOverlayLifetime>
  } | null>(null)

  const dismissal = useLayerDismissal({
    active: !!open,
    isPresent: () => !!shown.current,
    dismiss: () => requestChange(false),
    behavior: props.purpose === 'required' ? 'block' : 'close',
    getFocusTarget: () => props.finalFocusRef?.current,
    getHost: () => sentinel.current,
  })

  const dismiss = useRef(requestChange)

  dismiss.current = requestChange

  useEffect(() => {
    const cur = shown.current

    if (!open) {
      cur?.lifetime.close()
      return
    }

    const rl = rootLayoutFor(sentinel.current)

    if (!rl) {
      return
    }

    if (cur) {
      return
    }

    const { host, panel, bindKeyboard } = createKeyboardOverlayHost()
    const unbindTheme = applyThemeClasses(
      panel,
      cx('vx-sheet-host', 'vx-bottom-sheet-host', props.className),
    )

    const lifetime = createOverlayLifetime(rl, host, null, 'BottomSheet', (dismissed) => {
      if (shown.current?.host === host) {
        shown.current = null
        setPortalHost(null)
      }

      if (dismissed) {
        dismiss.current?.(false)
      }
    })

    lifetime.own(unbindTheme)
    lifetime.own(bindKeyboard())

    const purpose = props.purpose ?? 'info'
    const hasScrim = props.hasScrim ?? true
    const enter = attachBottomSheetHost(panel, props, lifetime, () => {
      // User dismissal goes through RootLayout close → 'closed' →
      // lifetime reports dismissed → onOpenChange(false).
      const owner = host.parent as ToastOwner | undefined

      owner?.close?.(host)?.catch?.((error: unknown) => {
        console.error('[BottomSheet] close failed', error)
      })
    })

    shown.current = { host, lifetime }
    setPortalHost(panel)
    lifetime.open(
      {
        animation: keyboardOverlayAnimation(),
        ...(hasScrim ? { shadeCover: { opacity: 0.4, tapToClose: purpose === 'info' } } : {}),
      },
      () => enter(),
    )
  }, [
    open,
    props.children,
    props.className,
    props.style,
    props.hasScrim,
    props.purpose,
    props.height,
    JSON.stringify(props.snapPoints ?? []),
    props.ios,
    props.android,
  ])

  useEffect(() => () => shown.current?.lifetime.close(), [])

  // Zero-size sentinel — the sheet resolves its owning RootLayout from the
  // declaring component's ancestry.

  <>
    <masonview
      ref={(v: any) => {
        sentinel.current = v
      }}
      style={mergeStyle(
        { flexDirection: 'column' },
        mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
      )}
    />
    {open && portalHost
      ? createPortal(
          <BottomSheetBody layerDepth={dismissal.depth}>{props.children}</BottomSheetBody>,
          portalHost,
        )
      : null}
  </>
}
