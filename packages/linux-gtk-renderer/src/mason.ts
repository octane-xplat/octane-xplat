// Mason layout engine bridge for the GTK renderer — binds mason-c through
// the XplatMason typelib produced by native/xplatmason/build.sh and drives
// it for `masonview` subtrees. Elements keep their own GTK widgets; mason
// only computes frames, which a custom Gtk.LayoutManager applies via
// size_allocate — the same channel every other GTK4 layout manager uses.
//
// GJS has no plain-C FFI, so the engine crosses `imports.gi.XplatMason`
// (a GI namespace over the libxplatmason-gtk shared library — the GTK-side
// counterpart of macOS's XPLMason ObjC facade). The typelib resolves via
// GI_TYPELIB_PATH, the XPLAT_MASON_TYPELIB env var, or a system install;
// absent it, masonview falls back to the Gtk.Box emulation in index.ts.
//
// Style-dict contract matches the macOS dict one-for-one except margin and
// padding: GTK's own measure/allocate pipeline already folds the widget's
// CSS margin/padding into leaf measures and child allocations, so feeding
// them to the engine would double-count. Everything else (dims, edges,
// enums, gaps, grid tracks) is identical.

import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gsk from 'gi://Gsk?version=4.0'
import Graphene from 'gi://Graphene'
import { resolveClipPath, type ClipPath } from '@octane-xplat/macos-renderer/css'
import { paintOrder, resolveTransform, transformSteps, zIndexOf } from './transform-style.ts'

type NodeLike = any

const RECORD = 22
/** compute_wh sentinels (mason AvailableSpace): -1 min-content, -2 max-content. */
const MIN_CONTENT = -1
const MAX_CONTENT = -2

// ---------------------------------------------------------------------------
// Typelib load + engine singleton
// ---------------------------------------------------------------------------

let mason: any = null
let engine = 0
let initFailed = false

function loadMasonNamespace(): any {
	const typelibDir = GLib.getenv?.('XPLAT_MASON_TYPELIB')
	if (typelibDir) {
		try {
			const repo = (globalThis as any).imports?.gi?.GIRepository?.Repository
			const instance = repo?.get_default?.() ?? repo?.dup_default?.()
			if (instance?.prepend_search_path) {
				instance.prepend_search_path(typelibDir)
			} else {
				repo?.prepend_search_path?.(typelibDir)
			}
		} catch {
			// Older GIRepository revisions — GI_TYPELIB_PATH still applies.
		}
	}
	try {
		return (globalThis as any).imports?.gi?.XplatMason ?? null
	} catch {
		return null
	}
}

function masonEngine(): number | null {
	if (engine || initFailed) {
		return engine || null
	}
	mason = loadMasonNamespace()
	if (!mason) {
		console.warn(
			'[linux-gtk-mason] XplatMason typelib not found — masonview falls back to Gtk.Box emulation. ' +
				'Build packages/linux-gtk-renderer/native/xplatmason and set XPLAT_MASON_TYPELIB or GI_TYPELIB_PATH.',
		)
		initFailed = true
		return null
	}
	engine = mason.engine_new()
	if (!engine) {
		initFailed = true
		return null
	}
	// GTK logical pixels are already the device scale CSS px assume.
	mason.engine_set_scale(engine, 1)
	return engine
}

export function masonAvailable(): boolean {
	return masonEngine() != null
}

// ---------------------------------------------------------------------------
// Style translation — same dict contract as macOS mason.ts.
// ---------------------------------------------------------------------------

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

/** Length/percent dimension for gap — 0 length, 1 percent. */
function lenDim(value: any): [number, number] | undefined {
	const dim = autoDim(value)
	if (!dim) {
		return undefined
	}
	return dim[0] === 2 ? [1, dim[1]] : dim[0] === 1 ? [0, dim[1]] : undefined
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

/** Style keys mason consumes from props.style inside a masonview subtree. */
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
	// GTK-side only: margin/padding stay style keys so the Box-emulation
	// skip list covers them; they reach the engine through the widget's
	// own CSS box, not the dict (see module header).
	'margin',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
	'padding',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
])

/** Intrinsic types laid out by the Mason engine — masonview is the single
 *  layout container on this target (scrollview keeps native Gtk chrome;
 *  liquidglass does not exist here). */
const MASON_CONTAINERS = new Set(['masonview'])

/** Translates a node's resolved style state into the mason style dict.
 *  `style` carries authored CSS-ish props; the width/height/min/max dims
 *  may also arrive as plain props (shared contract allows both). Margin and
 *  padding are
 *  deliberately absent — GTK CSS owns them inside the measure/allocate
 *  channel. */
function styleDict(node: NodeLike): Record<string, any> {
	const props = node.props ?? {}
	// The cascade's computed bag already folds the inline style prop in.
	const style = node.computedStyle ?? props.style ?? {}
	const out: Record<string, any> = {}

	for (const key of ENUM_STYLE_KEYS) {
		const value = style[key]
		if (typeof value === 'string') {
			out[key] = value
		}
	}

	// Only collapse removes layout space — NS `hidden` keeps it, so it maps
	// to child-invisible on the widget, never display:none. The computed
	// style carries the CSS value alongside the prop.
	if (
		props.visible === false ||
		props.visibility === 'collapse' ||
		style.visibility === 'collapse'
	) {
		out.display = 'none'
	}

	for (const [from, to] of DIM_AUTO_KEYS) {
		const value = from === 'flexBasis' ? style[from] : (style[from] ?? props[from])
		const dim = autoDim(value)
		if (dim) {
			out[to] = dim
		}
	}

	for (const [from, to] of DIM_EDGES) {
		const dim = autoDim(style[from])
		if (dim) {
			;(out.inset ??= {})[to] = dim
		}
	}

	const gap = lenDim(style.gap)
	const rowGap = lenDim(style.rowGap) ?? gap
	const columnGap = lenDim(style.columnGap) ?? gap
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

	return out
}

// ---------------------------------------------------------------------------
// Tree sync — a parallel mason node tree mirrors the logical children, like
// macOS. Leaf nodes are measured live from their Gtk widget each pass.
// ---------------------------------------------------------------------------

function syncMasonNode(node: NodeLike) {
	const masonEngine_ = masonEngine()
	if (masonEngine_ == null) {
		return 0
	}

	if (!node.masonNode) {
		// Container descendants recurse as plain nodes; every other child is
		// a measured leaf bound to its widget — foreign intrinsics like
		// Gtk.Label get the same leaf treatment macOS gives NSViews.
		node.masonNode = MASON_CONTAINERS.has(node.type)
			? mason.node_new(masonEngine_, false)
			: node.view
				? mason.node_new_leaf(masonEngine_, node.view)
				: mason.node_new(masonEngine_, false)
		if (!node.masonNode) {
			return 0
		}
	}

	if (node.view) {
		nodesByChildView.set(node.view, node)
	}
	const dict = styleDict(node)
	mason.node_set_style(masonEngine_, node.masonNode, JSON.stringify(dict))
	return node.masonNode
}

/** View-bearing logical children the engine lays out, in GTK child order —
 *  viewless wrappers (contentview and friends) project their view
 *  descendants upward, matching the driver's attachment flattening. */
function effectiveChildren(parent: NodeLike, out: NodeLike[] = []): NodeLike[] {
	for (const child of parent.children ?? []) {
		if (child.view !== null) {
			out.push(child)
		} else {
			effectiveChildren(child, out)
		}
	}
	return out
}

/** Rebuilds the mason subtree mirroring `parent`'s children — container
 *  descendants recurse; every other child is a measured leaf. */
function syncMasonTree(parent: NodeLike): number {
	const root = syncMasonNode(parent)
	if (!root) {
		return 0
	}

	const children = effectiveChildren(parent)
	const handles: number[] = []
	const nextOrder: NodeLike[] = []

	for (const child of children) {
		const handle = MASON_CONTAINERS.has(child.type)
			? syncMasonTree(child)
			: syncMasonNode(child)
		if (!handle) {
			continue
		}
		// Re-measure leaves every pass — text/CSS may have changed since the
		// last compute.
		if (!MASON_CONTAINERS.has(child.type)) {
			mason.node_mark_dirty(masonEngine()!, handle)
		}
		handles.push(handle)
		nextOrder.push(child)
	}

	const changed =
		!parent.masonChildren ||
		parent.masonChildren.length !== nextOrder.length ||
		parent.masonChildren.some((child: NodeLike, index: number) => child !== nextOrder[index])

	if (changed) {
		mason.node_set_children(masonEngine()!, root, handles)
		parent.masonChildren = nextOrder
	}

	return root
}

function records(bytes: any): Float32Array {
	const u8: Uint8Array = bytes.toArray()
	return new Float32Array(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength))
}

/** Computes the subtree and returns the root record's [width, height]. */
function computeRootSize(
	root: number,
	width: number,
	height: number,
): [number, number] {
	mason.node_compute(masonEngine()!, root, width, height)
	const flat = records(mason.node_layout_shallow(masonEngine()!, root))
	return flat.length >= 5 ? [flat[3], flat[4]] : [0, 0]
}

/** Lays out `node`'s direct children at the given size — the layout
 *  manager's allocate vfunc drives this on every GTK allocation. */
function layoutChildren(node: NodeLike, width: number, height: number) {
	const root = syncMasonTree(node)
	if (!root) {
		return
	}

	mason.node_compute(masonEngine()!, root, width, height)
	const flat = records(mason.node_layout_shallow(masonEngine()!, root))
	if (flat.length < RECORD * 2) {
		return
	}

	const host = node.view
	const allocation = new (Gdk as any).Rectangle()
	let index = 0
	for (
		let child = host.get_first_child();
		child !== null;
		child = child.get_next_sibling(), index++
	) {
		const off = RECORD + index * RECORD
		if (off + 5 > flat.length) {
			break
		}
		allocation.x = Math.round(flat[off + 1])
		allocation.y = Math.round(flat[off + 2])
		allocation.width = Math.max(0, Math.round(flat[off + 3]))
		allocation.height = Math.max(0, Math.round(flat[off + 4]))
		const transform = childTransform(nodesByChildView.get(child), allocation)
		if (transform) {
			child.allocate(allocation.width, allocation.height, -1, transform)
		} else {
			child.size_allocate(allocation, -1)
		}
	}
}

/** Effective style a child paints with — the computed bag plus the
 *  keyframe overlay the driver keeps on `node.animatedStyle`. */
function paintStyle(node: NodeLike): Record<string, any> {
	const base = node?.computedStyle ?? node?.props?.style ?? {}
	return node?.animatedStyle ? { ...base, ...node.animatedStyle } : base
}

/** NS transform on the child allocation: origin at the allocation's
 *  centre, steps in updateNativeTransform order, % against the child's own
 *  size. GTK picking honours allocation transforms, as UIKit/Android do. */
function childTransform(node: NodeLike, allocation: any): any {
	if (!node) {
		return null
	}
	const parts = resolveTransform(paintStyle(node))
	if (!parts) {
		return null
	}
	const w = allocation.width
	const h = allocation.height
	let t = new (Gsk as any).Transform()
	t = t.translate(new (Graphene as any).Point({ x: allocation.x + w / 2, y: allocation.y + h / 2 }))
	for (const step of transformSteps(parts, w, h)) {
		switch (step.kind) {
			case 'perspective':
				t = t.perspective(step.depth)
				break
			case 'translate':
				t = t.translate(new (Graphene as any).Point({ x: step.x, y: step.y }))
				break
			case 'rotate':
				t = t.rotate(step.deg)
				break
			case 'rotateX':
				t = t.rotate_3d(step.deg, (Graphene as any).vec3_x_axis())
				break
			case 'rotateY':
				t = t.rotate_3d(step.deg, (Graphene as any).vec3_y_axis())
				break
			case 'scale':
				t = t.scale(step.x, step.y)
				break
		}
	}
	return t.translate(new (Graphene as any).Point({ x: -w / 2, y: -h / 2 }))
}

let polygonClipWarned = false

/** Push `clip` (child-local geometry) onto the snapshot. Returns false when
 *  the shape can't be expressed on this GTK (polygon before 4.14). */
function pushClip(snapshot: any, clip: ClipPath): boolean {
	const G = Graphene as any
	const rounded = (x: number, y: number, w: number, h: number, radii: [number, number][]) => {
		const rr = new (Gsk as any).RoundedRect()
		const size = ([rx, ry]: [number, number]) => new G.Size({ width: rx, height: ry })
		rr.init(new G.Rect().init(x, y, w, h), size(radii[0]), size(radii[1]), size(radii[2]), size(radii[3]))
		snapshot.push_rounded_clip(rr)
	}
	switch (clip.type) {
		case 'inset': {
			const w = Math.max(0, clip.right - clip.left)
			const h = Math.max(0, clip.bottom - clip.top)
			rounded(clip.left, clip.top, w, h, clip.radii.length === 4 ? clip.radii : [[0, 0], [0, 0], [0, 0], [0, 0]])
			return true
		}
		case 'circle': {
			const r = clip.radius
			rounded(clip.cx - r, clip.cy - r, 2 * r, 2 * r, [[r, r], [r, r], [r, r], [r, r]])
			return true
		}
		case 'ellipse': {
			const corner: [number, number] = [clip.rx, clip.ry]
			rounded(clip.cx - clip.rx, clip.cy - clip.ry, 2 * clip.rx, 2 * clip.ry, [corner, corner, corner, corner])
			return true
		}
		case 'polygon': {
			const PathBuilder = (Gsk as any).PathBuilder
			if (typeof PathBuilder !== 'function' || typeof snapshot.push_fill !== 'function') {
				if (!polygonClipWarned) {
					polygonClipWarned = true
					console.warn('[linux-gtk-css] clip-path polygon() needs GTK 4.14+ — ignored')
				}
				return false
			}
			const builder = new PathBuilder()
			clip.points.forEach(([x, y], index) => (index === 0 ? builder.move_to(x, y) : builder.line_to(x, y)))
			builder.close()
			snapshot.push_fill(builder.to_path(), (Gsk as any).FillRule.WINDING)
			return true
		}
		default:
			return false
	}
}

/** Snapshot one child under its clip-path. The clip is established in the
 *  child's own (transformed) space, then the transform is undone so
 *  snapshot_child can re-apply it. Snapshot clips don't affect picking —
 *  same as NS iOS, whose layer mask doesn't change hitTest. */
function snapshotClipped(host: any, child: any, snapshot: any, text: string) {
	let clip: ClipPath
	try {
		clip = resolveClipPath(text, child.get_width(), child.get_height())
	} catch {
		// NS rejects malformed clip-path values — paint unclipped.
		clip = { type: 'none' }
	}
	const [ok, matrix] = child.compute_transform(host)
	const [invertible, inverse] = ok ? matrix.inverse() : [false, null]
	if (clip.type === 'none' || !invertible) {
		host.snapshot_child(child, snapshot)
		return
	}
	snapshot.save()
	snapshot.transform_matrix(matrix)
	const pushed = pushClip(snapshot, clip)
	snapshot.transform_matrix(inverse)
	host.snapshot_child(child, snapshot)
	if (pushed) {
		snapshot.pop()
	}
	snapshot.restore()
}

/** Children in paint order (NS z-index, stable) with clip-paths applied.
 *  Paint order only — GTK still picks in document order, like UIKit, whose
 *  hitTest ignores layer.zPosition. */
function snapshotChildren(host: any, snapshot: any) {
	const children: any[] = []
	for (let child = host.get_first_child(); child !== null; child = child.get_next_sibling()) {
		children.push(child)
	}
	const styles = children.map((child) => paintStyle(nodesByChildView.get(child)))
	const order = paintOrder(styles.map(zIndexOf)) ?? children.map((_, index) => index)
	for (const index of order) {
		const clipPath = styles[index].clipPath
		if (typeof clipPath === 'string' && clipPath.trim() && clipPath.trim() !== 'none') {
			snapshotClipped(host, children[index], snapshot, clipPath)
		} else {
			host.snapshot_child(children[index], snapshot)
		}
	}
}

/** Natural size for GTK's measure vfunc — min/max-content computes read the
 *  root record; forSize constrains the opposite axis when GTK knows it. */
function measureNode(
	node: NodeLike,
	horizontal: boolean,
	forSize: number,
): [number, number] {
	const root = syncMasonTree(node)
	if (!root) {
		return [0, 0]
	}
	const offer = forSize >= 0 ? forSize : MAX_CONTENT
	const nat = horizontal
		? computeRootSize(root, MAX_CONTENT, offer)[0]
		: computeRootSize(root, offer, MAX_CONTENT)[1]
	const min = horizontal
		? computeRootSize(root, MIN_CONTENT, offer)[0]
		: computeRootSize(root, offer, MIN_CONTENT)[1]
	return [min, nat]
}

/** Frees the engine-side nodes under `node` — call from the driver's
 *  destroy/recreate paths. */
export function releaseMasonNodes(node: NodeLike) {
	if (!mason) {
		return
	}
	for (const child of node.children ?? []) {
		releaseMasonNodes(child)
	}
	if (node.masonNode) {
		mason.node_free(engine, node.masonNode)
		node.masonNode = undefined
	}
	node.masonChildren = undefined
}

// ---------------------------------------------------------------------------
// GTK seam — a concrete Gtk.Widget subclass hosts mason children; a custom
// Gtk.LayoutManager runs the engine during measure/allocate so GTK's own
// resize pipeline schedules every pass.
// ---------------------------------------------------------------------------

const nodesByView = new WeakMap<object, NodeLike>()
/** Any mason-laid-out child widget → its logical node (transform, z-index
 *  and clip-path read the node's style at allocate/snapshot time). */
const nodesByChildView = new WeakMap<object, NodeLike>()

const MasonLayoutManager = GObject.registerClass(
	{ GTypeName: 'XplatMasonLayoutManager' },
	class XplatMasonLayoutManager extends (Gtk as any).LayoutManager {
		vfunc_measure(widget: GtkView, orientation: number, forSize: number) {
			const node = nodesByView.get(widget)
			if (!node) {
				return [0, 0, -1, -1]
			}
			const [min, nat] = measureNode(node, orientation === 0, forSize)
			return [Math.ceil(min), Math.ceil(nat), -1, -1]
		}
		vfunc_allocate(widget: GtkView, width: number, height: number, _baseline: number) {
			const node = nodesByView.get(widget)
			if (node) {
				layoutChildren(node, width, height)
			}
		}
	},
)

const MasonView = GObject.registerClass(
	{ GTypeName: 'XplatMasonView' },
	class XplatMasonView extends (Gtk as any).Widget {
		vfunc_snapshot(snapshot: any) {
			snapshotChildren(this, snapshot)
		}
	},
)

type GtkView = any

/** The masonview host widget — a concrete Gtk.Widget carrying the engine's
 *  layout manager. `bindMasonView` links the logical node before first use. */
export function makeMasonView(): GtkView {
	const view = new MasonView()
	view.set_layout_manager(new MasonLayoutManager())
	return view
}

/** Records the logical node the layout manager's vfuncs resolve from a
 *  widget — called by the driver when a masonview's node is created. */
export function bindMasonView(view: GtkView, node: NodeLike) {
	nodesByView.set(view, node)
}

/** True when `view` is a mason host widget — used before the node binding
 *  exists (instantiate/createNode) where the WeakMap is still empty. */
export function isMasonView(view: GtkView | null): boolean {
	return view instanceof MasonView
}

/** True when `view` is a bound mason host — children attach via
 *  insert_before / insert_after and are laid out by the engine, not by
 *  GTK boxes/fixed. */
export function isMasonHostView(view: GtkView | null): boolean {
	return view != null && (nodesByView.has(view) || view instanceof MasonView)
}

/** Asks GTK to re-run measure/allocate above this node's view — the driver's
 *  equivalent of macOS's queueLayoutReconcile: style/class/prop writes and
 *  child attach/detach all funnel here. */
export function queueMasonLayout(view: GtkView | null) {
	view?.queue_resize?.()
}
