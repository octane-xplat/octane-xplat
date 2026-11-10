import { leaseNativeFlag } from './flag-lease'
import { isRawRecognizer } from './raw-recognizers'
import type { NativeGestureView } from './input.native'
import type { SuspensionDriver } from './scope'

interface MasonScroll {
  readonly scrollLeft: number
  readonly scrollTop: number
  scrollTo(options: { left: number; top: number; behavior: 'instant' }): void
}

function isMasonScroll(value: object): value is MasonScroll {
  return (
    'scrollTo' in value &&
    typeof value.scrollTo === 'function' &&
    'scrollLeft' in value &&
    typeof value.scrollLeft === 'number' &&
    'scrollTop' in value &&
    typeof value.scrollTop === 'number'
  )
}

/** UIKit cancellation plus Mason's public instant seek; overflow is never changed. */
export function iosSuspension(view: NativeGestureView, host: UIView): SuspensionDriver {
  return {
    freeze() {
      if (!host.window) {
        return { ok: false, reason: 'unsupported' }
      }

      const native: UIView[] = [host]
      const logical: NativeGestureView[] = [view]
      const stops: (() => void)[] = []

      for (let index = 0; index < native.length; index++) {
        const child = native[index]

        // Restrict success to the UIKit/Mason surfaces whose input lifecycle we own.
        // Unknown native subclasses can override touch/keyboard delivery outside recognizers.
        const supported =
          !child.userInteractionEnabled ||
          child.isMemberOfClass(UIView.class()) ||
          NSStringFromClass(child.class()) === 'MasonUIView' ||
          child instanceof UILabel ||
          child instanceof UIImageView ||
          child instanceof UIScrollView

        if (
          !supported ||
          child instanceof UIControl ||
          child instanceof UITextView ||
          (typeof WKWebView !== 'undefined' && child instanceof WKWebView)
        ) {
          return { ok: false, reason: 'unsupported' }
        }

        for (let i = 0; i < child.subviews.count; i++) {
          native.push(child.subviews.objectAtIndex(i))
        }

        if (child instanceof UIScrollView) {
          const offset = { x: child.contentOffset.x, y: child.contentOffset.y }
          const inset = child.adjustedContentInset

          if (
            offset.x < -inset.left ||
            offset.y < -inset.top ||
            offset.x >
              Math.max(
                -inset.left,
                child.contentSize.width - child.bounds.size.width + inset.right,
              ) ||
            offset.y >
              Math.max(
                -inset.top,
                child.contentSize.height - child.bounds.size.height + inset.bottom,
              )
          ) {
            return { ok: false, reason: 'unsupported' }
          }

          stops.push(() => child.setContentOffsetAnimated(offset, false))
        }
      }

      for (let index = 0; index < logical.length; index++) {
        const child = logical[index]

        child.eachChild?.((next) => {
          logical.push(next)
          return true
        })

        if (isMasonScroll(child)) {
          const left = child.scrollLeft,
            top = child.scrollTop

          if (!Number.isFinite(left) || !Number.isFinite(top)) {
            return { ok: false, reason: 'unsupported' }
          }

          stops.push(() => child.scrollTo({ left, top, behavior: 'instant' }))
        }
      }

      const releases: (() => void)[] = []
      let alive = true
      const release = () => {
        if (!alive) {
          return
        }

        alive = false

        const errors: unknown[] = []

        for (const restore of releases.reverse()) {
          try {
            restore()
          } catch (error) {
            errors.push(error)
          }
        }

        if (errors.length) {
          throw new AggregateError(errors, 'Native input restoration failed')
        }
      }

      try {
        releases.push(
          leaseNativeFlag(host, 'userInteractionEnabled', false),
          leaseNativeFlag(host, 'accessibilityElementsHidden', true),
        )

        for (const child of native) {
          const recognizers = child.gestureRecognizers

          for (let index = 0; index < (recognizers?.count ?? 0); index++) {
            const recognizer = recognizers!.objectAtIndex(index)

            if (!isRawRecognizer(recognizer)) {
              releases.push(leaseNativeFlag(recognizer, 'enabled', false))
            }
          }
        }

        // Disabling a pan recognizer can itself begin deceleration; stop afterward.
        for (const stop of stops) {
          stop()
        }

        return { ok: true, release }
      } catch (error) {
        release()
        throw error
      }
    },
  }
}
