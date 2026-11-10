import { useCallback, useLayoutEffect, useInsertionEffect, useRef } from 'octane'
import { createGestureBinding, type GestureBinding } from './binding'
import { interactionScopeController } from './scope'
import { useInteractionMembership } from './context.tsrx'
import type { InteractionHostOptions } from './host-options'

/** Keep ordinary semantic controls available; unsupported gesture attachment is an explicit error. */
export function useUnsupportedInteractionHost(
  options: InteractionHostOptions,
  platform: string,
): (host: object | null) => void {
  if (options.onPan || options.onPinch || options.gestures) {
    const requested = options.gestures ? 'shared gestures' : options.onPinch ? 'pinch' : 'pan'

    throw new Error(
      `Unsupported gesture attachment: ${platform} has no qualified ${requested} adapter`,
    )
  }

  const membership = useInteractionMembership()
  const node = useRef<object | null>(null)
  const ref = useRef<GestureBinding<object> | null>(null)

  if (!ref.current) {
    ref.current = createGestureBinding({
      gestures() {
        throw new Error(
          `Unsupported gesture attachment: ${platform} has no qualified raw-contact adapter`,
        )
      },
      scope(_host, scope) {
        return interactionScopeController(scope).attach({
          freeze: () => ({ ok: false, reason: 'unsupported' }),
        })
      },
    })
  }

  const binding = ref.current
  const bind = useCallback(
    (host: object | null) => {
      node.current = host
      membership(host)
      if (!host) {
        binding.detach()
      }
    },
    [binding, membership],
  )

  useLayoutEffect(() => {
    binding.commit(node.current, undefined, options.interactionScope)
  }, [binding, options, platform])

  useInsertionEffect(() => () => binding.detach(), [binding])
  return bind
}
