import { useContext, useLayoutEffect, useRef } from 'octane'
import { createReadinessScope, type ReadinessController } from './readiness-state'
import { ReadinessContext } from './readiness-context'

/** Props for a context-owned registered-work subtree. */
export interface ReadinessScopeProps {
  /** Static diagnostic label; never include user data. Remount to change scope identity. */
  label: string
  /** Components whose registered work belongs to this scope. */
  children?: unknown
}

/**
 * Own readiness for descendant tasks, queries and nested scopes in every build mode.
 * Rendering and interaction remain independent of readiness.
 * @example
 * import { ReadinessScope } from '@octane-xplat/platform/readiness'
 * <ReadinessScope label="Checkout"><Checkout /></ReadinessScope>
 */
export function ReadinessScope(props: ReadinessScopeProps): unknown {
  const parent = useContext(ReadinessContext)
  const ref = useRef<ReadinessController | null>(null)

  if (!ref.current) {
    ref.current = createReadinessScope(props.label)
  }

  const scope = ref.current

  useLayoutEffect(() => parent?.include(scope), [parent, scope])
  useLayoutEffect(() => () => scope.dispose(), [scope])
  return <ReadinessContext value={scope}>{props.children}</ReadinessContext>
}
