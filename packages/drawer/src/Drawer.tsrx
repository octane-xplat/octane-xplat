/** @jsxImportSource @octane-xplat/jsx */
import { Application, isAndroid, isIOS, type View } from '@nativescript/core'
import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'octane'
import { useSignal$ } from 'octane/signals/client'
import { cx } from '@octane-xplat/lib'
import { attachOwnedPan, useInputCallbackGuard } from '@octane-xplat/ui/internal/gesture-input'
import { createAnimatedValue } from '@octane-xplat/ui/internal/animated-value'
import { Pressable } from '@octane-xplat/ui'
import type { DrawerProps } from './props'
import { bindDrawer, type DrawerBinding } from './native-binding'
import { applyNativeDrawerProps } from './native-host-props'

/** Mobile presentation composed over the shared root gesture owner. */
export function Drawer(props: DrawerProps): unknown @{
  const invoke = useInputCallbackGuard()
  const gestureEnabled$ = useSignal$(props.isGestureEnabled !== false)
  const latest = useRef(props)

  const host = useRef<View | null>(null)
  const panel = useRef<View | null>(null)
  const backdrop = useRef<View | null>(null)
  const main = useRef<View | null>(null)
  const binding = useRef<DrawerBinding | null>(null)
  const ready = useCallback(() => {
    queueMicrotask(() => binding.current?.sync())
  }, [])

  const attach = useCallback((view: View | null) => {
    host.current = view
  }, [])

  useEffect(() => {
    const root = host.current
    const content = panel.current
    const shade = backdrop.current
    const background = main.current

    if (!root || !content || !shade || !background) {
      return
    }

    let savedOpen = latest.current.defaultOpen ?? false
    let releaseMounted: (() => void) | null = null
    const unmount = () => {
      const release = releaseMounted

      releaseMounted = null
      release?.()
    }

    const mount = () => {
      if (releaseMounted || !root.isLoaded) {
        return
      }

      const originalHidden = isIOS ? background.ios.accessibilityElementsHidden : false
      const originalModal = isIOS ? content.ios.accessibilityViewIsModal : false
      const originalImportance = isAndroid ? background.android.getImportantForAccessibility() : 0
      let revealed = 0
      let from = 0
      let target = 0
      const write = (value: number) => {
        const width = content.getActualSize().width || latest.current.width || 280

        revealed = Math.max(0, Math.min(width, value))
        content.translateX = revealed - width
        content.visibility = revealed > 0 ? 'visible' : 'hidden'
        shade.opacity = revealed / width
        shade.visibility = revealed > 0 ? 'visible' : 'hidden'
        // Native editing and semantic focus remain native; hide covered content
        // from accessibility without disabling the owner's contact observer.
        if (isIOS) {
          background.ios.accessibilityElementsHidden = revealed > 0 || originalHidden
          content.ios.accessibilityViewIsModal = revealed > 0 || originalModal
        } else if (isAndroid) {
          background.android.setImportantForAccessibility(revealed > 0 ? 4 : originalImportance)
        }
      }

      // Reuse UI's cancellable scalar engine; a single eased sample writes both
      // panel and shade. No second platform tween can overwrite a new drag.
      const animation = createAnimatedValue(0, {
        now: Date.now,
        request: requestAnimationFrame,
        cancel: cancelAnimationFrame,
        write: (_view, t) => {
          const eased = t * t * (3 - 2 * t)

          write(from + (target - from) * eased)
        },
      })

      animation.ref(root)

      const control = bindDrawer(
        {
          width: () => content.getActualSize().width,
          read: () => revealed,
          stop: () => animation.stop(),
          write,
          settle(value, reducedMotion) {
            // Resetting the timeline must not reset the presentation.
            animation.ref(null)
            void animation.to(0, { duration: 0 })
            from = revealed
            target = value
            animation.ref(root)
            return animation.to(1, { duration: reducedMotion ? 0 : 200 })
          },
          dispose() {
            animation.dispose()
            if (isIOS) {
              background.ios.accessibilityElementsHidden = originalHidden
              content.ios.accessibilityViewIsModal = originalModal
            } else if (isAndroid) {
              background.android.setImportantForAccessibility(originalImportance)
            }
          },
        },
        () => ({
          ...latest.current,
          defaultOpen: savedOpen,
          onOpenChange: (value) => {
            savedOpen = value
            invoke(latest.current.onOpenChange, value)
          },
          onDismiss: () => {
            invoke(latest.current.onDismiss)
          },
          onError: latest.current.onError
            ? (error) => {
                invoke(latest.current.onError, error)
              }
            : undefined,
          reducedMotion:
            latest.current.reducedMotion ||
            (isIOS && UIAccessibilityIsReduceMotionEnabled()) ||
            (isAndroid &&
              android.provider.Settings.Global.getFloat(
                Application.android.context.getContentResolver(),
                android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
                1,
              ) === 0),
        }),
      )

      binding.current = control

      let off: () => void

      try {
        off = attachOwnedPan(root, { ...control.pan, enabled$: gestureEnabled$ }, control.admission)
      } catch (error) {
        control.dispose()
        binding.current = null
        throw error
      }

      const back = (event: { cancel: boolean }) => {
        if (!event.cancel && control.visible()) {
          event.cancel = true
          control.dismiss()
        }
      }

      if (isAndroid) {
        Application.android.on('activityBackPressed', back)
      }

      control.sync()
      releaseMounted = () => {
        try {
          off()
        } finally {
          try {
            control.dispose()
          } finally {
            if (isAndroid) {
              Application.android.off('activityBackPressed', back)
            }

            binding.current = null
          }
        }
      }
    }

    root.on('loaded', mount)
    root.on('unloaded', unmount)
    mount()
    return () => {
      root.off('loaded', mount)
      root.off('unloaded', unmount)
      unmount()
    }
  }, [])

  useLayoutEffect(() => {
    latest.current = { ...props }
    gestureEnabled$.set(props.isGestureEnabled !== false)
    if (host.current) {
      applyNativeDrawerProps(host.current, isIOS ? props.ios : props.android)
    }

    binding.current?.sync()
  }, [
    props.open,
    props.defaultOpen,
    props.width,
    props.isGestureEnabled,
    props.reducedMotion,
    props.onOpenChange,
    props.onDismiss,
    props.onError,
    props.ios,
    props.android,
  ])

  <masonview
    id={props.id}
    ref={attach}
    className={cx('vx-drawer', 'vx-drawer--mobile', props.className)}
    style={props.style}
    onLayoutChanged={ready}
  >
    <masonview
      id={props.id ? props.id + '-main' : undefined}
      ref={(view: View | null) => {
        main.current = view
      }}
      className="vx-drawer-main"
    >
      {props.main}
    </masonview>
    <Pressable
      id={props.id ? props.id + '-backdrop' : undefined}
      ref={(view: View | null) => {
        backdrop.current = view
      }}
      className="vx-drawer-backdrop"
      accessibilityLabel="Close navigation"
      onPress={() => binding.current?.dismiss()}
    />
    <masonview
      id={props.id ? props.id + '-panel' : undefined}
      ref={(view: View | null) => {
        panel.current = view
      }}
      className="vx-drawer-panel"
      accessibilityLabel={props.accessibilityLabel ?? 'Navigation'}
      onLayoutChanged={ready}
      style={{ width: props.width ?? 280 }}
    >
      {props.drawer}
    </masonview>
  </masonview>
}
