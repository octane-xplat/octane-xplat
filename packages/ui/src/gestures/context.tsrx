import 'octane/signals'
import {
  createContext,
  useContext,
  useRef,
  useLayoutEffect,
  useInsertionEffect,
  type Context,
} from 'octane'

import { interactionScopeController } from './scope'
import { createInteractionMembership, type InteractionMembership } from './membership'
import type { InteractionScope } from './types'
import type { Renderable } from '../props'

/** Interaction scopes enclosing a subtree, outermost first. */
export const InteractionScopeContext: Context<readonly InteractionScope[]> = createContext<
  readonly InteractionScope[]
>([])

// Context itself is the provider. This follows size-context's native JSX facade boundary.
const ContextProvider: any = InteractionScopeContext

export function InteractionScopeProvider(props: {
  scope?: InteractionScope
  children?: Renderable
}): unknown @{
  const parent = useContext(InteractionScopeContext)

  <ContextProvider value={childInteractionScopes(parent, props.scope)}>
    {props.children}
  </ContextProvider>
}

const childScopeLists = new WeakMap<
  readonly InteractionScope[],
  WeakMap<InteractionScope, readonly InteractionScope[]>
>()

/** Scope list for a subtree: the parent's list, extended by `scope` when set.
 *  The same pair always yields the same array, so the context stays stable
 *  without a per-provider memo hook. */
export function childInteractionScopes(
  parent: readonly InteractionScope[],
  scope: InteractionScope | undefined,
): readonly InteractionScope[] {
  if (!scope) {
    return parent
  }

  let lists = childScopeLists.get(parent)

  if (!lists) {
    lists = new WeakMap()
    childScopeLists.set(parent, lists)
  }

  let list = lists.get(scope)

  if (!list) {
    list = [...parent, scope]
    lists.set(scope, list)
  }

  return list
}

/** Track framework ownership through portals, independently of native physical ancestry. */
export function useInteractionMembership(): (host: object | null) => void {
  const scopes = useContext(InteractionScopeContext)
  const ref = useRef<InteractionMembership | null>(null)

  if (!ref.current) {
    ref.current = createInteractionMembership(scopes)
  }

  const membership = ref.current

  useLayoutEffect(() => {
    membership.commit(scopes)
    return membership.clear
  }, [scopes, membership])

  useInsertionEffect(() => membership.dispose, [membership])

  return membership.bind
}

/** Preserve ownership through a portal without adding a layout wrapper. */
export function InteractionPortalBoundary(props: {
  target: object
  children?: Renderable
}): unknown @{
  const scopes = useContext(InteractionScopeContext)

  for (const scope of scopes) {
    if (scope.suspended$.get() && !interactionScopeController(scope).covers(props.target)) {
      throw new Error(
        'Unsupported interaction scope: a portal cannot enter a suspended subtree outside its input coverage',
      )
    }
  }

  // Insertion metadata precedes every layout command, regardless of component order.
  useInsertionEffect(() => {
    const releases: (() => void)[] = []

    try {
      for (const scope of scopes) {
        releases.push(interactionScopeController(scope).registerMember(props.target))
      }
    } catch (error) {
      for (const release of releases.reverse()) {
        release()
      }

      throw error
    }

    return () => {
      for (const release of releases.reverse()) {
        release()
      }
    }
  }, [scopes, props.target])

  <>{props.children}</>
}
