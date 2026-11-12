import { createStyleLease } from './style-lease'
import { MotionTargetError } from './value-codec'
import type { StyleAdapter } from './host-types'

export function attachStyles(node: HTMLElement): StyleAdapter {
  const lease = createStyleLease(
    (key) => node.style[key] || undefined,
    (key, value) => {
      node.style[key] = value === undefined ? '' : typeof value === 'number' ? `${value}px` : value
    },
  )
  return {
    ...lease,
    release: lease.release,
    platform: 'web',
    read: (key) => getComputedStyle(node)[key] || undefined,
    validate(key) {
      if (
        ['top', 'right', 'bottom', 'left'].includes(key) &&
        getComputedStyle(node).position === 'static'
      ) {
        throw new MotionTargetError(
          'unsupported-property',
          key,
          undefined,
          'position offsets require a positioned host',
          'web',
        )
      }
      if (
        ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'].includes(key) &&
        getComputedStyle(node).boxSizing !== 'border-box'
      ) {
        throw new MotionTargetError(
          'unsupported-property',
          key,
          undefined,
          'animated dimensions require border-box sizing',
          'web',
        )
      }
    },
    references() {
      const style = getComputedStyle(node)
      const parent =
        node.offsetParent instanceof HTMLElement ? node.offsetParent : node.parentElement
      const px = (value: string) => {
        const n = Number.parseFloat(value)
        return Number.isFinite(n) ? n : undefined
      }
      return {
        measured:
          node.isConnected &&
          (node.getClientRects().length > 0 || node.offsetWidth > 0 || node.offsetHeight > 0),
        width: node.offsetWidth,
        height: node.offsetHeight,
        parentWidth:
          parent && parent.style.width && parent.style.width !== 'auto'
            ? Math.max(
                0,
                parent.clientWidth -
                  (style.position === 'absolute'
                    ? 0
                    : Number.parseFloat(getComputedStyle(parent).paddingLeft || '0') +
                      Number.parseFloat(getComputedStyle(parent).paddingRight || '0')),
              )
            : undefined,
        parentHeight:
          parent && parent.style.height && parent.style.height !== 'auto'
            ? Math.max(
                0,
                parent.clientHeight -
                  (style.position === 'absolute'
                    ? 0
                    : Number.parseFloat(getComputedStyle(parent).paddingTop || '0') +
                      Number.parseFloat(getComputedStyle(parent).paddingBottom || '0')),
              )
            : undefined,
        viewportWidth: document.documentElement.clientWidth || window.innerWidth,
        viewportHeight: document.documentElement.clientHeight || window.innerHeight,
        fontSize: px(style.fontSize),
        rootFontSize: px(getComputedStyle(document.documentElement).fontSize),
      }
    },
    observe(callback) {
      if (!(node instanceof Node)) {
        return () => {}
      }
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(callback)
      for (const target of [node, node.parentElement, document.documentElement]) {
        if (target) {
          observer?.observe(target)
        }
      }
      const mutation = new MutationObserver(callback)
      for (let target: HTMLElement | null = node; target; target = target.parentElement) {
        mutation.observe(target, { attributes: true, attributeFilter: ['class', 'style'] })
      }
      window.addEventListener('resize', callback)
      return () => {
        observer?.disconnect()
        mutation.disconnect()
        window.removeEventListener('resize', callback)
      }
    },
  }
}
