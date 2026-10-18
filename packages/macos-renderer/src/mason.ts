/** Mason layout engine bridge — dlopen's libxplatmason.dylib (the XPLMason
 *  ObjC facade statically linked with triniwiz/nativescript-mason's mason-c
 *  crate) and drives it for `masonview` subtrees. Elements keep their own
 *  AppKit views; mason only computes frames, which index.ts applies as
 *  leading/top/width/height pins — the same channel every other manual
 *  layout uses.
 *
 *  Bridge notes: this runtime exposes only typegen'd SDK members, so the
 *  shim publishes a host instance via the main thread's threadDictionary at
 *  +load and JS drives it through performSelectorWithObjectWithObject — the
 *  one dynamic-dispatch path the bridge supports. Node pointers cross as
 *  NSValue. Resolve the dylib via the XPLAT_MASON_LIB env var or the
 *  package-native default path; absent the library, masonview children keep
 *  authored geometry only. */

import {
	NativeClass,
	NSFileManager,
	NSNotificationCenter,
	NSScreen,
	NSThread,
	NSView,
	NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

// Element nodes carry open-ended fields; the bridge only needs the shape
// below. Loose `any` matches the renderer's PropBag style.
type NodeLike = any
type ViewFor = (node: any) => any

let host: any = null
let initFailed = false

function libraryPath(): string | undefined {
	const env = typeof process !== 'undefined' ? (process as any).env?.XPLAT_MASON_LIB : undefined
	if (env) {
		return env
	}

	const cwd = (process as any).cwd()
	const candidates = [
		cwd + '/packages/macos-renderer/native/xplatmason/libxplatmason.dylib',
		cwd + '/native/xplatmason/libxplatmason.dylib',
	]

	const fm = NSFileManager.defaultManager
	return candidates.find((p) => fm.fileExistsAtPath(p))
}

function masonHost(): any {
	if (host || initFailed) {
		return host
	}

	const path = libraryPath()
	if (!path || !dlopen(path, 2)) {
		console.warn('[macos-mason] libxplatmason.dylib not found — masonview lays out nothing')
		initFailed = true
		return null
	}

	host = NSThread.mainThread.threadDictionary.objectForKey('xplatMasonHost')
	if (!host) {
		console.warn('[macos-mason] libxplatmason.dylib loaded but no xplatMasonHost was published')
		initFailed = true
		return null
	}

	invoke('scale', [Number(NSScreen.mainScreen?.backingScaleFactor) || 1])
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
 *  dictionary. `style` carries authored CSS-ish props; the renderer's parsed
 *  fields (sizeConstraintSpecs, marginInsets, dockInsets, class*) layer
 *  underneath. */
function styleDict(node: NodeLike): Record<string, any> {
	const style = node.props?.style ?? {}
	const out: Record<string, any> = {}

	for (const key of ENUM_STYLE_KEYS) {
		if (typeof style[key] === 'string') {
			out[key] = style[key]
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
		out[to] = autoDim(style[from]) ?? specDim(node.sizeConstraintSpecs?.[to])
	}

	for (const [from, to] of DIM_EDGES) {
		const dim = autoDim(style[from])
		if (dim) {
			;(out.inset ??= {})[to] = dim
		}
	}

	const margins = node.marginInsets ?? edgeBox(style.margin)
	if (margins) {
		out.margin = {
			left: [0, margins.left ?? 0],
			right: [0, margins.right ?? 0],
			top: [0, margins.top ?? 0],
			bottom: [0, margins.bottom ?? 0],
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

	const gap = lenDim(style.gap)
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
		if (typeof style[key] === 'number') {
			out[key] = style[key]
		}
	}

	for (const key of GRID_STYLE_KEYS) {
		if (typeof style[key] === 'string') {
			out[key] = style[key]
		}
	}

	return out
}

function intrinsicSize(view: any): [number, number] {
	const intrinsic = view?.intrinsicContentSize
	const fitting = view?.fittingSize
	const width =
		Number(intrinsic?.width) >= 0 ? Number(intrinsic.width) : Number(fitting?.width) || 0
	const height =
		Number(intrinsic?.height) >= 0 ? Number(intrinsic.height) : Number(fitting?.height) || 0
	return [Math.max(0, width), Math.max(0, height)]
}

function syncMasonNode(node: NodeLike) {
	if (!masonHost()) {
		return null
	}

	if (!node.masonNode) {
		node.masonNode = invoke('node')
		if (!node.masonNode) {
			return null
		}
		// Leaf nodes outlive their masonview destroy path — free the engine
		// handle through the renderer's per-node teardown hooks.
		;(node.destroyHooks ??= []).push(() => {
			if (node.masonNode) {
				invoke('free', [node.masonNode])
				node.masonNode = undefined
			}
		})
	}

	const dict = styleDict(node)
	if ((process as any).env?.XPLAT_MASON_DEBUG) {
		console.log('[mason] styledict', node.type, JSON.stringify(dict), 'classSpacing=' + node.classSpacing, 'classInsets=' + JSON.stringify(node.classInsets), 'dockInsets=' + JSON.stringify(node.dockInsets), 'marginInsets=' + JSON.stringify(node.marginInsets), 'className=' + node.props?.className)
	}
	invoke('style', [node.masonNode, dict])
	return node.masonNode
}

/** Rebuilds the mason subtree mirroring `parent`'s children — masonview
 *  descendants recurse as container nodes; every other child is a leaf node
 *  sized by its AppKit view's intrinsic/fitting size (re-measured each pass
 *  through the leaf's explicit dims). */
function syncMasonTree(parent: NodeLike, layoutView: ViewFor) {
	const root = syncMasonNode(parent)
	if (!root) {
		return null
	}

	const children = (parent.projectedChildren ?? parent.children).filter(
		(child: NodeLike) => child.view,
	)
	const nodes: any[] = []
	const nextOrder: NodeLike[] = []

	for (const child of children) {
		const handle =
			child.type === 'masonview'
				? syncMasonTree(child, layoutView)
				: syncMasonNode(child)

		if (!handle) {
			continue
		}

		// Leaf children with no authored size get their intrinsic size pushed
		// as min dims — v1 has no measure callback, and a minimum keeps
		// content-sized views at their intrinsic footprint while still
		// letting stretch/grow sizing (grid tracks, flex stretch) exceed it.
		if (child.type !== 'masonview') {
			const style = child.props?.style ?? {}
			if (style.width == null || style.height == null) {
				const [w, h] = intrinsicSize(layoutView(child))
				const dict = styleDict(child)
				if (style.width == null && !child.sizeConstraintSpecs?.width) {
					dict.minWidth = [1, w]
				}
				if (style.height == null && !child.sizeConstraintSpecs?.height) {
					dict.minHeight = [1, h]
				}
				invoke('style', [handle, dict])
			}
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

/** Walks one level of the flat preorder output: pins each child into
 *  `parentView`, then recurses into masonview children so their records
 *  (written right after in DFS order) position *their* children. */
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
		if (child.type === 'masonview' && child.masonChildren?.length) {
			next = applyRecords(flat, next, child.masonChildren, child.view, pin)
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
	if (!parent?.view || !masonHost()) {
		return
	}

	const root = syncMasonTree(parent, layoutView)
	if (!root) {
		return
	}

	const width = Number(parent.view.bounds?.size?.width) || 0
	const height = Number(parent.view.bounds?.size?.height) || 0

	// A masonview is sized by its parent's layout; give the root node
	// explicit dims so it doesn't shrink-wrap to content.
	const style = parent.props?.style ?? {}
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
	const flat = invoke('layout', [root])
	const count = Number(flat?.count ?? 0)
	if (count < RECORD) {
		return
	}

	if ((process as any).env?.XPLAT_MASON_DEBUG) {
		const recs: string[] = []
		for (let off = 0; off + RECORD <= count; off += RECORD) {
			const r: number[] = []
			for (let i = 0; i < RECORD; i++) {
				r.push(Number(flat.objectAtIndex(off + i)))
			}
			recs.push(r.map((v) => Math.round(v * 10) / 10).join(','))
		}
		console.log('[mason] records', recs.join(' | '))
	}

	applyRecords(flat, RECORD, parent.masonChildren ?? [], parent.view, pin)
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
let deps: MasonDeps | null = null

// Mason-backed host: the Rust engine computes descendant frames; children
// keep their own AppKit views and are pinned like grid/absolute children.
// Nested masonview nodes participate in the parent's compute.
class MasonLayoutView extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		const size = masonNaturalSize(masonLayoutNodesByView.get(this), deps!.layoutView)
		return size ?? { width: -1, height: -1 }
	}

	layout() {
		super.layout()
		layoutMasonChildren(
			masonLayoutNodesByView.get(this),
			deps!.layoutView,
			deps!.pinLayoutChild,
		)
	}
}

function makeMasonLayout(node: any) {
	const view = MasonLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	masonLayoutNodesByView.set(view, node)
	view.postsFrameChangedNotifications = true
	node.masonGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (masonLayoutNodesByView.get(view) === node) {
					deps!.queueLayoutReconcile(node.container, node)
				}
			},
		)

	return view
}

/** Called once by the renderer at module init — registers `masonview` and
 *  captures the renderer helpers the behavior needs. */
export function installMasonElement(next: MasonDeps) {
	deps = next
	next.registerElementType('masonview', {
		container: true,
		containerStyles: true,
		styleKeys: MASON_STYLE_KEYS,
		make(node) {
			node.view = makeMasonLayout(node)
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
			releaseMasonNodes(node)
			for (const child of node.children.slice()) {
				next.detach(node.container, child)
			}
		},
	})
}
