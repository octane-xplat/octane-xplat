/** @jsxImportSource @octane-xplat/jsx/dom */
import { createPortal } from '../../internal/platform/native-portal.web.tsrx'
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { LightboxMedia, LightboxProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { isolateModalFocus } from './modal-focus.web'
import { applyEscapeProps } from './escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import { Pressable } from '../actions/Pressable.web.tsrx'
import { useInteractionHost } from '../../gestures/host.web.tsrx'
import { usePanGesture$, usePinchGesture$ } from '../../gestures/hooks.tsrx'
import { compete } from '../../gestures/composition'
import { Text } from '../content/Text.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

const clampIndex = (i: number, count: number) =>
  count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1)

/** The open viewer — rendered once per Lightbox while `isOpen`. Handles
 *  keyboard nav, scroll lock, focus isolation, and image zoom/pan. */
function LightboxLayer(props: {
  media: LightboxMedia[]
  index: number
  setIndex: (i: number) => void
  onClose: () => void
  hasZoom: boolean
  hasAutoPlay: boolean
  finalFocusRef?: { current: any }
  className?: any
  style?: any
  id?: string
  web?: Record<string, any>
}) @{
  const { media, index } = props
  const count = media.length
  const navigation = useRef({ index, count })

  navigation.current = { index, count }

  const item = media[index]
  const layer = useRef<HTMLDivElement | null>(null)
  const stage = useRef<HTMLDivElement | null>(null)
  const imgEl = useRef<HTMLImageElement | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const pan = useRef({ x: 0, y: 0 })
  const dragBase = useRef({ x: 0, y: 0 })
  const scale = useRef(1)
  const pinchBase = useRef(1)
  const onClose = useRef(props.onClose)

  onClose.current = props.onClose

  const setIndex = useRef(props.setIndex)

  setIndex.current = props.setIndex

  const isVideo = item?.type === 'video'
  const zoomOn = (props.hasZoom ?? true) && !isVideo

  const next = useCallback(() => {
    setIndex.current(
      clampIndex(props.index + 1, count) === props.index ? props.index : props.index + 1,
    )
  }, [props.index, count])

  const prev = useCallback(() => {
    setIndex.current(props.index - 1 >= 0 ? props.index - 1 : props.index)
  }, [props.index])

  // The modal lease belongs to this mounted viewer, not each image. Rebinding
  // it after navigation would capture a viewer control as the return target.
  useEffect(() => {
    const el = layer.current
    const panel = stage.current

    if (!el || !panel) {
      return
    }

    const restoreScroll = document.documentElement.style.overflow || ''

    document.documentElement.style.overflow = 'hidden'

    const releaseFocus = isolateModalFocus(el, panel, () => {
      const target = props.finalFocusRef?.current

      onClose.current()
    })

    const rtl = getComputedStyle(el).direction === 'rtl'
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return
      }

      const { index, count } = navigation.current
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
      const back = rtl ? 'ArrowRight' : 'ArrowLeft'

      if (event.key === fwd) {
        setIndex.current(Math.min(index + 1, count - 1))
      } else if (event.key === back) {
        setIndex.current(Math.max(index - 1, 0))
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseFocus()
      document.documentElement.style.overflow = restoreScroll

      const target = props.finalFocusRef?.current

      if (target && typeof target.focus === 'function' && target.isConnected !== false) {
        target.focus({ preventScroll: true })
      }
    }
  }, [])

  // Zoom: click toggles 1↔2.5, drag pans while zoomed.
  const applyZoom = (on: boolean, keepPan = false) => {
    const el = imgEl.current

    if (!el) {
      return
    }

    setZoomed(on)
    if (!keepPan) {
      pan.current = { x: 0, y: 0 }
    }

    scale.current = on ? 2.5 : 1
    el.style.transform = on ? `scale(2.5) translate(${pan.current.x}px, ${pan.current.y}px)` : ''

    el.style.cursor = on ? 'grab' : 'zoom-in'
  }

  const draw = () => {
    const el = imgEl.current

    if (el) {
      el.style.transform = `scale(${scale.current}) translate(${pan.current.x}px, ${pan.current.y}px)`
    }
  }

  const drag = usePanGesture$({
    axis: 'both',
    enabled: zoomed,
    onStart() {
      dragBase.current = pan.current
    },
    onUpdate(sample) {
      pan.current = {
        x: dragBase.current.x + sample.translation.x / scale.current,
        y: dragBase.current.y + sample.translation.y / scale.current,
      }

      draw()
    },
  })

  const pinch = usePinchGesture$({
    enabled: zoomOn,
    onStart() {
      pinchBase.current = scale.current
    },
    onUpdate(sample) {
      scale.current = Math.max(1, Math.min(4, pinchBase.current * sample.scale))
      setZoomed(scale.current > 1)
      draw()
    },
  })

  const imageInput = useInteractionHost({
    gestures: compete(pinch, drag),
    press: {
      slop: 8,
      onPress: () => {
        if (zoomOn) {
          applyZoom(!zoomed)
        }
      },
    },
  })

  const imageRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgEl.current = node
      imageInput(node)
    },
    [imageInput],
  )

  return (
    <div
      ref={layer}
      id={props.id}
      className={cx('vx-lightbox-layer', props.className)}
      style={props.style}
      role="dialog"
      aria-modal={true}
      aria-label={item?.alt ?? 'Media viewer'}
      onClick={(e: MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose.current()
        }
      }}
      {...props.web}
    >
      <div ref={stage} className="vx-lightbox-stage" tabIndex={-1}>
        {item != null &&
          (isVideo ? (
            <video
              className="vx-lightbox-media"
              src={item.src}
              controls
              autoPlay={props.hasAutoPlay}
              aria-label={item.alt}
            />
          ) : (
            <img
              ref={imageRef}
              className="vx-lightbox-media"
              src={item.src}
              alt={item.alt}
              draggable={false}
              style={{ cursor: zoomOn ? (zoomed ? 'grab' : 'zoom-in') : undefined }}
            />
          ))}
        {count > 1 && (
          <>
            <Pressable
              className="vx-lightbox-nav vx-lightbox-prev"
              accessibilityLabel="Previous"
              onPress={() => setIndex.current(Math.max(index - 1, 0))}
              disabled={index <= 0}
            >
              <Icon name="xplat-chevron-left" />
            </Pressable>
            <Pressable
              className="vx-lightbox-nav vx-lightbox-next"
              accessibilityLabel="Next"
              onPress={() => setIndex.current(Math.min(index + 1, count - 1))}
              disabled={index >= count - 1}
            >
              <Icon name="xplat-chevron-right" />
            </Pressable>
          </>
        )}
        <Pressable
          className="vx-lightbox-close"
          accessibilityLabel="Close"
          onPress={() => onClose.current()}
        >
          <Icon name="xplat-close" />
        </Pressable>
        {count > 1 && (
          <div className="vx-lightbox-counter" aria-live="polite">
            {index + 1} of {count}
          </div>
        )}
        {item?.caption != null && (
          <div className="vx-lightbox-caption">
            {typeof item.caption === 'string' ? <Text>{item.caption}</Text> : item.caption}
          </div>
        )}
      </div>
    </div>
  )
}

/** Full-screen media viewer (Astryx `Lightbox`), web leaf — portal layer
 *  with platform focus trap/scroll lock, keyboard navigation
 *  (Escape/←/→), backdrop click, click-zoom + drag-pan on images. */
export function Lightbox(props: LightboxProps): JSX.Element | null @{
  const [internal, setInternal] = useState(props.defaultIndex ?? 0)
  const count = props.media.length
  const index = clampIndex(props.index ?? internal, count)
  const setIndex = (i: number) => {
    const clamped = clampIndex(i, count)

    if (props.index == null) {
      setInternal(clamped)
    }

    if (clamped !== index) {
      props.onIndexChange?.(clamped)
    }
  }

  @if (props.isOpen && count > 0) {
    <>
      {createPortal(
        <LightboxLayer
          media={props.media}
          index={index}
          setIndex={setIndex}
          onClose={() => props.onOpenChange(false)}
          hasZoom={props.hasZoom ?? true}
          hasAutoPlay={props.hasAutoPlay ?? false}
          finalFocusRef={props.finalFocusRef}
          className={props.className}
          style={props.style}
          id={props.id}
          web={props.web}
        />,
        document.body,
      )}
    </>
  }
}
