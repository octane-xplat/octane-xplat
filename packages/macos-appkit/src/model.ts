import type { NSView, NSGestureRecognizer } from '@octane-xplat/platform/macos'
import type { UniversalRoot, UniversalPortalTargetHandle } from 'octane/universal/native'
import type { ElementAdapter } from './element-adapter'
import type { TextLinkRun } from './formatted-text'

/** Props arrive from compiled elements as open-ended bags; each leaf
 *  factory or applier reads only the keys it understands. */
export type PropBag = Record<string, any>

/** The payload `onPan` listeners receive from `ButtonActionTarget.viewPanned`. */
export interface PanEvent {
  x: number
  y: number
  deltaX: number
  deltaY: number
  velocityX: number
  velocityY: number
  state: number
  view: NSView
}

/** The AppKit object a node owns. `view` is null for `#text` and `span`
 *  nodes, whose content folds into the parent's attributed string. Members
 *  beyond NSView resolve loosely — each node-type code path knows the
 *  concrete AppKit class its factory created. */
export type AppKitView = NSView & { [key: string]: any }

/** A retained element in the AppKit tree. */
export interface ElementNode {
  id: number
  type: string
  /** Absent only for compiler-owned root records, which have separate ownership. */
  lifecycle?: 'constructing' | 'live' | 'disposing' | 'disposed'
  /** Acquired once; never resolve live phases through a newer registration. */
  readonly adapter?: ElementAdapter
  view: AppKitView | null
  projectedChildren?: ElementNode[]
  layoutParent?: ElementNode | null
  contentChild?: ElementNode | null
  childHost?: AppKitView
  datePickerDefault?: Date
  datePickerValue?: Date
  datePickerInputs?: PropBag
  timePickerDefault?: Date
  timePickerValue?: Date
  timePickerInputs?: PropBag
  timePickerBounds?: [number, number]
  props: PropBag
  parent: ElementNode | null
  children: ElementNode[]
  container: RootContainer
  appliedFontFamily: string | undefined
  actionId?: number
  clickGestureRecognizer?: NSGestureRecognizer
  /** Character-range activation table folded out of span handlers, and the
   *  click recognizer that hit-tests taps against it (labels only). */
  textLinks?: TextLinkRun[]
  linkClickRecognizer?: NSGestureRecognizer
  scrollObserverInstalled: boolean
  text: string
  // CSS adapter: cssType/cssClasses/cssPseudoClasses/computedStyle/
  // computedCustomProps/getChildIndex/getChildAt/getChildrenCount.
  // Per-kind extras: placeholderView, placeholderContent, placeholderCreated,
  // sizeConstraints, placementPins, styleBg,
  // layoutObserver, scrollObserver, scheme, textRuns, appliedStyle,
  // styleFont*/propFontSize, stylePaddingBox/Edges, styleVisibility,
  // Paint resources live in the box-paint coordinator, not this extension bag.
  [key: string]: any
}

/** Options published through `__xplatAppKit.showAnchoredPopup` (Tooltip/Hoverable). */
export interface PopupOptions {
  anchor?: NSView
  at?: { x: number; y: number }
  component?: any
  placement?: string
  [key: string]: any
}

export interface ContextMenuItem {
  id?: string
  title?: string
  disabled?: boolean
  divider?: boolean
}

/** Options published through `__xplatAppKit.attachContextMenu`. */
export interface ContextMenuOptions {
  items?: readonly ContextMenuItem[]
  [key: string]: any
}

/** Per-root state shared by the driver commands. */
export interface RootContainer {
  hostView: NSView
  fontFamily: string | undefined
  nodes: Map<number, ElementNode>
  children: ElementNode[]
  root: UniversalRoot | null
  portalTargetIds: WeakMap<object, number>
  portalTargets: Map<UniversalPortalTargetHandle, PortalTargetEntry>
  nextPortalTargetId: number
  /** Native root projection for top-level viewless containers. */
  projectionRoot?: ElementNode
  /** Parents needing a sibling-wide layout pass; non-null only while a
   *  command batch is applying. */
  layoutDirty: Set<ElementNode> | null
  /** Nodes needing a cascade recompute; flushed before layout reconcile. */
  cssDirty?: Set<ElementNode>
  cssFlushQueued?: boolean
  /** Focused node followed by its :focus-within ancestors — diffed per
   *  window update so moved focus clears the whole old chain. */
  cssFocusChain?: ElementNode[]
  cssFocusVisible?: boolean
  tabDirty?: Set<ElementNode>
  tabReleases?: Set<ElementNode>
  /** Last media environment observed per window this container paints into
   *  (host window + portal targets) — resize diffs against it per window. */
  mediaEnvs?: Map<object, { width: number; height: number }>
}

export interface PortalTargetEntry {
  root: ElementNode
  registrations: number
}
