import type { ElementNode, PropBag } from './model'

/** Private lifecycle shared by native builtins and registered extensions.
 * Live nodes retain their acquired definition, including after replacement. */
export interface ElementAdapter {
  readonly container: boolean
  readonly hasView: boolean
  readonly containerStyles?: boolean
  readonly styleKeys?: ReadonlySet<string>
  validate?(props: PropBag, previous?: PropBag): void
  create(node: ElementNode, props: PropBag): void
  applyProp?(node: ElementNode, name: string, value: unknown): boolean
  afterProps?(node: ElementNode, patch: PropBag): void
  retire?(node: ElementNode): void
  prepareDispose?(node: ElementNode): void
  dispose?(node: ElementNode): void
  layout?(node: ElementNode): void
}

export type ElementAdapterCatalog = ReturnType<typeof createElementAdapterCatalog>

export function createElementAdapterCatalog() {
  const definitions = new Map<string, ElementAdapter>()
  function register(type: string, adapter: ElementAdapter): void {
    // Capture the definition, so mutating a registration object cannot redirect
    // an already acquired node's lifecycle either.
    definitions.set(type, Object.freeze({ ...adapter }))
  }
  function lookup(type: string): ElementAdapter | undefined {
    return definitions.get(type)
  }
  return { register, lookup }
}

/** Explicit bounded legacy inventory for the unpublished P5→P6 migration.
 * A migrated type missing its assembled definition must fail before acquisition. */
export const unconvertedElementTypes: ReadonlySet<string> = new Set([
  'rootlayout',
  'actionbar',
  'proxyviewcontainer',
  'masonview',
  'scrollview',
  'liquidglass',
  'label',
  'htmlview',
  '#text',
  'textfield',
  'textview',
  'searchbar',
  'datepicker',
  'timepicker',
  'listpicker',
  'listview',
  'segmentedbar',
  'tabview',
  'tabviewitem',
  'segmentedbaritem',
  'webview',
  'image',
  'animatedimage',
  'pager',
  'xplatvideo',
  'placeholder',
  'span',
  'formattedstring',
])
