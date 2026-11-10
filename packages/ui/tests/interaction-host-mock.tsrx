import { useCallback, useLayoutEffect, useRef } from 'octane'
import type { PanNotification } from '../src/gestures/types'
import type { InteractionHostOptions } from '../src/gestures/host-options'
import { flushUniversalSync } from 'octane/universal/native'
import { virtualActivation } from '../src/gestures/virtual-activation'

const bindings = new WeakMap<object, () => InteractionHostOptions>()
const actions = new WeakMap<object, () => void>()

/** Object-driver action/layout tests have no OS host. This seam dispatches
 * semantic actions only; gesture recognition is tested with the real adapter. */
export function useInteractionHost(options: InteractionHostOptions) {
  const latest = useRef(options)
  const host = useRef<object | null>(null)
  const update = useCallback(() => {
    const node = host.current,
      press = latest.current.press

    if (!node) {
      return
    }

    bindings.set(node, () => latest.current)
    actions.delete(node)
    if (
      press?.enabled === false &&
      !(
        'props' in node &&
        (node.props as { isEnabled?: boolean; disabled?: boolean }).isEnabled === false
      ) &&
      !('props' in node && (node.props as { disabled?: boolean }).disabled)
    ) {
      actions.set(node, () => {})
    } else if (press?.enabled !== false && press?.onPress) {
      actions.set(node, () => latest.current.press?.onPress?.(virtualActivation(node)))
    }
  }, [])

  useLayoutEffect(() => {
    latest.current = options
    update()
  }, [options, update])

  return useCallback(
    (node: object | null) => {
      if (host.current) {
        actions.delete(host.current)
        bindings.delete(host.current)
      }

      host.current = node
      update()
    },
    [update],
  )
}

export function dispatchTestInput(
  container: { dispatchEvent(...args: any[]): unknown },
  host: object,
  type: string,
  event: unknown,
): unknown {
  const action = type === 'tap' ? actions.get(host) : undefined

  return action ? flushUniversalSync(action) : container.dispatchEvent(host, type, event)
}

export function dispatchTestPan(host: object, event: PanNotification) {
  bindings.get(host)?.().onPan?.(event)
}

export function dispatchTestDoublePress(host: object) {
  const press = bindings.get(host)?.().press

  if (press?.enabled !== false) {
    press?.onDoublePress?.()
  }
}
