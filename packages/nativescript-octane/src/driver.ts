import { cssTreeParse } from '@nativescript/core/css/css-tree-parser'

// oxlint-disable-next-line xplat/no-ns-deep-import -- Core 9.1 does not export these registry enumerators from its root; prop resets need the registered setters.
import { _getProperties, _getStyleProperties } from '@nativescript/core/ui/core/properties'

import type { View as MasonView } from '@octane-xplat/nativescript-masonkit'

import { Style as MasonStyle } from '@octane-xplat/nativescript-masonkit/style'

import {
  ActionBar,
  ContentView,
  type EventData,
  FormattedString,
  LayoutBase,
  ListView,
  Span,
  TabView,
  TabViewItem,
  TextBase,
  View,
  type ViewBase,
  unsetValue,
  Utils,
} from '@nativescript/core'

import {
  createUniversalRoot,
  type UniversalEventListenerDescriptor,
  type UniversalHostCommand,
  type UniversalHostDriver,
  type UniversalPortalTargetContext,
  type UniversalPortalTargetHandle,
  type UniversalPortalTargetRegistration,
  type UniversalRoot,
} from 'octane/universal/native'

import { NATIVESCRIPT_RENDERER_ID } from './config.js'

import { ELEMENTS, EVENT_PROP, eventNameFor, onElementReplaced } from './elements.js'

import { releaseListView, setRenderItem, type RenderItem } from './list-view.js'

interface HostNode {
  readonly id: number
  readonly type: string
  /** Replaced in place when the tag's class is re-registered; `null` for `#text`. */
  view: ViewBase | null
  text: string
  props: Readonly<Record<string, unknown>>
  parent: NativeScriptParent
  readonly children: HostNode[]
  readonly listeners: Map<string, (data: EventData) => void>
  /** Change events muted while the driver writes the prop they echo (`text` → `textChange`). */
  readonly muted: Set<string>
  /** Whether this node's `text` has been driven by `#text` children. */
  textApplied: boolean
  readonly propDefaults: Map<string, unknown>
  readonly styleDefaults: Map<string, unknown>
  styleKeys: Set<string>
  textSpans?: Map<HostNode, Span>
  foldedText?: {
    fs: FormattedString
  } | null
}

/**
 * A command `parent`: a host node id's node, the root container (`null`), or a
 * root-scoped portal target handle minted by `portals.prepareTarget`.
 */
type NativeScriptParent = HostNode | UniversalPortalTargetHandle | null

/**
 * One active portal target: the caller-supplied native view the runtime sends
 * `insert`/`move`/`remove` commands against, keyed in the container by
 * `handle.id`. `refs` counts live registrations — several portals may share a
 * target view.
 */
interface PortalTarget {
  readonly handle: UniversalPortalTargetHandle
  /** Swapped in place when the target's element class is re-registered. */
  view: LayoutBase
  readonly children: HostNode[]
  refs: number
}

export interface NativeScriptContainer {
  readonly host: ViewBase
  readonly nodes: Map<number, HostNode>
  readonly children: HostNode[]
  /** Active portal targets by handle id, emptied as registrations release. */
  readonly portalTargets: Map<string | number, PortalTarget>
  root: UniversalRoot | null
}

export interface BatchObserver {
  /** Before the commands apply; previous layout is still visible. */
  willApply?(
    container: NativeScriptContainer,
    commands: readonly UniversalHostCommand[],
    depth: number,
  ): void
  /** After commands and tab-view updates succeed. */
  didApply?(
    container: NativeScriptContainer,
    commands: readonly UniversalHostCommand[],
    depth: number,
  ): void
}

/** `#text` nodes carry no view; the driver folds them into the parent's `text`. */
const TEXT = '#text'

/**
 * The container that instantiated each driver-owned view. A portal target a
 * different root created is foreign — portals may target views owned by the
 * caller or by this root, never by another root (whose teardown would orphan
 * the portal children or carry them into a view it destroys). Old native
 * references resolve through their logical node, even when no portal
 * registration is active during a subsequent hot replacement.
 */
const viewOwners = new WeakMap<
  ViewBase,
  {
    container: NativeScriptContainer
    node: HostNode
  }
>()

/** Stable per-view ids, so re-rendering a portal mints the same target handle. */
const portalTargetIds = new WeakMap<ViewBase, number>()

let nextPortalTargetId = 0

function isPortalTarget(value: unknown): value is UniversalPortalTargetHandle {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as UniversalPortalTargetHandle).$$kind === 'octane.universal.portal-target'
  )
}

function portalTargetOf(
  container: NativeScriptContainer,
  handle: UniversalPortalTargetHandle,
): PortalTarget {
  const entry = container.portalTargets.get(handle.id)
  if (entry === undefined || entry.handle !== handle) {
    throw new Error(`NativeScript driver: inactive portal target ${JSON.stringify(handle.id)}.`)
  }
  return entry
}

function expect(container: NativeScriptContainer, id: number): HostNode {
  const node = container.nodes.get(id)
  if (node === undefined) {
    throw new Error(`NativeScript driver: unknown host ${id}.`)
  }
  return node
}

function childrenOf(container: NativeScriptContainer, parent: NativeScriptParent): HostNode[] {
  if (parent === null) {
    return container.children
  }
  if (isPortalTarget(parent)) {
    return portalTargetOf(container, parent).children
  }
  return parent.children
}

function hostViewOf(container: NativeScriptContainer, parent: NativeScriptParent): ViewBase | null {
  if (parent === null) {
    return container.host
  }
  if (isPortalTarget(parent)) {
    return portalTargetOf(container, parent).view
  }
  return parent.view
}

function createNode(
  container: NativeScriptContainer,
  id: number,
  type: string,
  props: Readonly<Record<string, unknown>>,
): HostNode {
  const node: HostNode = {
    id,
    type,
    view: type === TEXT ? null : instantiate(type),
    text: '',
    props,
    parent: null,
    children: [],
    listeners: new Map(),
    muted: new Set(),
    textApplied: false,
    propDefaults: new Map(),
    styleDefaults: new Map(),
    styleKeys: new Set(),
  }
  if (node.view !== null) {
    viewOwners.set(node.view, { container, node })
  }
  applyProps(node, props)
  return node
}

function instantiate(type: string): ViewBase {
  const Element = ELEMENTS.get(type)
  if (Element === undefined) {
    throw new Error(`NativeScript driver: <${type}> is not a registered element.`)
  }
  const view = new Element()
  if (MASON_CONTAINER_TAGS.has(type)) {
    applyMasonDefaults(type, view)
  }
  return view
}

function applyProps(node: HostNode, props: Readonly<Record<string, unknown>>): void {
  if (node.view === null) {
    node.text = props.value == null ? '' : String(props.value)
    syncText(node.parent)
    return
  }
  // A list's cell renderer must be in place before `items` reloads the cells.
  if ('renderItem' in props) {
    setProp(node, node.view, 'renderItem', props.renderItem)
  }
  for (const name in props) {
    if (name !== 'renderItem') {
      setProp(node, node.view, name, props[name])
    }
  }
}

/**
 * `update` carries the host's dynamic-prop snapshot; attributes that were
 * static in the compiled plan arrive only with `create`. Merge instead of
 * replace, or a first update would strip a node's static layout props.
 */
function updateProps(node: HostNode, next: Readonly<Record<string, unknown>>): void {
  for (const name of Object.keys(node.props)) {
    if (!Object.hasOwn(next, name) && node.view !== null) {
      setProp(node, node.view, name, undefined)
    }
  }
  applyProps(node, next)
  node.props = next
  if (
    node.parent !== null &&
    !isPortalTarget(node.parent) &&
    MASON_CONTAINER_TAGS.has(node.parent.type)
  ) {
    applyMasonChildLayout(node, node.parent)
  }
}

function setProp(node: HostNode, view: ViewBase, name: string, value: unknown): void {
  if (name === 'children' || name === 'key' || name === 'ref') {
    return
  }
  // Event props arrive as their own `event` commands.
  if (EVENT_PROP.test(name)) {
    return
  }
  if (
    value === undefined &&
    !node.propDefaults.has(name) &&
    (name !== 'style' || node.styleKeys.size === 0)
  ) {
    return
  }
  if (value != null && value !== unsetValue && name !== 'style' && !node.propDefaults.has(name)) {
    node.propDefaults.set(name, Reflect.get(view, name))
  }
  if (name === 'className' || name === 'class') {
    view.className = value == null || value === unsetValue ? unsetValue : normalizeClass(value)
    return
  }
  if (name === 'style') {
    applyStyle(node, view, value)
    return
  }
  if (name === 'renderItem' && view instanceof ListView) {
    if (value != null && typeof value !== 'function') {
      throw new TypeError('renderItem must be a function')
    }
    setRenderItem(view, (value ?? null) as RenderItem | null, createNativeScriptRoot)
    return
  }
  // Mason cutover — all layout props are style-only: warn when a former
  // prop name arrives on a mason container or a child of one.
  if (MASON_CONTAINER_TAGS.has(node.type)) {
    applyMasonContainerProp(node, view, name, value)
  }
  if (
    MASON_STYLE_ONLY_PROPS.has(name) &&
    (MASON_CONTAINER_TAGS.has(node.type) ||
      (node.parent !== null &&
        !isPortalTarget(node.parent) &&
        MASON_CONTAINER_TAGS.has(node.parent.type)))
  ) {
    warnStyleOnlyProp(node, name)
  }
  // Never forward nullish values to coercing native setters. A never-applied
  // prop has nothing to restore, including when its initial value is undefined.
  const target = view
  if (value == null || value === unsetValue) {
    if (!node.propDefaults.has(name)) {
      return
    }
    value = isRegisteredProperty(view, name) ? unsetValue : node.propDefaults.get(name)
  }
  // Core raises `<name>Change` for a script write exactly as for a user
  // edit; a controlled input must not see its own value come back as one.
  const echo = `${name}Change`
  const listening = node.listeners.has(echo)
  if (listening) {
    node.muted.add(echo)
  }
  try {
    Reflect.set(target, name, value)
    if (value === unsetValue && _getStyleProperties().some((p) => p.name === name)) {
      refreshCss(view)
    }
  } finally {
    if (listening) {
      node.muted.delete(echo)
    }
  }
}

// `class`/`className` compose clsx-style on the DOM renderer; join arrays
// with spaces so NativeScript's class selectors can match each class.
function normalizeClass(value: unknown): string {
  if (typeof value === 'number') {
    return value ? String(value) : ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(normalizeClass).filter(Boolean).join(' ')
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .filter((key) => Reflect.get(value, key))
      .join(' ')
  }
  return ''
}

/** Match the actual registered setter, not merely a globally registered name. */
function isRegisteredProperty(view: ViewBase, name: string) {
  let prototype = view
  while (prototype !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
    if (descriptor !== undefined) {
      return (
        _getProperties().some(
          (property) => property.name === name && property.set === descriptor.set,
        ) ||
        (_getStyleProperties().some((property) => property.name === name) &&
          descriptor.set !== undefined &&
          name in view.style)
      )
    }
    prototype = Object.getPrototypeOf(prototype)
  }
  return false
}

/** Core discards the cascaded value when a local value occupies its slot. */
function refreshCss(view: ViewBase) {
  // No public single-key refresh exists in core 9.1. setInlineStyle only writes
  // declarations; the recursive _onCssStateChange would also touch descendants.
  view._cssState?.onChange()
}

function applyStyle(node: HostNode, view: ViewBase, value: unknown): void {
  const style = view.style
  const next =
    typeof value === 'string'
      ? inlineStyleKeys(value)
      : value !== null && typeof value === 'object' && value !== unsetValue
        ? new Set(Object.keys(value))
        : new Set<string>()
  for (const key of node.styleKeys) {
    if (!next.has(key)) {
      unsetStyleKey(node, view, key)
    }
  }
  for (const key of next) {
    if (!node.styleDefaults.has(key)) {
      node.styleDefaults.set(key, Reflect.get(style, key))
    }
  }
  if (typeof value === 'string') {
    view.setInlineStyle(value)
  } else if (value !== null && typeof value === 'object' && value !== unsetValue) {
    for (const key of next) {
      const entry = Reflect.get(value, key)
      if (entry == null || entry === unsetValue) {
        unsetStyleKey(node, view, key)
      } else {
        Reflect.set(style, key, entry)
      }
    }
  }
  node.styleKeys = next
}

function unsetStyleKey(node: HostNode, view: ViewBase, name: string) {
  // The foreign-leaf binding observes the resolved style, so removal needs
  // no leaf write here — the cascade restore raises the longhand's Change
  // event and the binding re-syncs.
  const style = view.style
  if (name.startsWith('--')) {
    view.style.removeUnscopedCssVariable(name)
  } else {
    const registered = _getStyleProperties().some((p) => p.name === name || p.cssLocalName === name)
    Reflect.set(style, name, registered ? unsetValue : node.styleDefaults.get(name))
  }
  refreshCss(view)
}

function inlineStyleKeys(style: string): Set<string> {
  const keys = new Set<string>()
  const sheet = cssTreeParse(`local { ${style} }`, undefined)
  for (const rule of sheet.stylesheet.rules) {
    for (const declaration of rule.declarations ?? []) {
      if (declaration.type !== 'declaration') {
        continue
      }
      const name = declaration.property
      keys.add(
        name.startsWith('--')
          ? name
          : name.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase()),
      )
    }
  }
  return keys
}

// --- Mason layout cutover ---------------------------------------------------
// masonview is the single layout intrinsic — all layout is expressed in CSS
// props (display/flex/grid/position), forwarded onto the node's mason Style.
// scrollview stays the platform scroll shell (MasonKit Scroll). Dispatch is
// by node tag, so nothing below re-derives the view's class.
const MASON_CONTAINER_TAGS = new Set(['masonview', 'scrollview'])

// Props whose CssProperty is registered on core's layout classes, never on
// MasonKit's ViewBase — `view.flexDirection` would store a dead field, so the
// write is forwarded to the mason Style surface instead.
// Every former layout-prop name — contract props, LayoutChildProps sugar,
// and raw CSS keys alike — is style-only now. As direct props they land on a
// dead native field, so the driver warns once per key instead.
const MASON_STYLE_ONLY_PROPS = new Set([
  'display',
  'position',
  'inset',
  'aspectRatio',
  'overflow',
  'overflowX',
  'overflowY',
  'flexBasis',
  'justifySelf',
  'justifyItems',
  'direction',
  'boxSizing',
  'textAlign',
  'scrollbarWidth',
  'gridTemplateRows',
  'gridTemplateColumns',
  'gridTemplateAreas',
  'gridAutoFlow',
  'gridAutoRows',
  'gridAutoColumns',
  'gridRow',
  'gridColumn',
  'gridRowStart',
  'gridRowEnd',
  'gridColumnStart',
  'gridColumnEnd',
  'gridArea',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gap',
  'rowGap',
  'columnGap',
  'flexGrow',
  'flexShrink',
  'alignSelf',
  'order',
  'row',
  'col',
  'rowSpan',
  'colSpan',
  'dock',
  'horizontalAlignment',
  'verticalAlignment',
  'flexWrapBefore',
  'stretchLastChild',
  'itemWidth',
  'itemHeight',
  'rows',
  'columns',
])

// Only leaf layout longhands: core expands shorthands before notifying.
// Read the effective NS style, never copy authored values into another tier.
const MASON_LEAF_STYLE_KEYS = [
  'display',
  'visibility',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'justifySelf',
  'order',
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'aspectRatio',
  'gridRow',
  'gridColumn',
  'gridRowStart',
  'gridRowEnd',
  'gridColumnStart',
  'gridColumnEnd',
]

const masonLeafBindings = new WeakMap<
  ViewBase,
  {
    sync(): void
    dispose(): void
  }
>()

const warnedStyleOnlyProps = new Set()

function warnStyleOnlyProp(node: HostNode, name: string) {
  const key = node.type + ':' + name
  if (warnedStyleOnlyProps.has(key)) {
    return
  }
  warnedStyleOnlyProps.add(key)
  console.warn(
    `[xplat] <${node.type} ${name}=...> is a layout key — move it into style={{ ${name}: ... }} or a class.`,
  )
}

/** A mason Style bound to the node's mason leaf — `_styleHelper` on MasonKit's
 *  own views; for foreign ({N}-native) children, `Style.fromView` binds the
 *  leaf node `nodeForView` creates at insert. Returns undefined until the
 *  child's native view exists (props are stashed and replayed at attach). */
function masonChildStyle(view: ViewBase | null | undefined): MasonStyle | undefined {
  if (view === null || view === undefined) {
    return undefined
  }
  const helper: MasonStyle | undefined = Reflect.get(view, '_styleHelper')
  if (helper !== undefined) {
    return helper
  }
  const native = view.nativeViewProtected
  if (!native) {
    return undefined
  }
  try {
    // MasonKit types this API with its own View, but it explicitly binds foreign native views.
    return MasonStyle.fromView(view as unknown as MasonView, native)
  } catch {
    return undefined
  }
}

/** Container-role defaults — equivalent to each NS layout's built-in mode. */
function applyMasonDefaults(type: string, view: ViewBase) {
  const style = view.style
  if (type === 'scrollview') {
    style.display = 'flex'
    style.flexDirection = 'column'
    style.overflowY = 'scroll'
    style.overflowX = 'hidden'
  }
  // Core's alignItems CssProperty already defaults to stretch. A local
  // write here would outrank every stylesheet rule, including centering.
  // Containers establish the containing block for absolute descendants.
  // Write through the css-source accessor so stylesheet `position` rules
  // (e.g. `.vx-absolute > *` absolute children) still take effect — a
  // local write here shadowed them and pinned Windows overlays in flow.
  Reflect.set(style, 'css:position', 'relative')
}

/** Container-role prop -> mason style write. Runs for every prop on a mason
 *  container; only the scrollview chrome keys (orientation/scroll toggles)
 *  still translate — everything else is style-only. */
function applyMasonContainerProp(node: HostNode, view: ViewBase, name: string, value: unknown) {
  const style = view.style
  const unset = value == null || value === unsetValue
  if (node.type === 'scrollview') {
    if (name === 'orientation' || name === 'horizontal') {
      const horizontal = !unset && (value === 'horizontal' || value === true)
      style.flexDirection = horizontal ? 'row' : 'column'
      style.overflowX = horizontal ? 'scroll' : 'hidden'
      style.overflowY = horizontal ? 'hidden' : 'scroll'
    }
    if (name === 'isScrollEnabled') {
      const enabled = !unset && value !== false
      style.overflowX = enabled ? 'scroll' : 'hidden'
      style.overflowY = enabled ? 'scroll' : 'hidden'
    }
  }
}

/** Keep foreign leaves in sync with the effective NativeScript cascade.
 * MasonKit's property handlers only forward to its own _styleHelper views.
 * Observe longhand changes so classes, pseudo states, inline removal and
 * stylesheet refreshes follow the same path. Rebind on loaded because the
 * native leaf may not exist at insert, or may have been recreated. */
function applyMasonChildLayout(node: HostNode, parent: HostNode) {
  const view = node.view
  if (!view || Reflect.get(view, '_styleHelper') !== undefined) {
    return
  }
  if (masonLeafBindings.has(view)) {
    masonLeafBindings.get(view)?.sync()
    return
  }
  let native: unknown
  let leaf: MasonStyle | undefined
  let defaultDisplay: unknown
  const applied = new Map()
  const syncKey = (key: string) => {
    if (!leaf) {
      return
    }
    let value = Reflect.get(view.style, key)
    // Core omits collapsed children from measurement. Mason must omit the
    // same leaf from layout, otherwise the two hosts disagree on its box.
    // Keep the cascade intact so uncollapsing restores authored display.
    if (key === 'display') {
      value = view.style.visibility === 'collapse' ? 'none' : (value ?? defaultDisplay)
    }
    if (value === undefined || value === unsetValue) {
      // Plain/unregistered fields can vanish without a CssProperty
      // default. Mason requires an explicit grid reset (undefined is
      // ignored by its setters).
      if ((key === 'gridRow' || key === 'gridColumn') && applied.has(key)) {
        value = 'auto'
      } else {
        return
      }
    }
    // Core's auto self-alignment is Mason's normal (-1 / parent default).
    if ((key === 'alignSelf' || key === 'justifySelf') && value === 'auto') {
      value = 'normal'
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      value = 'auto'
    }
    // Mason's object px setter treats the number as DIP; core's parsed
    // px length is physical pixels. Convert once at this boundary.
    if (value && typeof value === 'object' && value.unit === 'px') {
      value = { value: Utils.layout.toDeviceIndependentPixels(value.value), unit: 'dip' }
    }
    const previous = applied.get(key)
    if (
      Object.is(previous, value) ||
      (value &&
        previous &&
        typeof value === 'object' &&
        value.unit === previous.unit &&
        value.value === previous.value)
    ) {
      return
    }
    Reflect.set(leaf, key, value)
    applied.set(key, value)
    return true
  }
  const sync = () => {
    if (native !== view.nativeViewProtected || !leaf) {
      native = view.nativeViewProtected
      leaf = masonChildStyle(view)
      defaultDisplay = leaf?.display
      applied.clear()
    }
    let changed = false
    const update = () => {
      for (const key of MASON_LEAF_STYLE_KEYS) {
        changed = syncKey(key) || changed
      }
    }
    // Foreign native style writes normally flush on a microtask, after
    // core may already have measured the parent. Commit first, then ask
    // the Mason container to recompute the foreign frame.
    if (leaf?.batch) {
      leaf.batch(update)
    } else {
      update()
    }
    if (changed) {
      parent.view?.requestLayout?.()
    }
  }
  const handlers: [string, () => void][] = MASON_LEAF_STYLE_KEYS.map((key) => {
    const handler = () => sync()
    view.style.on?.(key + 'Change', handler)
    return [key + 'Change', handler]
  })
  view.on('loaded', sync)
  masonLeafBindings.set(view, {
    sync,
    dispose() {
      for (const [event, handler] of handlers) {
        view.style.off?.(event, handler)
      }
      view.off('loaded', sync)
    },
  })
  sync()
}

function releaseMasonChildLayout(view: ViewBase | null) {
  if (!view) {
    return
  }
  masonLeafBindings.get(view)?.dispose()
  masonLeafBindings.delete(view)
}

/** Mint (or reuse) the driver-owned Span a `#text` child folds into when it
 *  shares its text host with run elements, then apply its current text. */
function foldedSpan(parent: HostNode, child: HostNode): Span {
  const spans = (parent.textSpans ??= new Map())
  for (const key of spans.keys()) {
    if (!parent.children.includes(key)) {
      spans.delete(key)
    }
  }
  let span = spans.get(child)
  if (span === undefined) {
    span = new Span()
    spans.set(child, span)
  }
  span.text = child.text
  return span
}

/** Assign a FormattedString's run list in place. Removed spans leave the
 *  collection before any re-add — a span re-enters only after its parent
 *  clears, so reorder/growth never re-adds a still-parented span. */
function replaceSpans(fs: FormattedString, runs: Span[]) {
  const spans = fs.spans
  let i = 0
  while (i < spans.length && i < runs.length && Reflect.get(spans, i) === runs[i]) {
    i++
  }
  if (i === spans.length && i === runs.length) {
    return
  }
  if (i < spans.length) {
    spans.splice(i, spans.length - i)
  }
  if (i < runs.length) {
    spans.splice(i, 0, ...runs.slice(i))
  }
}

/** Recompute a text host's `text` from its `#text` children. */
function syncText(parent: NativeScriptParent): void {
  if (parent === null || isPortalTarget(parent)) {
    return
  }
  const view = parent.view
  if (view instanceof Span) {
    // A Span can't host views; its `#text` children fold into `text`.
    let text = ''
    for (const child of parent.children) {
      if (child.view === null) {
        text += child.text
      }
    }
    view.text = text
    return
  }
  if (view instanceof FormattedString) {
    // Span children splice through add/removeViewChild; `#text` children
    // fold into minted spans interleaved in child order.
    if (!parent.children.some((child) => child.view === null)) {
      return
    }
    const runs: Span[] = []
    for (const child of parent.children) {
      if (child.view === null) {
        runs.push(foldedSpan(parent, child))
      } else if (child.view instanceof Span) {
        runs.push(child.view)
      }
    }
    replaceSpans(view, runs)
    return
  }
  if (!(view instanceof TextBase)) {
    return
  }
  const elementChildren = parent.children.filter((child) => child.view !== null)
  if (elementChildren.length > 0 && elementChildren.every((child) => child.view instanceof Span)) {
    // Mixed text/span children fold into one driver-owned FormattedString
    // in child order. An explicit formattedstring child or another view
    // type keeps its own attach path instead of joining the fold.
    const folded = (parent.foldedText ??= { fs: new FormattedString() })
    const runs: Span[] = []
    for (const child of parent.children) {
      runs.push(child.view instanceof Span ? child.view : foldedSpan(parent, child))
    }
    replaceSpans(folded.fs, runs)
    if (view.formattedText !== folded.fs) {
      view.formattedText = folded.fs
    }
    if (parent.textApplied || view.text !== '') {
      parent.textApplied = false
      view.text = ''
    }
    return
  }
  if (parent.foldedText != null) {
    if (view.formattedText === parent.foldedText.fs) {
      view.formattedText = CLEARED
    }
    parent.foldedText = null
  }
  let text = ''
  let found = false
  for (const child of parent.children) {
    if (child.view !== null) {
      continue
    }
    text += child.text
    found = true
  }
  if (!found && !parent.textApplied) {
    return
  }
  parent.textApplied = found
  view.text = text
}

function addViewChild(parentView: ViewBase, view: ViewBase, index: number): void {
  // Slot-hosted children (e.g. ui-drawer's mainContent/leftDrawer): the host
  // wires the view up through a property setter, and its addChild is a no-op
  // — so this check must run before the LayoutBase branch.
  const slot: unknown = Reflect.get(view, 'hostSlot')
  if (typeof slot === 'string' && slot in parentView) {
    Reflect.set(parentView, slot, view)
    return
  }
  if (parentView instanceof LayoutBase) {
    parentView.insertChild(view as View, Math.min(index, parentView.getChildrenCount()))
    return
  }
  // Custom-layout containers that own their child list without subclassing
  // LayoutBase (e.g. MasonKit ViewBase — CustomLayoutView → ContainerView).
  // Plain View/ContainerView lacks insertChild, so this stays a capability
  // check rather than a catch-all.
  if (
    typeof Reflect.get(parentView, 'insertChild') === 'function' &&
    typeof Reflect.get(parentView, 'removeChild') === 'function'
  ) {
    const count =
      typeof Reflect.get(parentView, 'getChildrenCount') === 'function'
        ? Reflect.get(parentView, 'getChildrenCount').call(parentView)
        : index
    Reflect.get(parentView, 'insertChild').call(parentView, view, Math.min(index, count))
    return
  }
  if (parentView instanceof ContentView) {
    parentView.content = view as View
    return
  }
  // A tab view's `items` is derived from its node's children (`syncTabViewItems`):
  // core rejects an item that has no view yet, and children attach after their parent.
  if (parentView instanceof TabView && view instanceof TabViewItem) {
    return
  }
  if (parentView instanceof TabViewItem) {
    parentView.view = view as View
    return
  }
  if (parentView instanceof FormattedString && view instanceof Span) {
    // When the formattedstring mixes `#text` and span children, syncText
    // owns the whole ordered run list.
    const owner = viewOwners.get(parentView)?.node
    if (owner != null && owner.children.some((child) => child.view === null)) {
      syncText(owner)
      return
    }
    parentView.spans.splice(Math.min(index, parentView.spans.length), 0, view)
    return
  }
  if (parentView instanceof TextBase && view instanceof Span) {
    // A span run under a text host joins its folded FormattedString;
    // syncText rebuilds the ordered run list.
    const owner = viewOwners.get(parentView)?.node
    if (owner != null) {
      syncText(owner)
    }
    return
  }
  if (parentView instanceof TextBase && view instanceof FormattedString) {
    parentView.formattedText = view
    return
  }
  if (parentView instanceof ActionBar) {
    parentView.titleView = view as View
    return
  }
  throw new Error(
    `NativeScript driver: <${parentView.typeName}> cannot host a <${view.typeName}> child.`,
  )
}

/** NativeScript empties a single-child slot with `null`; the typings admit only the view type. */
const CLEARED = null as never

function removeViewChild(parentView: ViewBase | null, view: ViewBase): void {
  if (parentView === null) {
    return
  }
  const slot: unknown = Reflect.get(view, 'hostSlot')
  if (typeof slot === 'string' && Reflect.get(parentView, slot) === view) {
    Reflect.set(parentView, slot, null)
    return
  }
  if (parentView instanceof LayoutBase) {
    // `removeChild` throws for a view that is not attached — and `insert`
    // detaches unconditionally, including nodes that were never attached.
    if (view.parent === parentView) {
      Reflect.get(parentView, 'removeChild').call(parentView, view as View)
    }
    return
  }
  // Same capability check as addViewChild: custom-layout containers that
  // aren't LayoutBase subclasses remove children through removeChild.
  if (
    typeof Reflect.get(parentView, 'removeChild') === 'function' &&
    typeof Reflect.get(parentView, 'insertChild') === 'function'
  ) {
    if (view.parent === parentView) {
      Reflect.get(parentView, 'removeChild').call(parentView, view as View)
    }
    return
  }
  if (parentView instanceof ContentView) {
    if (parentView.content === view) {
      parentView.content = CLEARED
    }
    return
  }
  if (parentView instanceof TabView && view instanceof TabViewItem) {
    return
  }
  if (parentView instanceof TabViewItem) {
    // Core never lets an item's view change, so the item is detached from it directly.
    if (parentView.view === view) {
      parentView._removeView(view)
    }
    return
  }
  if (parentView instanceof FormattedString && view instanceof Span) {
    const owner = viewOwners.get(parentView)?.node
    if (owner != null && owner.children.some((child) => child.view === null)) {
      syncText(owner)
      return
    }
    const index = parentView.spans.indexOf(view)
    if (index !== -1) {
      parentView.spans.splice(index, 1)
    }
    return
  }
  if (parentView instanceof TextBase && view instanceof Span) {
    const owner = viewOwners.get(parentView)?.node
    if (owner != null) {
      syncText(owner)
    }
    return
  }
  if (parentView instanceof TextBase && parentView.formattedText === view) {
    parentView.formattedText = CLEARED
    return
  }
  if (parentView instanceof ActionBar && parentView.titleView === view) {
    parentView.titleView = CLEARED
  }
}

/**
 * Mirror a tab view's children onto its `items`. Only items that already hold a view are
 * listed: core throws for a view-less item, and an item's view arrives after the item.
 * Core tears down the items it keeps whenever `items` changes (fixed in NativeScript
 * 9.1.3, NativeScript/NativeScript#11446), so a batch must reach it as one assignment.
 */
function syncTabViewItems(node: HostNode): void {
  const tabView = node.view
  if (!(tabView instanceof TabView)) {
    return
  }
  const items: TabViewItem[] = []
  for (const child of node.children) {
    if (child.view instanceof TabViewItem && child.view.view) {
      items.push(child.view)
    }
  }
  const current = tabView.items ?? []
  if (current.length === items.length && current.every((item, i) => item === items[i])) {
    return
  }
  tabView.items = items
}

/** Tab view nodes touched by each batch being applied, innermost last; synced when it ends. */
const pendingTabViews: Set<HostNode>[] = []

function markTabView(node: HostNode | null): void {
  if (node === null || !(node.view instanceof TabView)) {
    return
  }
  const pending = pendingTabViews[pendingTabViews.length - 1]
  if (pending === undefined) {
    syncTabViewItems(node)
  } else {
    pending.add(node)
  }
}

function flushTabViews(pending: Set<HostNode> | undefined): void {
  if (pending === undefined) {
    return
  }
  for (const node of pending) {
    syncTabViewItems(node)
  }
}

/** The tab view node that a node's attachment can change the items of, if any. */
function tabViewOwning(node: HostNode): HostNode | null {
  const parent = node.parent
  if (parent === null || isPortalTarget(parent)) {
    return null
  }
  if (node.view instanceof TabViewItem) {
    return parent
  }
  if (parent.view instanceof TabViewItem) {
    const grandparent = parent.parent
    return grandparent !== null && !isPortalTarget(grandparent) ? grandparent : null
  }
  return null
}

function detach(container: NativeScriptContainer, node: HostNode): void {
  releaseMasonChildLayout(node.view)
  const parent = node.parent
  const siblings = childrenOf(container, parent)
  const index = siblings.indexOf(node)
  if (index !== -1) {
    siblings.splice(index, 1)
  }
  if (node.view === null) {
    syncText(parent)
  } else {
    removeViewChild(hostViewOf(container, parent), node.view)
  }
  if (node.view instanceof TabViewItem && parent !== null && !isPortalTarget(parent)) {
    markTabView(parent)
  }
  node.parent = null
}

function attach(container: NativeScriptContainer, node: HostNode): void {
  const parent = node.parent
  if (node.view === null) {
    syncText(parent)
    return
  }
  const parentView = hostViewOf(container, parent)
  if (parentView === null) {
    return
  }
  const siblings = childrenOf(container, parent)
  let index = 0
  if (isPortalTarget(parent) && parentView instanceof LayoutBase) {
    // Other roots and the caller can share this layout. Anchor to the next
    // attached sibling's actual position; an offset from the tail assumes
    // that no foreign children follow or interrupt this entry's children.
    // With no following sibling, append after the target's existing content.
    index = parentView.getChildrenCount()
    let found = false
    for (const sibling of siblings) {
      if (sibling === node) {
        found = true
      } else if (found && sibling.view?.parent === parentView) {
        const siblingIndex = parentView.getChildIndex(sibling.view as View)
        if (siblingIndex !== -1) {
          index = siblingIndex
          break
        }
      }
    }
  } else {
    for (const sibling of siblings) {
      if (sibling === node) {
        break
      }
      if (sibling.view !== null) {
        index++
      }
    }
  }
  addViewChild(parentView, node.view, index)
  // The child's mason leaf node exists only once the parent has attached it;
  // synchronize effective styles after attachment.
  if (parent !== null && !isPortalTarget(parent) && MASON_CONTAINER_TAGS.has(parent.type)) {
    for (const sibling of childrenOf(container, parent)) {
      applyMasonChildLayout(sibling, parent)
    }
  }
  markTabView(tabViewOwning(node))
}

function insert(
  container: NativeScriptContainer,
  parent: NativeScriptParent,
  node: HostNode,
  before: number | null,
): void {
  detach(container, node)
  const siblings = childrenOf(container, parent)
  const index = before === null ? -1 : siblings.findIndex((sibling) => sibling.id === before)
  if (index === -1) {
    siblings.push(node)
  } else {
    siblings.splice(index, 0, node)
  }
  node.parent = parent
  attach(container, node)
}

/**
 * Attaching a subtree makes NativeScript fire `loaded` (and friends)
 * synchronously, in the middle of applying the same batch that registered the
 * listener — which is not yet active. Events arriving mid-apply are deferred
 * to a microtask (after the commit finishes, when the listener is live), and
 * a dispatch to a listener that is gone is dropped rather than allowed to
 * abort the rest of a batch. A cell root committing inside a list's batch
 * nests an apply, so this is a depth rather than a flag.
 */
let applyingDepth = 0

const batchObservers = new Set<BatchObserver>()

export function observeBatches(observer: BatchObserver): () => void {
  batchObservers.add(observer)
  return () => {
    batchObservers.delete(observer)
  }
}

function notifyBatchObservers(
  hook: keyof BatchObserver,
  container: NativeScriptContainer,
  commands: readonly UniversalHostCommand[],
  depth: number,
) {
  for (const observer of [...batchObservers]) {
    try {
      observer[hook]?.(container, commands, depth)
    } catch (error) {
      console.error('NativeScript driver: batch observer threw:', error)
    }
  }
}

function setEvent(
  container: NativeScriptContainer,
  node: HostNode,
  type: string,
  listener: UniversalEventListenerDescriptor | null,
): void {
  const view = node.view
  if (view === null) {
    return
  }
  const previous = node.listeners.get(type)
  if (previous !== undefined) {
    view.off(type, previous)
    node.listeners.delete(type)
  }
  if (listener === null) {
    return
  }
  const handler = (data: EventData) => {
    if (node.muted.has(type)) {
      return
    }
    const root = container.root
    if (root === null) {
      return
    }
    const fire = () => {
      try {
        root.eventScope(listener.priority, () => root.dispatchEvent(listener.id, data))
      } catch (error) {
        console.warn(`NativeScript driver: dropped ${type} event:`, error)
      }
    }
    if (applyingDepth > 0) {
      Promise.resolve().then(fire)
    } else {
      fire()
    }
  }
  node.listeners.set(type, handler)
  view.on(type, handler)
}

function disposeListeners(node: HostNode): void {
  releaseMasonChildLayout(node.view)
  const view = node.view
  if (view !== null) {
    for (const [type, handler] of node.listeners) {
      view.off(type, handler)
    }
    if (view instanceof ListView) {
      releaseListView(view)
    }
  }
  node.listeners.clear()
}

/**
 * Swap a node's native view for a fresh instance of its (re-registered) class:
 * the new view takes over the node's props, listeners, children and position.
 */
function recreateView(container: NativeScriptContainer, node: HostNode): void {
  const previous = node.view
  if (previous === null) {
    return
  }
  // The node's view may back an active portal target; its registration and
  // handle survive the swap and its portal children move to the replacement.
  let portalTarget
  for (const entry of container.portalTargets.values()) {
    if (entry.view === previous) {
      portalTarget = entry
    }
  }
  const view = instantiate(node.type)
  if (portalTarget !== undefined && !(view instanceof LayoutBase)) {
    // Fail before anything detaches: the previous view keeps the registration
    // and its portal children rather than stranding them on a view that can
    // no longer host them.
    throw new Error(
      `NativeScript driver: re-registered <${node.type}> is a <${view.typeName}>, which cannot host portal children; the registration stays on the previous view.`,
    )
  }
  releaseMasonChildLayout(previous)
  const parentView = hostViewOf(container, node.parent)
  for (const child of node.children) {
    if (child.view !== null) {
      removeViewChild(previous, child.view)
    }
  }
  if (portalTarget !== undefined) {
    for (const child of portalTarget.children) {
      if (child.view !== null) {
        removeViewChild(previous, child.view)
      }
    }
  }
  if (parentView !== null) {
    removeViewChild(parentView, previous)
  }
  for (const [type, handler] of node.listeners) {
    previous.off(type, handler)
  }
  if (previous instanceof ListView) {
    releaseListView(previous)
  }
  viewOwners.set(view, { container, node })
  node.view = view
  node.textApplied = false
  node.propDefaults.clear()
  node.styleDefaults.clear()
  node.styleKeys.clear()
  applyProps(node, node.props)
  for (const [type, handler] of node.listeners) {
    view.on(type, handler)
  }
  let index = 0
  for (const child of node.children) {
    if (child.view !== null) {
      addViewChild(view, child.view, index++)
    }
  }
  // Preserve target identity even while every portal to this view is closed.
  const id = portalTargetIds.get(previous)
  if (id !== undefined) {
    portalTargetIds.set(view, id)
  }
  if (portalTarget !== undefined) {
    // Seat live portal children at the tail of the replacement layout.
    if (!(view instanceof LayoutBase)) {
      throw new TypeError('Portal target replacement must be a layout')
    }
    portalTarget.view = view
    for (const child of portalTarget.children) {
      if (child.view !== null) {
        addViewChild(view, child.view, index++)
      }
    }
  }
  if (MASON_CONTAINER_TAGS.has(node.type)) {
    for (const child of node.children) {
      releaseMasonChildLayout(child.view)
      applyMasonChildLayout(child, node)
    }
  }
  syncText(node)
  markTabView(node)
  attach(container, node)
}

const containers = new Set<NativeScriptContainer>()

onElementReplaced((tag) => {
  for (const container of containers) {
    for (const node of container.nodes.values()) {
      if (node.type === tag) {
        recreateView(container, node)
      }
    }
  }
})

/**
 * A numeric parent is a host node, `null` the root container, and a portal
 * target handle an active registration. Anything else — a stale handle whose
 * registration was released, one minted by another root, or a value that is
 * no parent at all — fails here rather than silently attaching to the root.
 */
function resolveParent(container: NativeScriptContainer, parent: unknown): NativeScriptParent {
  if (parent === null) {
    return null
  }
  if (typeof parent === 'number') {
    return expect(container, parent)
  }
  if (isPortalTarget(parent)) {
    portalTargetOf(container, parent)
    return parent
  }
  throw new Error(
    'NativeScript driver: an insert/move/remove parent must be a host id, null, or an active portal target.',
  )
}

/**
 * Register `target` (a `LayoutBase`) as a native host this root's portals can
 * render into. The runtime calls this for every render that contains a portal,
 * so the handle id derives from the target view itself: re-rendering an
 * unchanged portal mints the same handle, which is how the runtime recognizes
 * the registration as already committed instead of moving the children.
 */
function preparePortalTarget(
  context: UniversalPortalTargetContext<NativeScriptContainer>,
): UniversalPortalTargetRegistration {
  const { container, target: suppliedTarget } = context
  if (!(suppliedTarget instanceof View)) {
    throw new TypeError('NativeScript driver: a portal target must be a NativeScript view.')
  }
  const owner = viewOwners.get(suppliedTarget)
  if (owner !== undefined && owner.container !== container) {
    throw new Error('NativeScript driver: a portal target must not belong to another Octane root.')
  }
  const target = owner?.node.view ?? suppliedTarget
  if (!(target instanceof LayoutBase)) {
    throw new TypeError(
      `NativeScript driver: a <${target.typeName}> view cannot host portal children; target a layout (e.g. rootlayout, masonview).`,
    )
  }
  let id = portalTargetIds.get(target)
  if (id === undefined) {
    id = ++nextPortalTargetId
    portalTargetIds.set(target, id)
  }
  const handle = context.createPortalTargetHandle(`nativescript-view-${id}`)
  let entry = container.portalTargets.get(handle.id)
  if (entry === undefined) {
    entry = { handle, view: target, children: [], refs: 0 }
    container.portalTargets.set(handle.id, entry)
  }
  entry.refs++
  let released = false
  return {
    handle,
    release() {
      if (released) {
        return
      }
      released = true
      if (--entry.refs !== 0) {
        return
      }
      // The runtime removes a portal's children before releasing its
      // registration; any still attached (a batch aborted mid-apply) are
      // detached here so no view is orphaned on the target.
      for (const child of [...entry.children]) {
        detach(container, child)
      }
      container.portalTargets.delete(handle.id)
    },
  }
}

function applyCommand(container: NativeScriptContainer, command: UniversalHostCommand): void {
  switch (command.op) {
    case 'create': {
      container.nodes.set(
        command.id,
        createNode(container, command.id, command.type, command.props),
      )
      return
    }
    case 'recreate': {
      const previous = expect(container, command.id)
      const parent = previous.parent
      const siblings = childrenOf(container, parent)
      const index = siblings.indexOf(previous)
      detach(container, previous)
      disposeListeners(previous)
      const node = createNode(container, command.id, command.type, command.props)
      container.nodes.set(command.id, node)
      if (index === -1) {
        return
      }
      siblings.splice(index, 0, node)
      node.parent = parent
      attach(container, node)
      return
    }
    case 'update': {
      updateProps(expect(container, command.id), command.props)
      return
    }
    case 'insert':
    case 'move': {
      insert(
        container,
        resolveParent(container, command.parent),
        expect(container, command.id),
        command.before,
      )
      return
    }
    case 'remove': {
      detach(container, expect(container, command.id))
      return
    }
    case 'destroy': {
      const node = container.nodes.get(command.id)
      if (node === undefined) {
        return
      }
      disposeListeners(node)
      container.nodes.delete(command.id)
      return
    }
    case 'event': {
      setEvent(container, expect(container, command.id), command.type, command.listener)
      return
    }
    case 'visibility': {
      const view = expect(container, command.id).view
      if (view instanceof View) {
        view.visibility = command.state === 'hidden' ? 'collapse' : 'visible'
      }
      return
    }
    default:
      console.warn(`NativeScript driver: unhandled op ${command.op}.`)
      return
  }
}

export const nativeScriptDriver: UniversalHostDriver<NativeScriptContainer, ViewBase | null> = {
  id: NATIVESCRIPT_RENDERER_ID,
  capabilities: { text: 'host', visibility: true },
  events: {
    classify(name) {
      if (!EVENT_PROP.test(name)) {
        return null
      }
      return { type: eventNameFor(name), priority: 'discrete' }
    },
  },
  portals: { prepareTarget: preparePortalTarget },
  prepareBatch(container, batch) {
    if (batch.renderer !== NATIVESCRIPT_RENDERER_ID) {
      throw new Error(
        `NativeScript driver: batch renderer ${JSON.stringify(batch.renderer)} does not match.`,
      )
    }
    return {
      apply() {
        notifyBatchObservers('willApply', container, batch.commands, applyingDepth)
        applyingDepth++
        pendingTabViews.push(new Set())
        try {
          for (const command of batch.commands) {
            applyCommand(container, command)
          }
        } finally {
          try {
            flushTabViews(pendingTabViews.pop())
          } finally {
            applyingDepth--
          }
        }
        notifyBatchObservers('didApply', container, batch.commands, applyingDepth)
      },
      // Nothing is staged ahead of `apply`, so there is nothing to release.
      abort() {},
    }
  },
  getPublicInstance(container, id) {
    return container.nodes.get(id)?.view ?? null
  },
}

/**
 * Mount an Octane component into an existing NativeScript view.
 *
 * The cast is the one unavoidable seam: the compiler brands renderer-owned
 * components with `defineUniversalComponent`, but TypeScript still sees the
 * authored function signature at the call site.
 */
export function renderNativeScriptApp<P extends object>(
  host: ViewBase,
  component: (props: P) => unknown,
  props: P = {} as P,
): UniversalRoot {
  const root = createNativeScriptRoot(host)
  root.render(component as never, props)
  return root
}

/** A live container: element re-registration recreates its views until `releaseNativeScriptContainer`. */
export function createNativeScriptContainer(host: ViewBase): NativeScriptContainer {
  const container: NativeScriptContainer = {
    host,
    nodes: new Map(),
    children: [],
    portalTargets: new Map(),
    root: null,
  }
  containers.add(container)
  return container
}

export function releaseNativeScriptContainer(container: NativeScriptContainer): void {
  containers.delete(container)
}

/** Mount an Octane tree into an existing NativeScript view. */
export function createNativeScriptRoot(host: ViewBase): UniversalRoot {
  const container = createNativeScriptContainer(host)
  const root = createUniversalRoot(container, nativeScriptDriver, {
    scheduleMicrotask: (callback) => {
      Promise.resolve().then(callback)
    },
  })
  container.root = root
  const unmount = root.unmount.bind(root)
  root.unmount = () => {
    releaseNativeScriptContainer(container)
    return unmount()
  }
  return root
}
