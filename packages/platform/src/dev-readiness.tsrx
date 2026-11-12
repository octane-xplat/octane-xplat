import { useContext, useLayoutEffect, useRef } from 'octane'
import { createDevReadinessScope, type DevReadinessScope } from './dev-readiness-state'
import { DevReadinessContext } from './dev-readiness-context'

/** Props for a context-owned development-action readiness subtree. */
export interface DevActionScopeProps {
  /** Static diagnostic label; never include user data. Remount to change scope identity. */
  label: string
  /** Components whose registered work belongs to this scope. */
  children?: unknown
}

/**
 * Own readiness for descendant dev actions and nested scopes. Mount behind the
 * development gate. It tracks registered work, not arbitrary async tasks or pixels.
 * @example
 * import { DevActionScope } from '@octane-xplat/platform/dev-actions/readiness'
 * <DevActionScope label="Checkout"><Checkout /></DevActionScope>
 */
export function DevActionScope(props: DevActionScopeProps): unknown {
  const parent = useContext(DevReadinessContext)
  const ref = useRef<DevReadinessScope | null>(null)

  if (!ref.current) {
    ref.current = createDevReadinessScope(props.label)
  }

  const scope = ref.current

  useLayoutEffect(() => parent?.include(scope), [parent, scope])
  useLayoutEffect(() => () => scope.dispose(), [scope])
  return <DevReadinessContext value={scope}>{props.children}</DevReadinessContext>
}
