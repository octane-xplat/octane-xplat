import { FailureCollector } from './failures.ts'
import type { Registry } from './registry'
import type { AccessibleHost } from './accessible-host'
import { createAppKitKeyboardDispatcher } from './keyboard'
import {
  NSEvent,
  NSImageView,
  NSNotificationCenter,
  NSView,
  NSWindowDidUpdateNotification,
} from '@octane-xplat/platform/macos'

import { createAppKitContextPointerDispatcher } from './context-pointer'
import { appKitMouseHit } from './primary-click'
import { createAppKitFileDropRegistry } from './file-drop'
import { createAppKitFocusWithinDispatcher } from './focus-within'
import type { ElementNode } from './model'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import { setImageEventHandlers } from './image'

interface Dependencies {
  registry: Pick<Registry, 'cssNodesByView'>
  accessibleHost: Pick<AccessibleHost, 'AccessibleHostView'>
}

export type Subscriptions = ReturnType<typeof createSubscriptions>

export function createSubscriptions(deps: Dependencies) {
  const keyboardDispatcher = createAppKitKeyboardDispatcher(() => ({ NSEvent }))

  const contextPointerDispatcher = createAppKitContextPointerDispatcher(
    (event) => appKitMouseHit(event.window, event.locationInWindow),
    () => ({ NSEvent }),
  )

  const fileDropRegistry = createAppKitFileDropRegistry()

  const focusWithinDispatcher = createAppKitFocusWithinDispatcher(() => ({
    NSNotificationCenter,
    NSWindowDidUpdateNotification,
  }))

  const keyboardSubscriptionsByNode = new WeakMap<ElementNode, Set<() => void>>()

  /** Internal composed-control attachment; node teardown owns outstanding leases. */
  function observeViewKeys(
    view: NSView,
    handlers: {
      onKeyDown?: (event: NativeKeyboardEvent<object>) => void
      onKeyUp?: (event: NativeKeyboardEvent<object>) => void
    },
  ): () => void {
    const node = deps.registry.cssNodesByView.get(view)

    if (!node || (!handlers.onKeyDown && !handlers.onKeyUp)) {
      return () => {}
    }

    let owned = keyboardSubscriptionsByNode.get(node)

    if (!owned) {
      owned = new Set()
      keyboardSubscriptionsByNode.set(node, owned)

      const leases = owned

      ;(node.destroyHooks ??= []).push(() => {
        const failures = new FailureCollector()

        keyboardSubscriptionsByNode.delete(node)
        for (const off of Array.from(leases)) {
          failures.run('subscription release', off)
        }

        failures.throwIfFailed()
      })
    }

    const leases = owned
    let active = true
    const invoke = (name: 'onKeyDown' | 'onKeyUp', event: NativeKeyboardEvent<object>) => {
      if (
        node.lifecycle === 'disposing' ||
        node.lifecycle === 'disposed' ||
        !active ||
        node.view !== view ||
        deps.registry.cssNodesByView.get(view) !== node ||
        node.props.disabled === true ||
        node.props.isEnabled === false ||
        node.props.enabled === false
      ) {
        return
      }

      try {
        node.container.root?.eventScope('discrete', () => handlers[name]?.(event))
      } catch (error) {
        console.error('[macos-event] ' + name + ' subscription failed', error)
      }
    }

    const release = keyboardDispatcher.subscribe(view, {
      onKeyDown: handlers.onKeyDown ? (event) => invoke('onKeyDown', event) : undefined,
      onKeyUp: handlers.onKeyUp ? (event) => invoke('onKeyUp', event) : undefined,
    })

    const off = () => {
      if (!active) {
        return
      }

      active = false
      leases.delete(off)
      release()
    }

    leases.add(off)
    return off
  }

  const fileDropSubscriptionsByNode = new WeakMap<ElementNode, Set<() => void>>()

  function observeFileDrop(
    view: NSView,
    handlers: { enabled(): boolean; receive(uris: string[]): boolean },
  ): () => void {
    const node = deps.registry.cssNodesByView.get(view)

    if (!node || !(view instanceof deps.accessibleHost.AccessibleHostView)) {
      return () => {}
    }

    let owned = fileDropSubscriptionsByNode.get(node)

    if (!owned) {
      owned = new Set()
      fileDropSubscriptionsByNode.set(node, owned)

      const leases = owned

      ;(node.destroyHooks ??= []).push(() => {
        const failures = new FailureCollector()

        fileDropSubscriptionsByNode.delete(node)
        for (const off of Array.from(leases)) {
          failures.run('subscription release', off)
        }

        failures.throwIfFailed()
      })
    }

    const leases = owned
    let active = true
    const current = () =>
      node.lifecycle !== 'disposing' &&
      node.lifecycle !== 'disposed' &&
      active &&
      Object.is(node.view, view) &&
      deps.registry.cssNodesByView.get(view) === node &&
      Boolean(node.container.root) &&
      node.props.disabled !== true &&
      node.props.isEnabled !== false &&
      node.props.enabled !== false

    const release = fileDropRegistry.subscribe(view, {
      enabled: () => current() && handlers.enabled(),
      receive: (uris) => {
        if (!current() || !handlers.enabled()) {
          return false
        }

        let accepted = false

        node.container.root!.eventScope('discrete', () => {
          accepted = handlers.receive(uris) === true
        })

        return accepted
      },
    })

    const off = () => {
      if (!active) {
        return
      }

      active = false
      leases.delete(off)
      release()
    }

    leases.add(off)
    return off
  }

  const contextSubscriptionsByNode = new WeakMap<ElementNode, Set<() => void>>()

  /** Shared ContextMenu owns an intent lease; OS-native menus keep their own leaf. */
  function observeContextMenu(view: NSView, handler: (target: NSView) => boolean): () => void {
    const node = deps.registry.cssNodesByView.get(view)

    if (!node) {
      return () => {}
    }

    let owned = contextSubscriptionsByNode.get(node)

    if (!owned) {
      owned = new Set()
      contextSubscriptionsByNode.set(node, owned)

      const leases = owned

      ;(node.destroyHooks ??= []).push(() => {
        const failures = new FailureCollector()

        contextSubscriptionsByNode.delete(node)
        for (const off of Array.from(leases)) {
          failures.run('subscription release', off)
        }

        failures.throwIfFailed()
      })
    }

    const leases = owned
    let active = true
    const release = contextPointerDispatcher.subscribe(view, (target) => {
      if (
        node.lifecycle === 'disposing' ||
        node.lifecycle === 'disposed' ||
        !active ||
        node.view !== view ||
        deps.registry.cssNodesByView.get(view) !== node ||
        node.props.disabled === true ||
        node.props.isEnabled === false ||
        node.props.enabled === false
      ) {
        return false
      }

      let handled = false

      try {
        node.container.root?.eventScope('discrete', () => {
          handled = handler(target) === true
        })
      } catch (error) {
        console.error('[macos-context] intent failed', error)
        handled = true
      }

      return handled
    })

    const off = () => {
      if (!active) {
        return
      }

      active = false
      leases.delete(off)
      release()
    }

    leases.add(off)
    return off
  }

  function setImageActions(node: ElementNode) {
    const view = node.view as NSImageView | undefined

    if (!view) {
      return
    }

    const invoke = (name: string, event: unknown, current: () => boolean) => {
      const root = node.container.root

      if (
        node.lifecycle === 'disposing' ||
        node.lifecycle === 'disposed' ||
        !root ||
        !current() ||
        node.view !== view ||
        deps.registry.cssNodesByView.get(view) !== node
      ) {
        return
      }

      root.eventScope('discrete', () => {
        if (
          node.lifecycle === 'disposing' ||
          node.lifecycle === 'disposed' ||
          !current() ||
          node.view !== view ||
          deps.registry.cssNodesByView.get(view) !== node ||
          node.container.root !== root
        ) {
          return
        }

        const handler = node.props[name]

        if (typeof handler === 'function') {
          handler(event)
        }
      })
    }

    setImageEventHandlers(view, {
      onLoad:
        typeof node.props.onImageLoad === 'function'
          ? (event, current) => invoke('onImageLoad', event, current)
          : undefined,
      onError:
        typeof node.props.onImageError === 'function'
          ? (event, current) => invoke('onImageError', event, current)
          : undefined,
    })
  }

  function setKeyActions(node: ElementNode) {
    if (!node.view) {
      return
    }

    const invoke = (name: 'onKeyDown' | 'onKeyUp', event: NativeKeyboardEvent<object>) => {
      if (
        node.lifecycle === 'disposing' ||
        node.lifecycle === 'disposed' ||
        node.props.disabled === true ||
        node.props.isEnabled === false ||
        node.props.enabled === false
      ) {
        return
      }

      const handler = node.props[name]

      if (typeof handler !== 'function') {
        return
      }

      try {
        node.container.root?.eventScope('discrete', () => handler(event))
      } catch (error) {
        console.error('[macos-event] ' + name + ' handler failed', error)
      }
    }

    keyboardDispatcher.set(node.view, {
      onKeyDown:
        typeof node.props.onKeyDown === 'function'
          ? (event) => invoke('onKeyDown', event)
          : undefined,
      onKeyUp:
        typeof node.props.onKeyUp === 'function' ? (event) => invoke('onKeyUp', event) : undefined,
    })
  }

  function setFocusActions(node: ElementNode) {
    if (!node.view) {
      return
    }

    // Text delegates already report the control's own focus lifecycle.
    if (['textfield', 'textview', 'searchbar'].includes(node.type)) {
      return
    }

    const invoke = (name: 'onFocus' | 'onBlur', event: unknown) => {
      if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
        return
      }

      const handler = node.props[name]

      if (typeof handler !== 'function') {
        return
      }

      try {
        node.container.root?.eventScope('discrete', () => handler(event))
      } catch (error) {
        console.error('[macos-event] ' + name + ' handler failed', error)
      }
    }

    focusWithinDispatcher.set(node.view, {
      onFocus:
        typeof node.props.onFocus === 'function' ? (event) => invoke('onFocus', event) : undefined,
      onBlur:
        typeof node.props.onBlur === 'function' ? (event) => invoke('onBlur', event) : undefined,
    })
  }

  return {
    keyboardDispatcher,
    contextPointerDispatcher,
    fileDropRegistry,
    focusWithinDispatcher,
    observeViewKeys,
    observeFileDrop,
    observeContextMenu,
    setImageActions,
    setKeyActions,
    setFocusActions,
  }
}
