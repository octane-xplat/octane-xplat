/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useRef, useState } from 'octane'
import { GridLayout } from '@nativescript/core'
import { createPortal } from '../../internal/platform/native-portal.tsrx'
import type { LightboxProps, LightboxMedia } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyThemeClasses } from '../../theme/theme-host'
import { rootLayoutFor } from '../layout/root-layout'
import { createOverlayLifetime } from './overlay-lifetime'
import { Icon } from '../media/Icon.tsrx'
import { Pressable } from '../actions/Pressable.tsrx'
import { View } from '../layout/View.tsrx'
import { usePanGesture$, usePinchGesture$ } from '../../gestures/hooks.tsrx'
import { compete } from '../../gestures/composition'
import { Text } from '../content/Text.tsrx'

const clampIndex = (i: number, count: number) =>
  count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1)

/** The overlay-root body: dark stage, centered media, swipe to navigate,
 *  buttons + counter + caption chrome. */
function LightboxPanel(props: {
  media: LightboxMedia[]
  index: number
  setIndex: (i: number) => void
  onClose: () => void
  hasZoom: boolean
  ios?: Record<string, any>
  android?: Record<string, any>
  className?: any
}) @{
  const { media, index } = props
  const count = media.length
  const item = media[index]
  const [zoomed, setZoomed] = useState(false)
  const isVideo = item?.type === 'video'
  const stage = useRef<any>(null)

  const imgView = useRef<any>(null)
  const panAcc = useRef({ x: 0, y: 0 })
  const panBase = useRef({ x: 0, y: 0 })
  const scale = useRef(1)
  const pinchBase = useRef(1)
  const apply = () => {
    const el = imgView.current

    if (el) {
      el.scaleX = el.scaleY = scale.current
      el.translateX = panAcc.current.x
      el.translateY = panAcc.current.y
    }
  }

  const drag = usePanGesture$({
    axis: 'both',
    onStart() {
      panBase.current = panAcc.current
    },
    onUpdate(sample) {
      if (scale.current <= 1) {
        return
      }

      panAcc.current = {
        x: panBase.current.x + sample.translation.x,
        y: panBase.current.y + sample.translation.y,
      }

      apply()
    },
    onEnd(sample) {
      if (
        scale.current > 1 ||
        Math.abs(sample.translation.x) < 48 ||
        Math.abs(sample.translation.x) <= Math.abs(sample.translation.y)
      ) {
        return
      }

      props.setIndex(clampIndex(index + (sample.translation.x < 0 ? 1 : -1), count))
    },
  })

  const pinch = usePinchGesture$({
    enabled: props.hasZoom && !isVideo,
    onStart() {
      pinchBase.current = scale.current
    },
    onUpdate(sample) {
      scale.current = Math.max(1, Math.min(4, pinchBase.current * sample.scale))
      setZoomed(scale.current > 1)
      apply()
    },
  })

  const toggleZoom = () => {
    scale.current = zoomed ? 1 : 2
    setZoomed(scale.current > 1)
    panAcc.current = { x: 0, y: 0 }
    apply()
  }

  useEffect(() => {
    scale.current = 1
    panAcc.current = { x: 0, y: 0 }
    setZoomed(false)
    apply()
  }, [item?.src])

  <View
    ref={(v: any) => {
      stage.current = v
    }}
    className={cx('vx-lightbox', props.className)}
    gestures={compete(pinch, drag)}
    accessibilityLabel={item?.alt ?? 'Media viewer'}
    style={{
      display: 'grid',
      gridTemplateRows: '1fr',
      gridTemplateColumns: '1fr',
      width: '100%',
      height: '100%',
    }}
  >
    {/* Tap the backdrop edges to close; the centered media eats its own
     *  taps through the double-tap zoom. */}
    {count > 0 && (
      <masonview
        style={mergeStyle(
          { display: 'grid', gridTemplateRows: '1fr auto', gridTemplateColumns: '1fr' },
          { justifySelf: 'stretch', alignSelf: 'stretch' },
        )}
      >
        <masonview
          style={mergeStyle(
            { display: 'grid' },
            { gridRow: '1', justifySelf: 'stretch', alignSelf: 'stretch' },
          )}
        >
          {item != null &&
            (isVideo ? (
              // No in-package video player — @octane-xplat/video owns the
              // video widget. Honest fallback: show the alt text.
              <masonview
                style={mergeStyle(
                  { flexDirection: 'column' },
                  mergeStyle({ display: 'flex' }, { justifySelf: 'center', alignSelf: 'center' }),
                )}
                className="vx-lightbox-video-fallback"
              >
                <label className="vx-lightbox-caption" textWrap={true}>
                  {item.alt}
                </label>
              </masonview>
            ) : (
              <Pressable onDoublePress={props.hasZoom ? toggleZoom : undefined}>
                <image
                  ref={(v: any) => {
                    imgView.current = v
                  }}
                  src={item.src}
                  stretch="aspectFit"
                  className="vx-lightbox-media"
                  accessibilityLabel={item.alt}
                  style={{ justifySelf: 'center', alignSelf: 'center' }}
                />
              </Pressable>
            ))}
        </masonview>
        <masonview
          style={mergeStyle(
            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            mergeStyle({ display: 'flex' }, { gridRow: '2' }),
          )}
          className="vx-lightbox-footer"
        >
          <Pressable
            className="vx-lightbox-nav"
            accessibilityLabel="Previous"
            onPress={() => props.setIndex(Math.max(index - 1, 0))}
            disabled={index <= 0}
          >
            <Icon name="xplat-chevron-left" />
          </Pressable>
          <masonview
            style={mergeStyle(
              { flexDirection: 'column', alignItems: 'center', flexGrow: 1 },
              { display: 'flex' },
            )}
          >
            {count > 1 && <Text className="vx-lightbox-counter">{`${index + 1} of ${count}`}</Text>}
            {item?.caption != null &&
              (typeof item.caption === 'string' ? (
                <Text className="vx-lightbox-caption">{item.caption}</Text>
              ) : (
                item.caption
              ))}
          </masonview>
          <masonview
            style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
          >
            <Pressable
              className="vx-lightbox-nav"
              accessibilityLabel="Next"
              onPress={() => props.setIndex(Math.min(index + 1, count - 1))}
              disabled={index >= count - 1}
            >
              <Icon name="xplat-chevron-right" />
            </Pressable>
            <Pressable
              className="vx-lightbox-close"
              accessibilityLabel="Close"
              onPress={() => props.onClose()}
            >
              <Icon name="xplat-close" />
            </Pressable>
          </masonview>
        </masonview>
      </masonview>
    )}
  </View>
}

/** Full-screen media viewer (Astryx `Lightbox`), native leaf — a dedicated
 *  portal host on the declaring component's RootLayout, shaded + tap-to-
 *  close through the RootLayout scrim, swipe gestures for prev/next,
 *  double-tap zoom on images. `type:'video'` falls back to alt text — the
 *  video widget lives in the `@octane-xplat/video` leaf package. */
export function Lightbox(props: LightboxProps): unknown @{
  const sentinel = useRef<any>(null)
  const shown = useRef<{
    host: GridLayout
    lifetime: ReturnType<typeof createOverlayLifetime>
  } | null>(null)

  const [internal, setInternal] = useState(props.defaultIndex ?? 0)
  const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
  const [, setPanelVersion] = useState(0)
  const indexRef = useRef(internal)
  const mediaRef = useRef(props.media)
  const dismiss = useRef(props.onOpenChange)

  dismiss.current = props.onOpenChange

  const onIndexChange = useRef(props.onIndexChange)

  onIndexChange.current = props.onIndexChange

  const count = props.media.length
  const index = clampIndex(props.index ?? internal, count)

  indexRef.current = index
  mediaRef.current = props.media

  const setIndex = (i: number) => {
    const clamped = clampIndex(i, count)

    if (props.index == null) {
      setInternal(clamped)
    }

    if (clamped !== indexRef.current) {
      onIndexChange.current?.(clamped)
    }

    indexRef.current = clamped
    setPanelVersion((version) => version + 1)
  }

  useEffect(() => {
    const cur = shown.current

    if (!props.isOpen || count === 0) {
      cur?.lifetime.close()
      return
    }

    if (cur) {
      return
    }

    const rl = rootLayoutFor(sentinel.current)

    if (!rl) {
      return
    }

    const host = new GridLayout()
    const unbindTheme = applyThemeClasses(host, 'vx-lightbox-host')

    host.horizontalAlignment = 'stretch'
    host.verticalAlignment = 'stretch'

    const lifetime = createOverlayLifetime(rl, host, null, 'Lightbox', (dismissed) => {
      if (shown.current?.host === host) {
        shown.current = null
        setPortalHost(null)
      }

      if (dismissed) {
        dismiss.current?.(false)
      }
    })

    lifetime.own(unbindTheme)
    shown.current = { host, lifetime }
    setPortalHost(host)
    lifetime.open({
      shadeCover: { opacity: 0.85, tapToClose: true },
      animation: {
        enterFrom: { opacity: 0, duration: 160 },
        exitTo: { opacity: 0, duration: 140 },
      },
    })
  }, [props.isOpen, count])

  useEffect(() => () => shown.current?.lifetime.close(), [])

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
    {props.isOpen && count > 0 && portalHost
      ? createPortal(
          <LightboxPanel
            media={mediaRef.current}
            index={indexRef.current}
            setIndex={setIndex}
            onClose={() => dismiss.current(false)}
            hasZoom={props.hasZoom ?? true}
            className={props.className}
          />,
          portalHost,
        )
      : null}
  </>
}
