import type { CornerOptions } from './props'

type Surface = { readonly _view: unknown }
type Setter = (surface: Surface, options: CornerOptions | null) => void

/** Avoid restarting native surface work on every layout event. */
export function createMasonSurfaceOwner(set: Setter) {
  const applied = new WeakMap<Surface, string>()

  return {
    update(surface: Surface, options: CornerOptions | null) {
      if (!surface._view) return
      const key = JSON.stringify(options)
      if (applied.get(surface) === key) return
      set(surface, options)
      applied.set(surface, key)
    },
    dispose(surface: Surface) {
      if (applied.has(surface) && surface._view) set(surface, null)
      applied.delete(surface)
    },
  }
}
