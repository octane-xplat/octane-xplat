/** Mason layout engine bridge — drives libxplatmason.dylib (the XPLMason
 *  ObjC facade statically linked with octane-xplat/nativescript-mason's
 *  mason-c crate) for `masonview` subtrees. Elements keep their own
 *  AppKit views; mason only computes frames, which index.ts applies as
 *  leading/top/width/height pins — the same channel every other manual
 *  layout uses.
 *
 *  Bridge notes: this runtime exposes only typegen'd SDK members, so the
 *  shim publishes a host instance via the main thread's threadDictionary at
 *  +load and JS drives it through performSelectorWithObjectWithObject — the
 *  one dynamic-dispatch path the bridge supports. Node pointers cross as
 *  NSValue. The dylib ships prebuilt in this package; the CLI bootstrap
 *  loads it before app JS (xplat dev and xplat build both do), so this
 *  module only reads the published host. */

import {
	NativeClass,
	NSNotificationCenter,
	NSThread,
	NSUserInterfaceLayoutOrientation,
	NSView,
	NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

// Element nodes carry open-ended fields; the bridge only needs the shape
// below. Loose `any` matches the renderer's PropBag style.
type NodeLike = any
type ViewFor = (node: any) => any

let host: any = null
let initFailed = false

function masonHost(): any {
	if (host || initFailed) {
		return host
	}

	host = NSThread.mainThread.threadDictionary.objectForKey('xplatMasonHost')
	if (!host) {
		console.warn(
			'[macos-mason] libxplatmason.dylib is not loaded — masonview lays out nothing. Launch through xplat dev or xplat build, which load the engine shipped in @octane-xplat/macos-renderer.',
		)
		initFailed = true
		return null
	}

	// AppKit frames, measurements, and numeric lengths use points. Mason's
	// CSS track parser applies this scale to px/dip strings, so using the
	// screen's backing scale would enlarge only grid tracks on Retina hosts.
	invoke('scale', [1])
	return host
}

/** Every engine call funnels through the shim's -invoke:args: entry point —
 *  performSelectorWithObjectWithObject reaches real ObjC dispatch even
 *  though the bridge's member table doesn't know our selectors. */
function invoke(op: string, args: any[] = []): any {
	if ((process as any).env?.XPLAT_MASON_DEBUG) {
		console.log('[mason]', op, String(args[0]?.description ?? args[0] ?? ''))
	}
	return host.performSelectorWithObjectWithObject('invoke:args:', op, args)
}

export function masonAvailable(): boolean {
	return masonHost() != null
}

/** Numeric styles arrive as points; "N%" strings become fractions. Returns
 *  the auto-typed [type, value] pair mason-c expects. */
function autoDim(value: any): [number, number] | undefined {
	if (value == null || value === 'auto') {
		return undefined
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? [1, value] : undefined
	}

	if (typeof value === 'string') {
		const text = value.trim()
		const percent = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%$/)
		if (percent) {
			return [2, Number(percent[1]) / 100]
		}

		const points = Number(text.replace(/px$/, ''))
		return Number.isFinite(points) ? [1, points] : undefined
	}

	return undefined
}

/** Length/percent dimension for padding, border and gap — 0 length,
 *  1 percent. */
function lenDim(value: any): [number, number] | undefined {
	const dim = autoDim(value)
	if (!dim) {
		return undefined
	}

	return dim[0] === 2 ? [1, dim[1]] : dim[0] === 1 ? [0, dim[1]] : undefined
}

function specDim(spec: { kind: string; points?: number; multiplier?: number } | undefined) {
	if (!spec) {
		return undefined
	}

	if (spec.kind === 'percent') {
		return [2, spec.multiplier ?? 0]
	}

	return [1, spec.points ?? 0]
}

const ENUM_STYLE_KEYS = new Set([
	'display',
	'position',
	'direction',
	'flexDirection',
	'flexWrap',
	'overflow',
	'overflowX',
	'overflowY',
	'alignItems',
	'alignSelf',
	'alignContent',
	'justifyItems',
	'justifySelf',
	'justifyContent',
	'textAlign',
	'boxSizing',
	'gridAutoFlow',
])

const DIM_AUTO_KEYS: [string, string][] = [
	['width', 'width'],
	['height', 'height'],
	['minWidth', 'minWidth'],
	['minHeight', 'minHeight'],
	['maxWidth', 'maxWidth'],
	['maxHeight', 'maxHeight'],
	['flexBasis', 'flexBasis'],
]

const DIM_EDGES = [
	['top', 'top'],
	['left', 'left'],
	['right', 'right'],
	['bottom', 'bottom'],
]

const NUMBER_STYLE_KEYS = new Set([
	'flexGrow',
	'flexShrink',
	'aspectRatio',
	'scrollbarWidth',
])

const GRID_STYLE_KEYS = new Set([
	'gridAutoRows',
	'gridAutoColumns',
	'gridColumn',
	'gridColumnStart',
	'gridColumnEnd',
	'gridRow',
	'gridRowStart',
	'gridRowEnd',
	'gridTemplateRows',
	'gridTemplateColumns',
	'gridArea',
	'gridTemplateAreas',
])

/** Style keys mason consumes from props.style inside a masonview subtree —
 *  the renderer's applyStyle must not warn on them for masonview nodes or
 *  their direct children. */
export const MASON_STYLE_KEYS = new Set([
	...ENUM_STYLE_KEYS,
	...GRID_STYLE_KEYS,
	...NUMBER_STYLE_KEYS,
	...DIM_AUTO_KEYS.map(([key]) => key),
	'gap',
	'rowGap',
	'columnGap',
	'top',
	'left',
	'right',
	'bottom',
])

/** Intrinsic types laid out by the Mason engine — masonview is the single
 *  layout container (scrollview keeps an NSScrollView chrome but mason-lays
 *  its document view; liquidglass is a grid-backed glass surface).
 *  Foreign-forever chrome: rootlayout, contentview, actionbar, page/frame,
 *  lists, tabview, overlays. */
const MASON_CONTAINERS = new Set(['masonview', 'liquidglass', 'scrollview'])

function edgeBox(value: any): { top: number; left: number; bottom: number; right: number } | null {
	if (value == null) {
		return null
	}

	if (typeof value === 'number' || !isNaN(Number(value))) {
		const n = Number(value)
		return { top: n, left: n, bottom: n, right: n }
	}

	const parts = String(value)
		.split(/\s+/)
		.map((part) => parseFloat(part) || 0)
	const top = parts[0] ?? 0
	const right = parts.length > 1 ? parts[1] : top
	const bottom = parts.length > 2 ? parts[2] : top
	const left = parts.length > 3 ? parts[3] : right
	return { top, left, bottom, right }
}

/** Translates a node's resolved style state into the XPLMason style
 *  dictionary. `style` carries authored CSS-ish props; container layout props
 *  (orientation, rows/columns, dock, grid row/col) fold in as prop-level
 *  defaults; the renderer's parsed fields (sizeConstraintSpecs, marginInsets,
 *  dockInsets, class*) layer underneath. */
function styleDict(node: NodeLike): Record<string, any> {
	const props = node.props ?? {}
	const style = node.computedStyle ?? props.style ?? {}
	const out: Record<string, any> = {}

	for (const key of ENUM_STYLE_KEYS) {
		const value = style[key]
		if (typeof value === 'string') {
			out[key] = value
		}
	}

	if (node.classOrientation != null) {
		// NSUserInterfaceLayoutOrientation: 0 horizontal, 1 vertical.
		out.flexDirection = node.classOrientation === 0 ? 'row' : 'column'
	}

	if (typeof style.flexDirection === 'string') {
		out.flexDirection = style.flexDirection
	}

	for (const [from, to] of DIM_AUTO_KEYS) {
		// width/height/min*/max* stay legit view props; flexBasis is style-only.
		const value = from === 'flexBasis' ? style[from] : (style[from] ?? props[from])
		out[to] = autoDim(value) ?? specDim(node.sizeConstraintSpecs?.[to])
	}

	for (const [from, to] of DIM_EDGES) {
		const dim = autoDim(style[from])
		if (dim) {
			;(out.inset ??= {})[to] = dim
		}
	}

	const margins = node.marginInsets ?? edgeBox(style.margin)
	if (margins) {
		// dimension-with-auto slots: type 1 length (type 0 would be auto —
		// auto margins center children and swallow free space).
		out.margin = {
			left: [1, margins.left ?? 0],
			right: [1, margins.right ?? 0],
			top: [1, margins.top ?? 0],
			bottom: [1, margins.bottom ?? 0],
		}
	}

	const padding = node.dockInsets ?? node.classInsets ?? edgeBox(style.padding)
	if (padding) {
		out.padding = {
			left: [0, padding.left ?? 0],
			right: [0, padding.right ?? 0],
			top: [0, padding.top ?? 0],
			bottom: [0, padding.bottom ?? 0],
		}
	}

	const gap = lenDim(style.gap) ?? lenDim(props.spacing)
	const rowGap = lenDim(style.rowGap) ?? gap
	const columnGap = lenDim(style.columnGap) ?? gap
	const classGap = node.classSpacing != null ? ([0, node.classSpacing] as [number, number]) : null
	if (classGap) {
		out.gapRow = out.gapColumn = classGap
	}

	if (rowGap) {
		out.gapRow = rowGap
	}

	if (columnGap) {
		out.gapColumn = columnGap
	}

	for (const key of NUMBER_STYLE_KEYS) {
		const value = style[key]
		if (typeof value === 'number') {
			out[key] = value
		}
	}

	if (typeof props.flexBasisPercent === 'number') {
		out.flexBasis = [2, props.flexBasisPercent]
	}

	for (const key of GRID_STYLE_KEYS) {
		const value = style[key]
		if (typeof value === 'string') {
			out[key] = value
		}
	}

	// Container roots are positioned — otherwise absolute children escape to
	// the nearest ancestor with a non-static position and mis-resolve.
	if (MASON_CONTAINERS.has(node.type)) {
		out.position ??= 'relative'
	}

	// Container-role defaults — only the chrome intrinsics carry non-CSS
	// props; masonview itself takes everything from CSS-shaped props/style.
	switch (node.type) {
		case 'liquidglass':
			out.display ??= 'grid'
			break
		case 'scrollview': {
			out.display ??= 'flex'
			const horizontal = props.orientation === 'horizontal' || props.horizontal === true
			out.flexDirection ??= horizontal ? 'row' : 'column'
			break
		}
	}

	return out
}

function syncMasonNode(node: NodeLike, layoutView: ViewFor) {
	if (!masonHost()) {
		return null
	}

	if (!node.masonNode) {
		// Leaf nodes get a live measure callback — the shim retains the AppKit
		// view and reads intrinsic/fitting size on every engine pass.
		node.masonNode = MASON_CONTAINERS.has(node.type)
			? invoke('node')
			: invoke('mnode', [layoutView(node)])
		if (!node.masonNode) {
			return null
		}
		// Leaf nodes outlive their container's destroy path — free the engine
		// handle through the renderer's per-node teardown hooks.
		;(node.destroyHooks ??= []).push(() => {
			if (node.masonNode) {
				invoke('free', [node.masonNode])
				node.masonNode = undefined
			}
		})
	}

	const dict = styleDict(node)
	if ((globalThis as any).__masonTrace) {
		// Probe/debug channel: set globalThis.__masonTrace=[] in a case to
		// collect every synced style dict + flat record stream.
		;(globalThis as any).__masonStyle ??= []
		;(globalThis as any).__masonStyle.push({ type: node.type, id: node.props?.id, dict })
	}
	if ((process as any).env?.XPLAT_MASON_DEBUG) {
		console.log('[mason] styledict', node.type, JSON.stringify(dict), 'classSpacing=' + node.classSpacing, 'classInsets=' + JSON.stringify(node.classInsets), 'dockInsets=' + JSON.stringify(node.dockInsets), 'marginInsets=' + JSON.stringify(node.marginInsets), 'className=' + node.props?.className)
	}
	invoke('style', [node.masonNode, dict])
	return node.masonNode
}

/** Rebuilds the mason subtree mirroring `parent`'s children — mason-backed
 *  container descendants recurse as container nodes; every other child is a
 *  measured leaf re-measured by the engine on each pass. */
function syncMasonTree(parent: NodeLike, layoutView: ViewFor) {
	const root = syncMasonNode(parent, layoutView)
	if (!root) {
		return null
	}

	const children = (parent.projectedChildren ?? parent.children).filter(
		(child: NodeLike) => child.view,
	)
	const nodes: any[] = []
	const nextOrder: NodeLike[] = []

	for (const child of children) {
		const handle = MASON_CONTAINERS.has(child.type)
			? syncMasonTree(child, layoutView)
			: syncMasonNode(child, layoutView)

		if (!handle) {
			continue
		}

		// Re-measure leaves every pass — text/content may have changed since
		// the last compute.
		if (!MASON_CONTAINERS.has(child.type)) {
			invoke('dirty', [handle])
		}

		nodes.push(handle)
		nextOrder.push(child)
	}

	const changed =
		!parent.masonChildren ||
		parent.masonChildren.length !== nextOrder.length ||
		parent.masonChildren.some((child: NodeLike, index: number) => child !== nextOrder[index])

	if (changed) {
		invoke('children', [root, nodes])
		parent.masonChildren = nextOrder
	}

	return root
}

const RECORD = 22

function recordAt(flat: any, offset: number): [number, number, number, number, number] {
	return [
		Number(flat.objectAtIndex(offset + 1)) || 0,
		Number(flat.objectAtIndex(offset + 2)) || 0,
		Number(flat.objectAtIndex(offset + 3)) || 0,
		Number(flat.objectAtIndex(offset + 4)) || 0,
		Number(flat.objectAtIndex(offset + 21)) || 0,
	]
}

/** The view a mason-backed parent's children pin into — the scrollview's
 *  document view rather than the NSScrollView chrome. */
function pinHost(node: NodeLike): any {
	return node.childHost ?? node.view
}

/** Walks one level of the flat preorder output: pins each child into
 *  `parentView`, then recurses into mason-backed container children so their
 *  records (written right after in DFS order) position *their* children. */
function applyRecords(
	flat: any,
	offset: number,
	children: NodeLike[],
	parentView: any,
	pin: (
		child: NodeLike,
		parentView: any,
		x: number,
		top: number,
		width: number,
		height: number,
	) => void,
): number {
	let next = offset
	for (const child of children) {
		const [x, y, w, h, childCount] = recordAt(flat, next)
		// pin's `top` is a topAnchor offset — mason's y is already
		// top-origin, so it passes through unchanged.
		if ((process as any).env?.XPLAT_MASON_DEBUG) {
			console.log('[mason] pin', child.type, x, y, w, h)
		}
		pin(child, parentView, x, y, w, h)
		next += RECORD
		if (MASON_CONTAINERS.has(child.type) && child.masonChildren?.length) {
			next = applyRecords(flat, next, child.masonChildren, pinHost(child), pin)
		} else {
			for (let i = 0; i < childCount; i++) {
				next = skipSubtree(flat, next)
			}
		}
	}

	return next
}

/** Advances past the record at `offset` plus its descendant records. */
function skipSubtree(flat: any, offset: number): number {
	const count = Number(flat.objectAtIndex(offset + 21)) || 0
	let next = offset + RECORD
	for (let i = 0; i < count; i++) {
		next = skipSubtree(flat, next)
	}

	return next
}

export function layoutMasonChildren(
	parent: NodeLike | undefined,
	layoutView: ViewFor,
	pin: (
		child: NodeLike,
		parentView: any,
		x: number,
		top: number,
		width: number,
		height: number,
	) => void,
) {
	const target = parent?.childHost ?? parent?.view
	if (!parent?.view || !target || !masonHost()) {
		return
	}

	const root = syncMasonTree(parent, layoutView)
	if (!root) {
		return
	}

	const width = Number(target.bounds?.size?.width) || 0
	const height = Number(target.bounds?.size?.height) || 0
	const isScroll = parent.type === 'scrollview'
	const horizontal =
		parent.props?.orientation === 'horizontal' || parent.props?.horizontal === true

	if (isScroll) {
		// The node's own authored dims size the NSScrollView chrome in its
		// parent — they must not cap the content compute, or flex children
		// shrink to the clip height instead of overflowing into scroll range.
		const dict = styleDict(parent)
		delete dict.width
		delete dict.height
		delete dict.minHeight
		delete dict.maxHeight
		delete dict.minWidth
		delete dict.maxWidth
		invoke('style', [root, dict])
		// Free the scroll axis — -2 is mason's max-content sentinel; the
		// pinned axis stays at the clip view's size.
		invoke('compute', [root, horizontal ? -2 : width, horizontal ? height : -2])
	} else {
		// Container roots are sized by their parent's layout; give the root
		// node explicit dims so it doesn't shrink-wrap to content.
		const style = parent.computedStyle ?? parent.props?.style ?? {}
		if (style.width == null || style.height == null) {
			const dict = styleDict(parent)
			if (style.width == null && !parent.sizeConstraintSpecs?.width) {
				dict.width = [1, width]
			}
			if (style.height == null && !parent.sizeConstraintSpecs?.height) {
				dict.height = [1, height]
			}
			invoke('style', [root, dict])
		}

		invoke('compute', [root, width, height])
	}

	const flat = invoke('layout', [root])
	const count = Number(flat?.count ?? 0)
	if (count < RECORD) {
		return
	}

	if ((process as any).env?.XPLAT_MASON_DEBUG || (globalThis as any).__masonTrace) {
		const recs: string[] = []
		for (let off = 0; off + RECORD <= count; off += RECORD) {
			const r: number[] = []
			for (let i = 0; i < RECORD; i++) {
				r.push(Number(flat.objectAtIndex(off + i)))
			}
			recs.push(r.map((v) => Math.round(v * 10) / 10).join(','))
		}
		;(globalThis as any).__masonTrace?.push?.({
			root: parent.type + ':' + (parent.props?.id ?? ''),
			children: (parent.masonChildren ?? []).map((c: NodeLike) => c.type + ':' + (c.props?.id ?? '')),
			records: recs,
		})
		console.log('[mason] records', recs.join(' | '))
	}

	if (isScroll) {
		// The root record is the content size — express it as a minimum-size
		// constraint on the document view so it coexists with the renderer's
		// clip-axis pins (configureScrollAxes) instead of fighting them.
		const contentW = Number(flat.objectAtIndex(3)) || 0
		const contentH = Number(flat.objectAtIndex(4)) || 0
		const pins = (parent.masonScrollPins ??= {
			width: target.widthAnchor.constraintGreaterThanOrEqualToConstant(0),
			height: target.heightAnchor.constraintGreaterThanOrEqualToConstant(0),
		})
		pins.width.constant = contentW
		pins.height.constant = contentH
		if (!pins.width.active) {
			pins.width.active = true
			pins.height.active = true
		}
	}

	applyRecords(flat, RECORD, parent.masonChildren ?? [], target, pin)
}

/** Natural size for intrinsicContentSize — runs a max-content compute and
 *  returns the root's size. */
export function masonNaturalSize(
	node: NodeLike | undefined,
	layoutView: ViewFor,
): { width: number; height: number } | null {
	if (!node || !masonHost()) {
		return null
	}

	const root = syncMasonTree(node, layoutView)
	if (!root) {
		return null
	}

	const size = invoke('natural', [root])
	return { width: Number(size?.objectAtIndex(0)) || 0, height: Number(size?.objectAtIndex(1)) || 0 }
}

/** Frees the engine-side nodes under `node` — call from the renderer's
 *  remove/destroy paths. */
export function releaseMasonNodes(node: NodeLike) {
	if (!host) {
		return
	}

	for (const child of node.children ?? []) {
		releaseMasonNodes(child)
	}

	if (node.masonNode) {
		invoke('free', [node.masonNode])
		node.masonNode = undefined
	}

	node.masonChildren = undefined
}

// ---------------------------------------------------------------------------
// Element seam — `masonview` self-registers via the renderer's behavior
// registry rather than hard-coded cases in index.ts.
// ---------------------------------------------------------------------------

interface MasonDeps {
	registerElementType: (type: string, behavior: ElementBehavior) => void
	layoutView: (node: any) => any
	pinLayoutChild: (
		child: any,
		parentView: any,
		x: number,
		top: number,
		width: number,
		height: number,
	) => void
	queueLayoutReconcile: (container: any, parent: any) => void
	detach: (container: any, node: any) => void
	applyStyle: (node: any, value: any) => void
	applyClassName: (node: any, value: any) => void
	applyAccessibility: (node: any, name: string, value: any) => void
	/** Wires tap/click handlers + accessibility actionId onto a view. */
	wireAction: (view: any, props: any) => number | undefined
	/** Tap-action update; undefined clears the binding. */
	setAction: (node: any, value: any) => void
	/** Pan/swipe recognizer update; undefined clears the binding. */
	setPanAction: (node: any, value: any) => void
	/** NSScrollView chrome around a mason document view, owned by `node`. */
	makeScrollView: (node: any) => { view: any; childHost: any }
	/** NSView subclass carrying the shared AX/action surface — container
	 *  hosts extend it so a tappable stack/grid keeps AX press + roles. */
	baseView: any
}

// Structural twin of index.ts's ElementBehavior — declared locally so this
// module doesn't import the renderer for a type it registers into.
interface ElementBehavior {
	make?: (node: any, props: any) => void
	applyProp?: (node: any, name: string, value: any) => boolean
	layout?: (parent: any) => void
	destroy?: (node: any) => void
	container?: boolean
	containerStyles?: boolean
	styleKeys?: ReadonlySet<string>
}

const masonLayoutNodesByView = new WeakMap<object, any>()
const activeNativeLayouts = new WeakSet<object>()
let deps: MasonDeps | null = null

// Mason-backed host: the Rust engine computes descendant frames; children
// keep their own AppKit views and are pinned like grid/absolute children.
// Nested masonview nodes participate in the parent's compute. The class is
// created in installMasonElement so it can extend the renderer's accessible
// host view (AX press/role + input-transparency hit-testing).
let MasonLayoutView: any

function createMasonLayoutView() {
	return class MasonLayoutView extends (deps!.baseView ?? NSView) {
		static {
			NativeClass(this)
		}
		// @ts-ignore ObjC accessor methods satisfy the generated @property member.
		get intrinsicContentSize() {
			const size = masonNaturalSize(masonLayoutNodesByView.get(this), deps!.layoutView)
			return size ?? { width: -1, height: -1 }
		}

		layout() {
			// A live AppKit window can reenter this view while its native base
			// layout is still running. The outer pass owns descendant layout.
			if (activeNativeLayouts.has(this)) {
				return
			}
			activeNativeLayouts.add(this)
			try {
				super.layout()
				layoutMasonChildren(
					masonLayoutNodesByView.get(this),
					deps!.layoutView,
					deps!.pinLayoutChild,
				)
			} finally {
				activeNativeLayouts.delete(this)
			}
		}
	}
}

function makeMasonLayout(node: any) {
	const view = MasonLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	// Mason owns compression and wrapping. A max-content intrinsic width
	// must not become an AppKit window's minimum width.
	view.setContentCompressionResistancePriorityForOrientation(
		1,
		NSUserInterfaceLayoutOrientation.Horizontal,
	)
	masonLayoutNodesByView.set(view, node)
	view.postsFrameChangedNotifications = true
	node.masonGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (masonLayoutNodesByView.get(view) === node) {
					// Geometry is a layout input, not a content mutation. Invalidating
					// intrinsic size here feeds AppKit's constraint solve back into
					// itself, which can repeatedly grow a window around native leaves.
					layoutMasonChildren(node, deps!.layoutView, deps!.pinLayoutChild)
				}
			},
		)

	return view
}

/** Props that still legitimately re-run the container's layout pass — view
 *  sizing plus legacy chrome names. Every layout/style key lives in `style`
 *  now (see MASON_STYLE_ONLY_KEYS). */
const MASON_LAYOUT_PROPS = new Set([
	'width',
	'height',
	'minWidth',
	'minHeight',
	'maxWidth',
	'maxHeight',
	// 'orientation' stays out — the builtin scrollview case owns it
	// (configureScrollAxes); styleDict re-reads it for flexDirection.
	'spacing',
	'flexBasisPercent',
])

/** Former prop names that must now arrive through `style`/`className` — as
 *  direct props they would land on a dead field, so the behavior warns once
 *  per key and consumes the write. */
const MASON_STYLE_ONLY_KEYS = new Set<string>([
	...MASON_STYLE_KEYS,
	'inset',
	// The pre-cutover prop vocabulary — contract props and sugar alike.
	'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent',
	'gap', 'rowGap', 'columnGap', 'flexGrow', 'flexShrink', 'alignSelf', 'order',
	'row', 'col', 'rowSpan', 'colSpan', 'dock', 'horizontalAlignment',
	'verticalAlignment', 'flexWrapBefore', 'stretchLastChild', 'itemWidth',
	'itemHeight', 'rows', 'columns',
])
for (const key of MASON_LAYOUT_PROPS) {
	MASON_STYLE_ONLY_KEYS.delete(key)
}
const warnedStyleOnlyProps = new Set<string>()

/** Exported so index.ts's scrollview factory can give the document view a
 *  mason host (children pin into it; the NSScrollView chrome stays). The
 *  document view stays constraint-driven — configureScrollAxes' clip pins
 *  and the engine's content-size minimum size it together. */
export function makeMasonHostView(node: any): any {
	return makeMasonLayout(node)
}

/** Called once by the renderer at module init — registers `masonview` plus
 *  every container intrinsic so Mason is the layout engine on this target,
 *  and captures the renderer helpers the behaviors need. */
export function installMasonElement(next: MasonDeps) {
	deps = next
	MasonLayoutView ??= createMasonLayoutView()

	const behavior: ElementBehavior = {
		container: true,
		containerStyles: true,
		styleKeys: MASON_STYLE_KEYS,
		make(node, props) {
			node.view = makeMasonLayout(node)
			node.actionId = next.wireAction(node.view, props)
		},
		applyProp(node, name, value) {
			if (name === 'style') {
				next.applyStyle(node, value)
				return true
			}
			if (name === 'className') {
				next.applyClassName(node, value)
				return true
			}
			if (name === 'accessible' || name.startsWith('accessibility')) {
				next.applyAccessibility(node, name, value)
				return true
			}
			// Gesture/action props dispatch like the old container cases —
			// the gesture recognizers above run before this for
			// onTouch/onLongPress/onDoubleTap/onSwipe/disabled.
			if (name === 'onTap' || name === 'onClick' || name === 'onPress') {
				const handler = node.props.onTap ?? node.props.onClick ?? node.props.onPress
				next.setAction(
					node,
					typeof handler === 'function'
						? () => handler({ eventName: 'tap', object: node.view })
						: value,
				)
				return true
			}
			if (name === 'onPan') {
				next.setPanAction(node, value)
				return true
			}
			if (MASON_LAYOUT_PROPS.has(name)) {
				next.queueLayoutReconcile(node.container, node)
				return true
			}
			if (MASON_STYLE_ONLY_KEYS.has(name)) {
				const key = `${node.type}:${name}`
				if (!warnedStyleOnlyProps.has(key)) {
					warnedStyleOnlyProps.add(key)
					console.warn(`[macos-xplat] <${node.type} ${name}=...> is a Mason style key — move it into style={{${name}: ...}} or a class.`)
				}
				return true
			}
			return name === 'id' || value === undefined
		},
		layout(parent) {
			layoutMasonChildren(parent, next.layoutView, next.pinLayoutChild)
		},
		destroy(node) {
			if (node.masonGeometryObserver) {
				NSNotificationCenter.defaultCenter.removeObserver(node.masonGeometryObserver)
				node.masonGeometryObserver = null
			}
			if (node.view) {
				masonLayoutNodesByView.delete(node.view)
			}
			if (node.childHost) {
				masonLayoutNodesByView.delete(node.childHost)
			}
			releaseMasonNodes(node)
			for (const child of node.children.slice()) {
				next.detach(node.container, child)
			}
		},
	}

	for (const type of MASON_CONTAINERS) {
		if (type === 'scrollview') {
			next.registerElementType(type, {
				...behavior,
				make(node) {
					const scroll = next.makeScrollView(node)
					node.view = scroll.view
					node.childHost = scroll.childHost
				},
			})
		} else if (type === 'liquidglass') {
			// Keep the glass host factory (backdrop + blur observers); mason
			// owns the child geometry only.
			const { make, ...rest } = behavior
			next.registerElementType(type, rest)
		} else {
			next.registerElementType(type, behavior)
		}
	}
}
