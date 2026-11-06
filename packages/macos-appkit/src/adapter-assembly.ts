import { createSurfaceAdapters, type SurfaceAdapterDependencies } from './surface-adapters.ts'
import { createScrollAdapter, type ScrollAdapterDependencies } from './scroll-adapter.ts'
import { createContainerAdapters, type ContainerAdapterDependencies } from './container-adapters.ts'
import { createPickerAdapters, type PickerAdapterDependencies } from './picker-adapters.ts'
import { createTextAdapters, type TextAdapterDependencies } from './text-adapters.ts'
import { createControlAdapters, type ControlAdapterDependencies } from './control-adapters.ts'
import type { Registry } from './registry'
import type { ElementAdapterRegistration } from './element-adapter'
import { FailureCollector } from './failures.ts'
import { createPilotAdapters, type PilotAdapterDependencies } from './pilot-adapters.ts'

type Dependencies = SurfaceAdapterDependencies &
  ScrollAdapterDependencies &
  ContainerAdapterDependencies &
  PilotAdapterDependencies &
  ControlAdapterDependencies &
  TextAdapterDependencies &
  PickerAdapterDependencies & {
    registry: Pick<Registry, 'adapters'>
  }

export type ElementAdapters = ReturnType<typeof createElementAdapters>

/** Composition owns both initial installation and subsequent author registrations.
 * Replacing a builtin type composes one
 * canonical definition against its original builtin, never a previous override. */
export function createElementAdapters(deps: Dependencies) {
  const definitions = new Map(
    Object.entries({
      ...createPilotAdapters(deps),
      ...createControlAdapters(deps),
      ...createTextAdapters(deps),
      ...createPickerAdapters(deps),
      ...createContainerAdapters(deps),
      ...createSurfaceAdapters(deps),
      scrollview: createScrollAdapter(deps),
    }),
  )
  for (const [type, adapter] of definitions) {
    deps.registry.adapters.register(type, adapter)
  }
  function registerElementType(type: string, registration: ElementAdapterRegistration): void {
    const base = definitions.get(type)
    const { applyProp, layout, beforeProps } = registration
    const create = registration.create ?? base?.create
    if (!create) {
      throw new Error('AppKit adapter <' + type + '> requires create')
    }
    function phases(
      first: ((node: import('./model').ElementNode) => void) | undefined,
      second: ((node: import('./model').ElementNode) => void) | undefined,
    ) {
      if (!first) {
        return second
      }
      if (!second) {
        return first
      }
      return (node: import('./model').ElementNode) => {
        const failures = new FailureCollector()
        failures.run('registered phase', () => first(node))
        failures.run('builtin phase', () => second(node))
        failures.throwIfFailed()
      }
    }
    deps.registry.adapters.register(type, {
      ...base,
      ...registration,
      create,
      applyProp(node, name, value) {
        const handled =
          applyProp?.(node, name, value) || base?.applyProp?.(node, name, value) || false
        if (!handled && value !== undefined) {
          console.warn('[macos-host] ignored ' + type + ' prop ' + name)
        }
        return handled
      },
      beforeProps(node, patch) {
        beforeProps?.(node, patch)
        base?.beforeProps?.(node, patch)
      },
      retire: phases(registration.retire, base?.retire),
      prepareDispose: phases(registration.prepareDispose, base?.prepareDispose),
      dispose: phases(registration.dispose, base?.dispose),
      layout: layout
        ? (node) => {
            node.view?.invalidateIntrinsicContentSize()
            layout(node)
          }
        : base?.layout,
    })
  }
  return { registerElementType }
}
