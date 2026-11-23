import { useContext, useInsertionEffect, useLayoutEffect, useRef, useState } from 'octane'
import type { NativeGestureView } from './input.native'
import type { InteractionAdapter } from './host-binding'
import { InteractionScopeContext } from './context.tsrx'
import { createNativeInteractionHost, type NativeInteractionHost } from './native-interaction-host'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'

export function useNativeInteractionHost(
  options: InteractionHostOptions,
  adapter: InteractionAdapter<NativeGestureView>,
  isReady?: (host: NativeGestureView) => boolean,
): (host: object | null) => void {
  const scopes = useContext(InteractionScopeContext)
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  const ref = useRef<NativeInteractionHost | null>(null)

  if (!ref.current) {
    ref.current = createNativeInteractionHost(adapter, isReady, scopes, setFailure)
  }

  const host = ref.current

  useInsertionEffect(() => host.dispose, [host])

  if (failure) {
    throw failure.error
  }

  useLayoutEffect(() => {
    host.commit(options, scopes)
  }, [host, options, scopes])

  return host.bind
}
