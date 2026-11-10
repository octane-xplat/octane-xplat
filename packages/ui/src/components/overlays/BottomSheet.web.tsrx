/** @jsxImportSource @octane-xplat/jsx/dom */
import { createPortal } from '../../internal/platform/native-portal.web.tsrx'
import { SheetContent } from './sheet-content.tsrx'
import { LayerDepthContext, LayerDepthProvider } from './layer-dismissal.tsrx'
import { styleRecord } from '../../internal/layout/style-merge'
import { SizeProvider } from '../layout/size-context'
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'

import type { BottomSheetProps } from '../../props'

import { cx } from '@octane-xplat/lib'
import { useThemeScheme } from '../../theme/theme-scheme'
import { normalizeSnapPoints } from './sheet-snap'
import { attachSheetDetents } from './sheet-detents.web'
import { isolateModalFocus } from './modal-focus.web'
import { applyEscapeProps } from './escape-props'
import type { JSX } from 'octane/jsx-runtime'

const BASE_SCRIM = 0.4

function sheetHeightStyle(
  height: BottomSheetProps['height'],
  snapCount: number,
): Record<string, any> {
  if (height == null || height === 'capped') {
    // 'capped' = 62dvh (Astryx budget). With snap points the detents
    // controller sizes the panel to the largest stop instead.
    return snapCount ? {} : { height: '62dvh' }
  }

  if (height === 'hug') {
    return snapCount ? {} : { maxHeight: '92dvh' }
  }

  if (height === 'tall') {
    return snapCount ? {} : { height: '92dvh' }
  }

  return { height: typeof height === 'number' ? `${height}px` : height }
}

/** The shared bottom panel: scrim (when modal), grabber + snap/swipe
 *  gestures, focus isolation, Escape discipline per `purpose`.
 *  Renders the declarative sheet's own children. */
function BottomSheetLayer(props: {
  sheet: BottomSheetProps
  panel: any
  onDismiss: () => void
}) @{
  const { sheet, panel } = props
  const layerDepth = useContext(LayerDepthContext)
  const dark = useThemeScheme() === 'dark'
  const layer = useRef<HTMLDivElement | null>(null)
  const panelEl = useRef<HTMLDivElement | null>(null)
  const backdrop = useRef<HTMLDivElement | null>(null)
  const dismiss = useRef(props.onDismiss)

  dismiss.current = props.onDismiss

  const hasScrim = sheet.hasScrim ?? true
  const purpose = sheet.purpose ?? 'info'

  const snapPoints = useMemo(
    () =>
      normalizeSnapPoints(sheet.snapPoints, typeof window === 'undefined' ? 0 : window.innerHeight),
    [JSON.stringify(sheet.snapPoints ?? [])],
  )

  const snapKey = snapPoints.join(',')

  // Focus isolation + Escape discipline only for the modal presentation.
  useEffect(() => {
    if (!hasScrim || !layer.current || !panelEl.current) {
      return
    }

    return isolateModalFocus(
      layer.current,
      panelEl.current,
      () => {
        if ((sheet.purpose ?? 'info') !== 'required') {
          dismiss.current()
        }
      },
      layerDepth,
    )
  }, [hasScrim, purpose])

  // Initialize the controller's offscreen offset before paint. A declarative
  // parking transform would be retained as the imperative translate's base.
  useLayoutEffect(() => {
    const el = panelEl.current

    if (!el) {
      return
    }

    // The parked entrance transform is temporary, not a base transform
    // for the gesture controller's composed translations.
    el.style.transform = ''

    const ctl = attachSheetDetents(el, snapPoints, () => dismiss.current(), {
      dismissible: purpose !== 'required',
      swipeOnly: !snapPoints.length,
      onOffset: (offset, vh) => {
        const shade = backdrop.current

        if (shade) {
          shade.style.opacity = String(Math.max(0, BASE_SCRIM * (1 - offset / vh)))
        }
      },
    })

    return () => ctl.detach()
  }, [snapKey, purpose])

  <div
    ref={layer}
    data-vx-modal-layer={hasScrim ? '' : undefined}
    className={cx('vx-sheet-layer', 'vx-bottom-sheet-layer', dark && 'dark')}
  >
    {hasScrim && (
      <div
        ref={backdrop}
        className="vx-sheet-backdrop"
        style={{ opacity: BASE_SCRIM }}
        onClick={() => {
          if (purpose === 'info') {
            dismiss.current()
          }
        }}
      />
    )}
    <div
      ref={(el: any) => {
        panelEl.current = el
        applyEscapeProps(el, sheet)
      }}
      id={sheet.id}
      className={cx('vx-sheet', 'vx-bottom-sheet', sheet.className)}
      role={hasScrim ? 'dialog' : 'region'}
      aria-modal={hasScrim ? true : undefined}
      aria-label={sheet.label}
      style={{
        ...styleRecord(sheet.style),
        ...sheetHeightStyle(sheet.height, snapPoints.length),
      }}
      {...sheet.web}
    >
      <LayerDepthProvider value={layerDepth + 1}>
        <SizeProvider value={null}>
          <SheetContent>{panel}</SheetContent>
        </SizeProvider>
      </LayerDepthProvider>
    </div>
  </div>
}

/** Declarative in-window bottom sheet with controlled or uncontrolled visibility. */
export function BottomSheet(props: BottomSheetProps): JSX.Element | null @{
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const open = props.isOpen ?? internal
  const requestChange = (isOpen: boolean) => {
    if (props.isOpen === undefined) {
      setInternal(isOpen)
    }

    props.onOpenChange?.(isOpen)
  }

  @if (open) {
    <>
      {createPortal(
        <BottomSheetLayer
          sheet={props}
          panel={props.children}
          onDismiss={() => requestChange(false)}
        />,
        document.body,
      )}
    </>
  }
}
