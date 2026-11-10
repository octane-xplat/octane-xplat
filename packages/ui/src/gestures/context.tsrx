import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  useInsertionEffect,
} from 'octane'

import { interactionScopeController } from './scope'
import type { InteractionScope } from './types'
import type { Renderable } from '../props'

const ScopeContext = createContext<readonly InteractionScope[]>([])
// Context itself is the provider. This follows size-context's native JSX facade boundary.
const ContextProvider: any = ScopeContext

export function InteractionScopeProvider(props: {
  scope?: InteractionScope
  children?: Renderable
}): unknown @{
  const parent = useContext(ScopeContext)
  const value = useMemo(
    () => (props.scope ? [...parent, props.scope] : parent),
    [parent, props.scope],
  )

  <ContextProvider value={value}>{props.children}</ContextProvider>
}

/** Track framework ownership through portals, independently of native physical ancestry. */
export function useInteractionMembership(): (host: object | null) => void {
  const scopes = useContext(ScopeContext)
  const host = useRef<object | null>(null)
  const releases = useRef<(() => void)[]>([])
  const clear = useCallback(() => {
    const owned = releases.current

    releases.current = []
    for (const release of owned.reverse()) {
      release()
    }
  }, [])

  const committed = useRef(scopes)
  const sync = useCallback(() => {
    clear()
    if (!host.current) {
      return
    }

    try {
      for (const scope of committed.current) {
        releases.current.push(interactionScopeController(scope).registerMember(host.current))
      }
    } catch (error) {
      clear()
      throw error
    }
  }, [clear])

  const bind = useCallback(
    (next: object | null) => {
      host.current = next
      clear()
      if (next) {
        queueMicrotask(sync)
      }
    },
    [clear, sync],
  )

  useLayoutEffect(() => {
    committed.current = scopes
    sync()
    return clear
  }, [scopes, clear, sync])

  useInsertionEffect(
    () => () => {
      host.current = null
      clear()
    },
    [clear],
  )

  return bind
}
