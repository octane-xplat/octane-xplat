import { useEffect, useState } from 'octane'
import { client } from './client'
import type { TweakOptions, TweakValue } from './protocol'

// Widen the literal so useTweak('cozy') types as string, not 'cozy' — the panel
// can set any value of the input type.
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : never

/**
 * Marks `value` as live-tweakable. In production — or whenever the dev plugin
 * is absent — this is a passthrough returning `value`. The dev Vite plugin
 * injects a third argument (the entry id) and the `__OCTANE_TWEAKS__` gate; only then
 * does the dev override path engage.
 */
export function useTweak<T extends TweakValue>(value: T, options?: TweakOptions): Widen<T>
/** @internal Injected by @octane-xplat/tweaks/vite; never pass by hand. */
export function useTweak<T extends TweakValue>(
  value: T,
  options: TweakOptions | undefined,
  id: string,
): Widen<T>

export function useTweak<T extends TweakValue>(
  value: T,
  options?: TweakOptions,
  id?: string,
): Widen<T> {
  // Hooks must run unconditionally: with no id (production/user builds) the
  // effect is a no-op and the hook returns the literal.
  const [override, setOverride] = useState<TweakValue | null>(null)

  useEffect(() => {
    if (typeof id !== 'string') {
      return
    }

    return client.watch(id, value as TweakValue, setOverride)
  }, [id])

  return (override ?? value) as Widen<T>
}
