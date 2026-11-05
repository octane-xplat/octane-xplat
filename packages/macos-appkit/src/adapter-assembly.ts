import type { Registry } from './registry'
import type { ElementBehavior } from './model'
import { FailureCollector } from './failures.ts'
import { createPilotAdapters, type PilotAdapterDependencies } from './pilot-adapters.ts'

interface Dependencies extends PilotAdapterDependencies {
  registry: Pick<Registry, 'adapters' | 'registerElementType'>
}

export type ElementAdapters = ReturnType<typeof createElementAdapters>

/** Composition owns both initial installation and subsequent author registrations.
 * Legacy types remain explicit until P6. Replacing a migrated type composes one
 * canonical definition against its original builtin, never a previous override. */
export function createElementAdapters(deps: Dependencies) {
  const definitions = new Map(Object.entries(createPilotAdapters(deps)))
  for (const [type, adapter] of definitions) {
    deps.registry.adapters.register(type, adapter)
  }
  function registerElementType(type: string, behavior: ElementBehavior): void {
    deps.registry.registerElementType(type, behavior)
    const base = definitions.get(type)
    if (!base) {
      return
    }
    const { make, applyProp, destroy, layout, container, containerStyles, styleKeys } = behavior
    deps.registry.adapters.register(type, {
      ...base,
      container: container ?? base.container,
      containerStyles: containerStyles ?? base.containerStyles,
      styleKeys: styleKeys ?? base.styleKeys,
      create: make ?? base.create,
      applyProp(node, name, value) {
        return applyProp?.(node, name, value) || base.applyProp?.(node, name, value) || false
      },
      prepareDispose(node) {
        const failures = new FailureCollector()
        failures.run('registered prepare', () => destroy?.(node))
        failures.run('builtin prepare', () => base.prepareDispose?.(node))
        failures.throwIfFailed()
      },
      layout: layout
        ? (node) => {
            node.view?.invalidateIntrinsicContentSize()
            layout(node)
          }
        : base.layout,
    })
  }
  return { registerElementType }
}
