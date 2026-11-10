/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useEffect, useRef, useState } from 'octane'
import { createPortal } from '../../internal/platform/native-portal.tsrx'
import { SizeProvider } from '../layout/size-context'
import type { BottomSheetProps } from '../../props'

import { cx } from '@octane-xplat/lib'
import { themeSchemeClasses } from '../../theme/theme-host'
import { normalizeSnapPoints } from './sheet-snap'
import { attachSheetDetents, type SheetDetentsController } from './sheet-detents.gtk'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'

/** The panel's window-height resolver — the sheet docks in a full-window
 *  overlay layer, so snap fractions resolve against the window's height. */
const sheetVh = (view: any): number => view?.get_root?.()?.get_height?.() || 0

/** `height` budget → px; null keeps the content-sized panel. */
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

/** The sheet panel shared by the declarative leaf and
 *  the imperative service: bottom-docked chrome (grabber + content) inside
 *  an overlay layer's target. Detents/swipe-to-dismiss attach to the
 *  grabber row; `requestDismiss` is the host's user-dismissal channel —
 *  the swipe's slide-out has already run when it fires. */
export function GtkSheetPanel(props: {
  label?: string
  height?: BottomSheetProps['height']
  snapPoints?: BottomSheetProps['snapPoints']
  purpose?: BottomSheetProps['purpose']
  layerDepth: number
  className?: any
  style?: any
  id?: string
  requestDismiss: () => void
  children?: any
}): unknown @{
  const panel = useRef<any>(null)
  const grabber = useRef<any>(null)
  const dismiss = useRef(props.requestDismiss)

  dismiss.current = props.requestDismiss

  useEffect(() => {
    const view = panel.current

    if (!view) {
      return
    }

    let ctl: SheetDetentsController | null = null
    const setup = () => {
      const vh = () => sheetVh(view)
      const detentFractions = props.snapPoints?.length
        ? normalizeSnapPoints(props.snapPoints, vh())
        : []

      const sized = detentFractions.length ? null : sheetHeightDips(props.height, vh())

      try {
        view.style.height = sized == null ? undefined : Math.round(sized)
      } catch {}

      ctl = attachSheetDetents(
        view,
        grabber.current,
        detentFractions,
        vh,
        () => dismiss.current?.(),
        {
          dismissible: (props.purpose ?? 'info') !== 'required',
          swipeOnly: !detentFractions.length,
        },
      )

      ctl.enter()
    }

    // Snap fractions resolve against the window height — if the view is
    // not mapped yet, wait for the map signal so `vh` reads real pixels.
    if (sheetVh(view) > 0) {
      setup()
    } else {
      const onLoaded = () => {
        view.off?.('loaded', onLoaded)
        setup()
      }

      view.on?.('loaded', onLoaded)
    }

    return () => ctl?.detach()
  }, [props.height, JSON.stringify(props.snapPoints ?? []), props.purpose])

  <masonview
    ref={(v: any) => {
      panel.current = v
    }}
    id={props.id}
    className={cx('vx-sheet-host', 'vx-bottom-sheet-host', themeSchemeClasses(), props.className)}
    style={mergeStyle({ display: 'flex', flexDirection: 'column' }, styleRecord(props.style))}
    accessibilityLabel={props.label ?? ''}
  >
    <masonview
      ref={(v: any) => {
        grabber.current = v
      }}
      id={props.id != null ? props.id + '-grabber' : undefined}
      className="vx-sheet-grabber"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingBottom: 8,
      }}
      accessibilityLabel="Drag to resize sheet"
    >
      <label className="vx-sheet-grip">―</label>
    </masonview>
    <LayerDepthProvider value={props.layerDepth}>
      <SizeProvider value={null}>{props.children}</SizeProvider>
    </LayerDepthProvider>
  </masonview>
}

/** Declarative in-window bottom sheet with controlled or uncontrolled visibility. */
export function BottomSheet(props: BottomSheetProps): unknown @{
  const sentinel = useRef<any>(null)
  const [layer, setLayer] = useState<any>(null)
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const open = props.isOpen ?? internal
  const requestChange = (isOpen: boolean) => {
    if (props.isOpen === undefined) {
      setInternal(isOpen)
    }

    props.onOpenChange?.(isOpen)
  }

  const shown = useRef<any>(null)
  const releasing = useRef(false)
  const dismiss = useRef(requestChange)

  dismiss.current = requestChange

  const dismissal = useLayerDismissal({
    active: !!open,
    isPresent: () => !!shown.current,
    dismiss: () => requestChange(false),
    behavior: props.purpose === 'required' ? 'block' : 'close',
    getFocusTarget: () => props.finalFocusRef?.current,
    getHost: () => sentinel.current,
  })

  /** Slide the panel below the window edge, then release the layer —
   *  the RootLayout 'closed' equivalent. Instant when the swipe already
   *  parked the panel off-screen or animations are disabled. */
  const release = () => {
    const l = shown.current

    if (!l) {
      return
    }

    shown.current = null

    const finish = () => {
      try {
        l.dispose()
      } catch {}

      setLayer(null)
    }

    const panelView = l.target?.get_first_child?.()
    let animated = false

    try {
      const vh = sheetVh(panelView)

      if (vh > 0 && (Number(panelView?.translateY) || 0) < vh) {
        const sliding = panelView?.animate?.({
          translate: { x: 0, y: vh },
          duration: 160,
        })

        if (sliding?.then) {
          animated = true
          void sliding.then(finish, finish)
        }
      }
    } catch {}

    if (!animated) {
      finish()
    }
  }

  /** User-initiated dismissal: the surface goes away like the RootLayout
   *  host does — even if a controlled parent ignores `onOpenChange`. */
  const dismissSurface = () => {
    if (releasing.current) {
      return
    }

    releasing.current = true
    release()
    dismiss.current?.(false)
  }

  useEffect(() => {
    const view = sentinel.current

    if (!view) {
      return
    }

    if (!open) {
      if (shown.current) {
        release()
      }

      releasing.current = false
      return
    }

    if (shown.current) {
      return
    }

    const purpose = props.purpose ?? 'info'
    const hasScrim = props.hasScrim ?? true
    const l = view.createOverlayLayer({
      modal: hasScrim,
      scrim: hasScrim,
      align: { h: 'fill', v: 'end' },
      onScrimPress: purpose === 'info' ? dismissSurface : undefined,
    })

    shown.current = l
    setLayer(l)
    l.setVisible(true)
  }, [open, props.hasScrim, props.purpose])

  useEffect(
    () => () => {
      try {
        shown.current?.dispose?.()
      } catch {}

      shown.current = null
    },
    [],
  )

  // Zero-size sentinel — the sheet resolves its overlay host from the
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
    {layer
      ? createPortal(
          <GtkSheetPanel
            id={props.id}
            label={props.label}
            height={props.height}
            snapPoints={props.snapPoints}
            purpose={props.purpose}
            layerDepth={dismissal.depth}
            className={props.className}
            style={props.style}
            requestDismiss={dismissSurface}
          >
            {props.children}
          </GtkSheetPanel>,
          layer.target,
        )
      : null}
  </>
}
