/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { useLayer } from './use-layer.tsrx'
import { View } from '../layout/View.web.tsrx'
import type { TooltipProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import type { JSX } from 'octane/jsx-runtime'

const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]'

type Binding = {
  node: HTMLElement
  enter: () => void
  leave: () => void
  focusIn: (event: FocusEvent) => void
  focusOut: () => void
}

/**
 * Delayed hover-intent tooltip anchored through useLayer. `focusin`/`focusout`
 * bubble, so keyboard focus on a focusable child opens it without forcing a
 * tab stop on the wrapper; while open the resolved focusable element gets
 * `aria-describedby` pointing at the `role="tooltip"` panel. Escape, blur,
 * and scroll (capture, so nested scrollers count) dismiss.
 *
 * Web-only (the `ui/web` subpath) — hover/focus intent has no touch-platform
 * semantic and a long-press stand-in would repeat the old hover-wrapper trap
 * (decision #47).
 */
export function useTooltip(props: Omit<TooltipProps, 'trigger'>, direct = false) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLElement | null>(null)
  const binding = useRef<Binding | null>(null)
  const described = useRef<HTMLElement | null>(null)
  const layer = useLayer({ mode: 'context', dismissOnEscape: true, onHide: () => closeNow() })
  const tooltipId = layer.id

  useEffect(() => {
    if (open && !props.disabled) {
      layer.show()
    } else {
      layer.hide()
      if (props.disabled) closeNow()
    }
  }, [open, props.disabled, layer.show, layer.hide])

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpen = () => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current)
    }

    openTimer.current = null
  }

  const clearClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
    }

    closeTimer.current = null
  }

  const startOpen = () => {
    if (props.disabled) {
      return
    }

    clearClose()
    clearOpen()
    openTimer.current = setTimeout(
      () => {
        openTimer.current = null
        setOpen(true)
      },
      Math.max(0, props.openDelay ?? 500),
    )
  }

  const scheduleClose = () => {
    clearClose()
    closeTimer.current = setTimeout(
      () => {
        closeTimer.current = null
        setOpen(false)
      },
      Math.max(0, props.closeDelay ?? 100),
    )
  }

  const openNow = () => {
    if (props.disabled) {
      return
    }

    clearClose()
    clearOpen()
    setOpen(true)
  }

  const closeNow = () => {
    clearOpen()
    clearClose()
    setOpen(false)
  }

  const bindAnchor = useCallback(
    (node: HTMLElement | null) => {
      anchor.current = node
      layer.ref(node)
      if (binding.current?.node === node) {
        return
      }

      const old = binding.current

      if (old) {
        old.node.removeEventListener('mouseenter', old.enter)
        old.node.removeEventListener('mouseleave', old.leave)
        old.node.removeEventListener('focusin', old.focusIn)
        old.node.removeEventListener('focusout', old.focusOut)
      }

      binding.current = null
      if (!node) {
        return
      }

      const next: Binding = {
        node,
        enter: startOpen,
        leave: () => {
          clearOpen()
          scheduleClose()
        },
        focusIn: openNow,
        focusOut: closeNow,
      }

      node.addEventListener('mouseenter', next.enter)
      node.addEventListener('mouseleave', next.leave)
      node.addEventListener('focusin', next.focusIn)
      node.addEventListener('focusout', next.focusOut)
      binding.current = next
    },
    [layer.ref, props.disabled, props.openDelay, props.closeDelay],
  )

  useEffect(
    () => () => {
      clearOpen()
      clearClose()

      const current = binding.current

      if (current) {
        current.node.removeEventListener('mouseenter', current.enter)
        current.node.removeEventListener('mouseleave', current.leave)
        current.node.removeEventListener('focusin', current.focusIn)
        current.node.removeEventListener('focusout', current.focusOut)
      }
    },
    [],
  )

  useEffect(() => {
    if (!open || props.disabled) {
      return
    }

    const host = anchor.current
    const target = (
      host?.matches?.(FOCUSABLE) ? host : (host?.querySelector?.(FOCUSABLE) ?? host)
    ) as HTMLElement | null

    if (target && !direct) {
      const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
      target.setAttribute('aria-describedby', [...new Set([...ids, tooltipId])].join(' '))
      described.current = target
    }

    const onScroll = () => closeNow()

    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      const node = described.current
      const ids = (node?.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== tooltipId)

      if (ids.length) {
        node?.setAttribute('aria-describedby', ids.join(' '))
      } else {
        node?.removeAttribute('aria-describedby')
      }
      described.current = null
    }
  }, [open, props.disabled, props.content, direct])

  const panel = props.disabled
    ? null
    : layer.render(props.content, {
        placement: props.placement ?? 'top',
        alignment: direct ? 'center' : 'start',
        offset: 8,
        className: cx('vx-tooltip', props.contentClassName),
        style: { pointerEvents: 'none', ...styleRecord(props.contentStyle) },
        accessibilityRole: 'tooltip',
      })

  return { bindAnchor, panel, descriptionId: open && !props.disabled ? tooltipId : undefined }
}

export function Tooltip(props: TooltipProps): JSX.Element @{
  const { bindAnchor, panel } = useTooltip(props)

  <View
    id={props.id}
    className={props.className}
    style={props.style}
    ref={bindAnchor}
    web={props.web}
  >
    {props.trigger}
    {panel}
  </View>
}
