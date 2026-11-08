import type { ElementNode, PropBag } from './model'

/** Private lifecycle shared by native builtins and registered extensions.
 * Live nodes retain their acquired definition, including after replacement. */
export interface ElementAdapter {
  readonly container: boolean
  readonly hasView: boolean
  readonly publicInstance?: 'node'
  readonly styleValidation?: 'text' | 'none'
  readonly containerStyles?: boolean
  readonly styleKeys?: ReadonlySet<string>
  validate?(props: PropBag, previous?: PropBag): void
  create(node: ElementNode, props: PropBag): void
  beforeProps?(node: ElementNode, patch: PropBag): void
  readonly childProps?: ReadonlySet<string>
  applyProp?(node: ElementNode, name: string, value: unknown): boolean
  afterProps?(node: ElementNode, patch: PropBag): void
  retire?(node: ElementNode): void
  prepareDispose?(node: ElementNode): void
  dispose?(node: ElementNode): void
  didAttach?(node: ElementNode): void
  layout?(node: ElementNode): void
}

export type ElementAdapterCatalog = ReturnType<typeof createElementAdapterCatalog>

export function createElementAdapterCatalog() {
  const definitions = new Map<string, ElementAdapter>()
  function register(type: string, adapter: ElementAdapter): void {
    // Capture the definition, so mutating a registration object cannot redirect
    // an already acquired node's lifecycle either.
    definitions.set(
      type,
      Object.freeze({
        ...adapter,
        styleKeys: adapter.styleKeys && new Set(adapter.styleKeys),
        childProps: adapter.childProps && new Set(adapter.childProps),
      }),
    )
  }

  function lookup(type: string): ElementAdapter | undefined {
    return definitions.get(type)
  }

  function entries(): ReadonlyArray<readonly [string, ElementAdapter]> {
    return [...definitions.entries()]
  }

  return { register, lookup, entries }
}

/** Registration uses the canonical phases. Builtin overrides may omit create;
 * new types must supply it before registration succeeds. */
export type ElementAdapterRegistration = Pick<ElementAdapter, 'container' | 'hasView'> &
  Partial<ElementAdapter>
