// GTK4 host driver for the Octane universal runtime — the Linux/GJS sibling
// of packages/macos-renderer's AppKit driver. Derived from the proven
// feasibility adapter (evidence: .agents/design/linux-gtk-feasibility-review.md;
// runs 12–16 on GJS 1.82.3 + GTK 4.18.6, Debian 13 aarch64) and mapped onto
// the shared intrinsic vocabulary (packages/jsx/src/shared.d.ts).
//
// Runs inside GJS; `gi://` imports stay external to the app bundle — the GI
// libraries are the platform. GJS 1.82 exposes no queueMicrotask and no
// `process` global: createGtkRoot installs the Promise-based microtask bridge
// the universal runtime requires, and the bundle's `process.env.NODE_ENV`
// reads must be inlined by the build (xplatLinuxGtk does).
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import {
	bindMasonView,
	isMasonHostView,
	isMasonView,
	makeMasonView,
	masonAvailable,
	queueMasonLayout,
	releaseMasonNodes,
} from './mason.js'
import { createUniversalRoot } from 'octane/universal/native'
import type {
	UniversalEventListenerDescriptor,
	UniversalHostBatch,
	UniversalHostCommand,
	UniversalHostDriver,
	UniversalHostParent,
	UniversalRoot,
	UniversalRootOptions,
} from 'octane/universal/native'

export const GTK_RENDERER_ID = 'gtk'
const TEXT = '#text'

type PropBag = Record<string, any>

/** The GTK object a node owns. `view` is null for `#text`, `span`,
 *  `formattedstring`, `contentview`, `proxyviewcontainer` and `rootlayout`
 *  nodes — text nodes fold into the nearest text-bearing ancestor, and the
 *  viewless containers project their children into the nearest view
 *  ancestor. Members beyond the declared subset resolve loosely — each
 *  node-type code path knows the concrete Gtk class its factory created. */
export type GtkView = Gtk.Widget & { [key: string]: any }

interface SignalConnection {
	emitter: any
	signalId: number
}

/** A retained element in the GTK tree. */
export interface ElementNode {
	id: number
	type: string
	view: GtkView | null
	text: string
	props: PropBag
	parent: ElementNode | null
	children: ElementNode[]
	container: GtkContainer
	/** Connected GTK signal handlers: event type → connections. */
	listeners: Map<string, SignalConnection[]>
	/** Event controllers installed for a listener (gestures, focus). */
	controllers: Map<string, any[]>
	/** Event types currently echo-suppressed for controlled writes. */
	muted: Set<string>
	/** User-edit counter — a pending selection settle never re-asserts over
	 *  a change newer than the write that scheduled it. */
	changeSeq: number
	selSettleSource: number | null
	/** View insertion position for Gtk.Fixed children. */
	fixedX: number
	fixedY: number
	/** Gtk.Grid placement props. */
	gridRow: number | null
	gridCol: number | null
	gridRowSpan: number
	gridColSpan: number
	/** Recorded `flexGrow` — expand is resolved at attach time, once the
	 *  parent's orientation is known. */
	flexGrowValue: unknown
	/** textfield's `editable` folded into `sensitive` alongside `enabled`. */
	editableFlag: boolean | undefined
	/** CSS state owned by the style/className pipeline. */
	cssClass: string | null
	cssProvider: Gtk.CssProvider | null
	cssSignature: string
	classes: string[]
	/** True once this label/button's text has been written. */
	textApplied: boolean
	/** Engine handle when this node participates in a Mason subtree. */
	masonNode?: number
	/** Last children order pushed to the engine — set_children deltas. */
	masonChildren?: ElementNode[]
	destroyed: boolean
	[key: string]: any
}

/** Per-root state shared by the driver commands. */
export interface GtkContainer {
	/** The GTK widget the tree mounts into — a container (Gtk.Box, Gtk.Fixed)
	 *  or the window's content widget. */
	host: GtkView
	nodes: Map<number, ElementNode>
	children: ElementNode[]
	root: UniversalRoot | null
}

// ---------------------------------------------------------------------------
// Events — prop name → universal event type → GTK signal/controller wiring.
// classify reads the shared event vocabulary (CommonEvents in
// packages/jsx/src/shared.d.ts); unlisted on* props stay ordinary props.
// ---------------------------------------------------------------------------

const EVENT_PROP_TYPE: Record<
	string,
	{ type: string; priority: 'discrete' | 'continuous' | 'default' }
> = {
	onTap: { type: 'tap', priority: 'discrete' },
	onClick: { type: 'tap', priority: 'discrete' },
	onPress: { type: 'tap', priority: 'discrete' },
	onDoubleTap: { type: 'doubletap', priority: 'discrete' },
	onLongPress: { type: 'longpress', priority: 'discrete' },
	onChange: { type: 'change', priority: 'default' },
	onTextChange: { type: 'change', priority: 'default' },
	onCheckedChange: { type: 'change', priority: 'default' },
	onValueChange: { type: 'change', priority: 'default' },
	onSelectedIndexChange: { type: 'change', priority: 'default' },
	onSubmit: { type: 'submit', priority: 'discrete' },
	onReturnPress: { type: 'submit', priority: 'discrete' },
	onFocus: { type: 'focus', priority: 'default' },
	onBlur: { type: 'blur', priority: 'default' },
	onLoaded: { type: 'loaded', priority: 'default' },
	onUnloaded: { type: 'unloaded', priority: 'default' },
	onScroll: { type: 'scroll', priority: 'continuous' },
}

const EVENT_PROP = /^on([A-Z])(.*)$/

const warn = (...args: any[]) => console.warn('[linux-gtk]', ...args)

/** on* props that never classify as events still drop out of the props bag
 *  on other drivers; warn once per (element, prop) pair instead of silently
 *  accepting a handler that can never fire. */
const warnedEventProps = new Set<string>()

function warnEventProp(node: ElementNode, name: string) {
	const key = `${node.type}:${name}`
	if (!warnedEventProps.has(key)) {
		warnedEventProps.add(key)
		warn(`<${node.type}> ${name} is not a GTK-wired event — the handler will never fire`)
	}
}

const warnedOnce = new Set<string>()

function warnOnce(key: string, message: string) {
	if (!warnedOnce.has(key)) {
		warnedOnce.add(key)
		warn(message)
	}
}

/** Prop names that only exist as pre-cutover layout vocabulary — inside a
 *  Mason subtree they land on a dead field, so the driver warns once per
 *  (element, prop) pair and consumes the write (macOS parity contract). */
const MASON_CHILD_STYLE_ONLY_PROPS = new Set([
	'x',
	'y',
	'left',
	'top',
	'row',
	'col',
	'rowSpan',
	'colSpan',
	'flexGrow',
	'flexShrink',
	'alignSelf',
	'justifySelf',
	'horizontalAlignment',
	'halign',
	'verticalAlignment',
	'valign',
])

const MASON_CONTAINER_STYLE_ONLY_PROPS = new Set([
	'orientation',
	'spacing',
	'gap',
	'rowGap',
	'columnGap',
	'flexDirection',
	'flexWrap',
	'justifyContent',
	'alignItems',
	'alignContent',
	'flexBasis',
	'rows',
	'columns',
	'dock',
	'flexWrapBefore',
	'stretchLastChild',
	'itemWidth',
	'itemHeight',
])

const warnedStyleOnlyProps = new Set<string>()

function warnStyleOnly(node: ElementNode, name: string) {
	const key = `${node.type}:${name}`
	if (!warnedStyleOnlyProps.has(key)) {
		warnedStyleOnlyProps.add(key)
		warn(
			`<${node.type} ${name}=...> is a Mason style key — move it into style={{ ${name}: ... }} or a class.`,
		)
	}
}

/** Events arriving mid-apply (e.g. Gtk signals fired by attachment) defer a
 *  microtask so they dispatch after commit — same ordering guard as the NS
 *  driver's applyingDepth. */
let applyingDepth = 0

// ---------------------------------------------------------------------------
// Element factories — one Gtk widget per view-bearing intrinsic.
// ---------------------------------------------------------------------------

function instantiate(type: string): GtkView {
	switch (type) {
		// The real layout engine when the XplatMason typelib is loadable —
		// a Gtk.Widget + custom Gtk.LayoutManager driven by mason-c. The
		// Gtk.Box fallback keeps the shim's emulation for builds without
		// the native artifact (see src/mason.ts module note).
		case 'masonview':
			return masonAvailable()
				? makeMasonView()
				: new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0 })
		case 'label':
			return new Gtk.Label({ label: '', xalign: 0 })
		case 'button':
			return new Gtk.Button()
		case 'scrollview':
			return new Gtk.ScrolledWindow()
		case 'textfield':
			return new Gtk.Entry()
		case 'switch':
			return new Gtk.Switch()
		case 'slider':
			return new Gtk.Scale({
				orientation: Gtk.Orientation.HORIZONTAL,
				adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
			})
		case 'progress':
			return new Gtk.ProgressBar()
		case 'activityindicator':
			return new Gtk.Spinner()
		default:
			throw new Error(`linux-gtk driver: <${type}> is not a registered element.`)
	}
}

// Viewless node types — logical nodes that own no Gtk widget.
const VIEWLESS: ReadonlySet<string> = new Set([
	TEXT,
	'span',
	'formattedstring',
	'contentview',
	'proxyviewcontainer',
	'rootlayout',
])

const TEXT_HOSTS = new Set(['label', 'button'])

// ---------------------------------------------------------------------------
// Styles — the shared `style` object maps onto per-widget Gtk.CssProvider
// rules plus direct widget properties; removed keys reset, never go stale
// (the prop-removal contract: update bags carry the complete next prop set).
// ---------------------------------------------------------------------------

const CSS_PROPS: Record<string, string> = {
	backgroundColor: 'background-color',
	color: 'color',
	fontSize: 'font-size',
	fontWeight: 'font-weight',
	fontStyle: 'font-style',
	fontFamily: 'font-family',
	borderRadius: 'border-radius',
	borderColor: 'border-color',
	borderWidth: 'border-width',
	padding: 'padding',
	paddingTop: 'padding-top',
	paddingRight: 'padding-right',
	paddingBottom: 'padding-bottom',
	paddingLeft: 'padding-left',
	margin: 'margin',
	marginTop: 'margin-top',
	marginRight: 'margin-right',
	marginBottom: 'margin-bottom',
	marginLeft: 'margin-left',
	minWidth: 'min-width',
	minHeight: 'min-height',
}

function cssValue(name: string, value: unknown): string | null {
	if (typeof value === 'number') {
		// Numeric sizes are logical px; weight/style/family pass through.
		return name === 'fontWeight' || name === 'fontStyle' || name === 'fontFamily'
			? String(value)
			: `${value}px`
	}
	if (typeof value === 'string') {
		if (name === 'fontWeight') {
			return value
		}
		if (name === 'fontFamily') {
			return /[\s,]/.test(value) && !/^['"]/.test(value) ? `"${value}"` : value
		}
		// GTK CSS parses the same px/rgb()/named-color vocabulary here.
		if (/^\d+(?:\.\d+)?$/.test(value)) {
			return `${value}px`
		}
		return value
	}
	return null
}

function syncCss(node: ElementNode, style: PropBag | null | undefined) {
	const view = node.view
	if (view === null) {
		return
	}

	const next: [string, string][] = []
	if (style && typeof style === 'object') {
		for (const name of Object.keys(CSS_PROPS)) {
			const decl = cssValue(name, style[name])
			if (decl !== null) {
				next.push([CSS_PROPS[name], decl])
			}
		}
	}

	const signature = next.map(([k, v]) => `${k}:${v}`).join(';')
	if (signature === node.cssSignature) {
		return
	}
	node.cssSignature = signature

	if (next.length === 0) {
		if (node.cssProvider !== null) {
			view.get_style_context().remove_provider(node.cssProvider)
			node.cssProvider = null
		}
		if (node.cssClass !== null) {
			view.remove_css_class(node.cssClass)
			node.cssClass = null
		}
		return
	}

	if (node.cssClass === null) {
		node.cssClass = `xplat-n${node.id}`
		view.add_css_class(node.cssClass)
	}

	const css = `.${node.cssClass} { ${next.map(([k, v]) => `${k}: ${v};`).join(' ')} }`
	if (node.cssProvider === null) {
		node.cssProvider = new Gtk.CssProvider()
		view
			.get_style_context()
			.add_provider(node.cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
	}
	node.cssProvider.load_from_string(css)
}

/** clsx-style ClassValue → flat class-name list (the shared contract's
 *  className composition). */
function classList(value: unknown, out: string[] = []): string[] {
	if (typeof value === 'string') {
		out.push(...value.split(/\s+/).filter(Boolean))
	} else if (Array.isArray(value)) {
		for (const entry of value) {
			classList(entry, out)
		}
	} else if (value && typeof value === 'object') {
		for (const [name, on] of Object.entries(value)) {
			if (on) {
				out.push(name)
			}
		}
	}
	return out
}

/** `style` accepts a string parsed as inline CSS or an object assigned onto
 *  the widget's style bag (the shared StyleProps contract). */
function styleBag(value: unknown): PropBag | null {
	if (typeof value === 'string') {
		const bag: PropBag = {}
		for (const decl of value.split(';')) {
			const colon = decl.indexOf(':')
			if (colon === -1) {
				continue
			}
			const key = decl.slice(0, colon).trim()
			const val = decl.slice(colon + 1).trim()
			if (!key || !val) {
				continue
			}
			// kebab-case CSS → camelCase prop name
			bag[key.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())] = val
		}
		return bag
	}
	return value && typeof value === 'object' ? (value as PropBag) : null
}

function syncClasses(node: ElementNode, value: unknown) {
	const view = node.view
	if (view === null) {
		return
	}

	const next = classList(value)
	for (const name of node.classes) {
		if (!next.includes(name)) {
			view.remove_css_class(name)
		}
	}
	for (const name of next) {
		if (!node.classes.includes(name)) {
			view.add_css_class(name)
		}
	}
	node.classes = next
}

function dimension(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : -1
}

function applyStyleExtras(node: ElementNode, view: GtkView, style: PropBag | null | undefined) {
	const source = style && typeof style === 'object' ? style : {}
	const width = source.width != null ? dimension(source.width) : -1
	const height = source.height != null ? dimension(source.height) : -1
	if (width !== node.appliedWidth || height !== node.appliedHeight) {
		node.appliedWidth = width
		node.appliedHeight = height
		view.set_size_request(width, height)
	}
	if (source.opacity != null) {
		view.set_opacity(Number(source.opacity))
	} else if (node.appliedOpacity !== undefined) {
		view.set_opacity(1)
	}
	node.appliedOpacity = source.opacity

	// Inside a Mason subtree the engine owns layout — the keys below are
	// consumed by the style dict in src/mason.ts during the next
	// measure/allocate pass, so the Gtk.Box emulation must not also apply
	// them. queue_resize re-runs GTK's layout pipeline on the host.
	if (isMasonHostView(hostViewOf(node.container, node.parent)) || isMasonHostView(view)) {
		queueMasonLayout(view)
		return
	}

	// Layout keys arrive through the style bag — the Gtk.Box shim consumes
	// the subset it can express when the engine isn't backing this subtree.
	if (node.type === 'masonview') {
		if (source.flexDirection != null) {
			setOrientation(node, view, source.flexDirection)
		}
		const spacing = source.gap ?? source.rowGap ?? source.columnGap
		if (spacing != null) {
			view.spacing = Number(spacing) || 0
		}
	}
	// flexGrow clearing must be unconditional — an absent key means the expand
	// was removed, and syncExpand resets both axes when the value is falsy.
	node.flexGrowValue = source.flexGrow
	syncExpand(node)
	if (source.alignSelf != null) {
		const align = ALIGN[String(source.alignSelf)]
		const hostView = hostViewOf(node.container, node.parent)
		if (align !== undefined && hostView instanceof Gtk.Box) {
			if (hostView.orientation === Gtk.Orientation.HORIZONTAL) {
				view.set_valign(align)
			} else {
				view.set_halign(align)
			}
		}
	}
	if (source.justifySelf != null) {
		const align = ALIGN[String(source.justifySelf)]
		if (align !== undefined) {
			view.set_halign(align)
		}
	}
	if (source.left != null) {
		node.fixedX = Number(source.left)
		repositionFixedChild(node)
	}
	if (source.top != null) {
		node.fixedY = Number(source.top)
		repositionFixedChild(node)
	}
	// CSS grid lines — '2' or '2 / span 3' — map onto the recorded grid slots.
	const gridLine = (v: unknown): [number, number] | null => {
		const m = /^\s*(\d+)(?:\s*\/\s*span\s*(\d+))?/.exec(String(v ?? ''))
		return m ? [Number(m[1]) - 1, Number(m[2] ?? 1)] : null
	}
	const grow = gridLine(source.gridRow)
	if (grow) {
		node.gridRow = grow[0]
		node.gridRowSpan = grow[1]
		repositionGridChild(node)
	}
	const gcol = gridLine(source.gridColumn)
	if (gcol) {
		node.gridCol = gcol[0]
		node.gridColSpan = gcol[1]
		repositionGridChild(node)
	}
}

// ---------------------------------------------------------------------------
// Prop application — update bags carry the complete next prop set, so keys
// dropped between renders must restore their documented default.
// ---------------------------------------------------------------------------

// Type-specific defaults for prop drops — common props reset through
// resetProp's switch; this table is only the per-tag residue.
const RESET_DEFAULTS: Record<string, Record<string, unknown>> = {
	label: {
		text: '',
		value: '',
		xalign: 0,
		textWrap: false,
		textOverflow: 'clip',
		selectable: false,
		maxLines: -1,
	},
	button: { label: '', text: '', title: '', formattedText: '', textWrap: false },
	textfield: {
		value: '',
		text: '',
		placeholder: '',
		hint: '',
		secure: false,
		editable: true,
		maxLength: 0,
		keyboardType: 'default',
		autocorrect: true,
	},
	switch: { checked: false },
	slider: { value: 0, minValue: 0, maxValue: 100 },
	progress: { value: 0, maxValue: 100 },
	activityindicator: { busy: false },
	scrollview: { orientation: 'vertical', scrollBarIndicatorVisible: true, isScrollEnabled: true },
	masonview: { spacing: 0, orientation: 'vertical' },
}

const ALIGN: Record<string, Gtk.Align> = {
	fill: Gtk.Align.FILL,
	stretch: Gtk.Align.FILL,
	start: Gtk.Align.START,
	'flex-start': Gtk.Align.START,
	left: Gtk.Align.START,
	top: Gtk.Align.START,
	end: Gtk.Align.END,
	'flex-end': Gtk.Align.END,
	right: Gtk.Align.END,
	bottom: Gtk.Align.END,
	center: Gtk.Align.CENTER,
	baseline: Gtk.Align.BASELINE_FILL,
}

// Gtk.InputPurpose — the contract's keyboardType values mapped to OS input
// purpose (drives on-screen keyboards / input methods on mobile-ish hosts).
const INPUT_PURPOSES: Record<string, number> = {
	number: Gtk.InputPurpose.NUMBER,
	integer: Gtk.InputPurpose.DIGITS,
	digits: Gtk.InputPurpose.DIGITS,
	phone: Gtk.InputPurpose.PHONE,
	url: Gtk.InputPurpose.URL,
	email: Gtk.InputPurpose.EMAIL,
	password: Gtk.InputPurpose.PASSWORD,
	pin: Gtk.InputPurpose.PIN,
}

const A11Y_ROLES: Record<string, number> = {
	button: Gtk.AccessibleRole.BUTTON,
	link: Gtk.AccessibleRole.LINK,
	image: Gtk.AccessibleRole.IMG,
	img: Gtk.AccessibleRole.IMG,
	text: Gtk.AccessibleRole.LABEL,
	label: Gtk.AccessibleRole.LABEL,
	slider: Gtk.AccessibleRole.SLIDER,
	progressbar: Gtk.AccessibleRole.PROGRESS_BAR,
	checkbox: Gtk.AccessibleRole.CHECKBOX,
	switch: Gtk.AccessibleRole.SWITCH,
}

function setOrientation(node: ElementNode, view: GtkView, direction: unknown) {
	const vertical =
		direction === 'column' || direction === 'vertical' || direction === 'column-reverse'
	if (direction === 'row-reverse' || direction === 'column-reverse') {
		warn(`flexDirection "${String(direction)}" has no GTK equivalent yet — rendering unreversed`)
	}
	view.orientation = vertical ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL
	// The direction is the expand axis — re-resolve flexGrow across the
	// subtree (viewless children carry their descendants' expands too).
	for (const child of node.children) {
		syncExpandDeep(child)
	}
}

/** Apply fn to every view-bearing node in a logical subtree. */
function forEachViewNode(node: ElementNode, fn: (n: ElementNode) => void) {
	if (node.view !== null) {
		fn(node)
	}
	for (const child of node.children) {
		forEachViewNode(child, fn)
	}
}

/** Resolve recorded flexGrow on every view node in a subtree — viewless
 *  inserts and recreates attach descendants without per-node syncExpand. */
function syncExpandDeep(node: ElementNode) {
	forEachViewNode(node, (n) => {
		if (n.flexGrowValue !== undefined) {
			syncExpand(n)
		}
	})
}

/** flexGrow expands along the effective parent box's orientation — the
 *  nearest view ancestor, which may sit above viewless parents. Resolved
 *  when the parent view is known; the prop may arrive before `insert`. */
function syncExpand(node: ElementNode) {
	const view = node.view
	if (view === null) {
		return
	}
	// node.parent === null means root level — hostViewOf resolves the
	// container's host widget, which is itself a box.
	const hostView = hostViewOf(node.container, node.parent)
	if (!(hostView instanceof Gtk.Box)) {
		// flexGrow only maps to box expansion — clear both axes so a move into
		// a non-box parent doesn't leave stale expand flags.
		view.set_hexpand(false)
		view.set_vexpand(false)
		return
	}
	const horizontal = hostView.orientation === Gtk.Orientation.HORIZONTAL
	const expand = Number(node.flexGrowValue) > 0
	// Write both axes — a resolved value must never leave a stale expand on
	// the other axis (orientation flips, or a create-time host guess that a
	// later insert supersedes).
	view.set_hexpand(horizontal && expand)
	view.set_vexpand(!horizontal && expand)
}

function selectionBounds(view: GtkView): [number, number] {
	// GJS packs multiple out-params into an array return.
	const [has, start, end] = view.get_selection_bounds()
	return has ? [start, end] : [-1, -1]
}

function cancelSelectionSettle(node: ElementNode) {
	if (node.selSettleSource != null) {
		GLib.source_remove(node.selSettleSource)
		node.selSettleSource = null
	}
}

// Two bounded checks after a controlled write: on X11 the drop/re-claim pair
// around GtkEntry.set_text can deliver an async SelectionClear that collapses
// the fresh selection ~10ms after the write (verified in-guest by the
// feasibility proof's sel-test repros). The +40ms check repairs it, +80ms
// confirms the repair held. Aborted by destroy, a superseding write, or an
// intervening real user edit so the driver never re-asserts over genuine
// input.
function scheduleSelectionSettle(
	node: ElementNode,
	view: GtkView,
	text: string,
	wantSel: boolean,
	wantS: number,
	wantE: number,
) {
	cancelSelectionSettle(node)
	const editsAtWrite = node.changeSeq
	const check = (attempt: number) => () => {
		node.selSettleSource = null
		if (node.destroyed) {
			return false
		}
		if (view.get_text() !== text || node.changeSeq !== editsAtWrite) {
			return false
		}
		const [has, s, e] = view.get_selection_bounds()
		const wantPos = wantSel ? null : wantS
		const intact = wantSel
			? has && s === wantS && e === wantE
			: !has && view.get_position() === wantPos
		if (!intact) {
			if (wantSel) {
				view.select_region(wantS, wantE)
			} else {
				view.set_position(wantPos!)
			}
		}
		if (attempt === 0) {
			node.selSettleSource = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 40, check(1))
		}
		return false
	}
	node.selSettleSource = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 40, check(0))
}

/** Suppress exactly the signal a controlled write echoes — the NS driver's
 *  `muted` pattern, generalized to per-signal tokens. All controlled writes
 *  mute the logical `change` event regardless of the underlying GTK signal. */
function controlledWrite(node: ElementNode, write: () => void) {
	node.muted.add('change')
	try {
		write()
	} finally {
		node.muted.delete('change')
	}
}

function writeEntryText(node: ElementNode, view: GtkView, value: unknown) {
	controlledWrite(node, () => {
		const text = String(value ?? '')
		// Skip identical-text echoes: set_text during an in-progress user
		// action makes GTK warn and churns PRIMARY selection ownership for no
		// state change.
		if (view.get_text() === text) {
			return
		}
		// Preserve selection AND collapsed cursor across a controlled write —
		// GtkEntry.set_text otherwise parks the cursor at 0 and real input
		// prepends.
		const pos = view.get_position()
		const [selStart, selEnd] = selectionBounds(view)
		view.set_text(text)
		const wantSel = selStart >= 0 && selEnd <= text.length
		if (wantSel) {
			view.select_region(selStart, selEnd)
		} else {
			view.set_position(Math.min(pos, text.length))
		}
		scheduleSelectionSettle(
			node,
			view,
			text,
			wantSel,
			wantSel ? selStart : Math.min(pos, text.length),
			wantSel ? selEnd : Math.min(pos, text.length),
		)
	})
}

function setProp(node: ElementNode, name: string, value: unknown) {
	const view = node.view
	if (name === 'children' || name === 'key' || name === 'ref') {
		return
	}
	if (EVENT_PROP.test(name)) {
		warnEventProp(node, name)
		return // classified events arrive as `event` commands
	}
	if (name === 'id' || name === 'testID' || name === 'automationText') {
		// Widget names are the GTK-side queryable identifier (GTK inspector,
		// gtk_widget_get_name) — the identifier plumbing row of family J.
		view?.set_name(String(value ?? ''))
		return
	}
	if (value === undefined) {
		return
	}
	if (view === null) {
		if (name === 'value' || name === 'text') {
			node.text = String(value ?? '')
			syncText(nearestViewAncestor(node))
		}
		return
	}

	// Inside a Mason subtree the style channel owns layout vocabulary —
	// direct props hit a dead field. Warn once and consume the write.
	if (
		isMasonHostView(hostViewOf(node.container, node.parent)) &&
		MASON_CHILD_STYLE_ONLY_PROPS.has(name)
	) {
		warnStyleOnly(node, name)
		return
	}
	if (isMasonHostView(view) && MASON_CONTAINER_STYLE_ONLY_PROPS.has(name)) {
		warnStyleOnly(node, name)
		return
	}

	switch (name) {
		case 'className':
		case 'class':
			syncClasses(node, value)
			return
		case 'style': {
			const bag = styleBag(value)
			syncCss(node, bag)
			applyStyleExtras(node, view, bag)
			return
		}
		case 'visible':
			view.set_visible(value !== false)
			return
		case 'visibility':
			// 'hidden' and 'collapse' both unmap; GTK boxes skip invisible
			// children in allocation, so collapse needs no separate handling.
			view.set_visible(value === 'visible')
			return
		case 'opacity':
			view.set_opacity(Number(value))
			return
		case 'enabled':
		case 'isEnabled':
			view.set_sensitive(
				value !== false && (node.type !== 'textfield' || node.editableFlag !== false),
			)
			return
		case 'width':
		case 'height': {
			const [w, h] = view.get_size_request()
			view.set_size_request(
				name === 'width' ? dimension(value) : w,
				name === 'height' ? dimension(value) : h,
			)
			return
		}
		case 'horizontalAlignment':
		case 'halign': {
			const align = ALIGN[String(value)]
			if (align !== undefined) {
				view.set_halign(align)
			}
			return
		}
		case 'verticalAlignment':
		case 'valign': {
			const align = ALIGN[String(value)]
			if (align !== undefined) {
				view.set_valign(align)
			}
			return
		}
		case 'flexGrow':
			node.flexGrowValue = value
			syncExpand(node)
			return
		case 'alignSelf': {
			// Cross-axis self-alignment inside a box parent.
			const align = ALIGN[String(value)]
			const hostView = hostViewOf(node.container, node.parent)
			if (align === undefined || !(hostView instanceof Gtk.Box)) {
				return
			}
			if (hostView.orientation === Gtk.Orientation.HORIZONTAL) {
				view.set_valign(align)
			} else {
				view.set_halign(align)
			}
			return
		}
		// Layout-position props are recorded unconditionally — `create` applies
		// props before `insert` assigns the parent, so a parent-checked write
		// would drop mount-time positions. Insert/reattach reads them back.
		case 'x':
		case 'left':
			node.fixedX = Number(value)
			repositionFixedChild(node)
			return
		case 'y':
		case 'top':
			node.fixedY = Number(value)
			repositionFixedChild(node)
			return
		case 'row':
			node.gridRow = Number(value)
			repositionGridChild(node)
			return
		case 'col':
			node.gridCol = Number(value)
			repositionGridChild(node)
			return
		case 'rowSpan':
			node.gridRowSpan = Number(value)
			repositionGridChild(node)
			return
		case 'colSpan':
			node.gridColSpan = Number(value)
			repositionGridChild(node)
			return
		case 'accessibilityLabel': {
			// GTK4 exposes accessible names through GtkAccessible.update_property —
			// a varargs entry point GJS cannot reliably marshal; try it and warn
			// once instead of silently dropping the label.
			try {
				view.update_property?.(Gtk.AccessibleProperty.LABEL, String(value))
			} catch {
				warnOnce('accessibilityLabel', `<${node.type}> accessibilityLabel could not be applied — GtkAccessible.update_property is unavailable in this GTK`)
			}
			return
		}
		case 'accessibilityRole': {
			// accessible-role is a real Gtk.Widget property (GTK 4.0+).
			const role = typeof value === 'string' ? A11Y_ROLES[value] : undefined
			if (role !== undefined) {
				view.accessible_role = role
			}
			return
		}
		case 'tooltip':
		case 'tooltipText':
			view.set_tooltip_text(String(value ?? ''))
			return
	}

	switch (node.type) {
		case 'masonview':
			if (name === 'spacing' || name === 'gap' || name === 'rowGap' || name === 'columnGap') {
				view.spacing = Number(value)
			} else if (name === 'orientation' || name === 'flexDirection') {
				setOrientation(node, view, value)
			} else {
				warn(`<${node.type}> ignored prop ${name}`)
			}
			return
		case 'label':
			if (name === 'text' || name === 'value') {
				if (!node.textApplied) {
					view.label = String(value ?? '')
				}
			} else if (name === 'formattedText') {
				if (typeof value === 'string') {
					if (!node.textApplied) {
						view.label = value
					}
				} else {
					warn('<label> formattedText objects need Pango markup — not implemented yet')
				}
			} else if (name === 'maxLines') {
				// Gtk.Label `lines` bounds wrapped/ellipsized text.
				view.lines = Number(value)
			} else if (name === 'xalign' || name === 'textAlignment') {
				view.xalign =
					typeof value === 'number'
						? Math.max(0, Math.min(1, value))
						: value === 'center'
							? 0.5
							: value === 'right'
								? 1
								: 0
			} else if (name === 'textWrap' || name === 'whiteSpace') {
				view.wrap = value === true || value === 'normal'
			} else if (name === 'textOverflow') {
				// Pango.EllipsizeMode.END = 3
				view.ellipsize = value === 'ellipsis' ? 3 : 0
			} else if (name === 'selectable') {
				view.selectable = Boolean(value)
			} else {
				warn(`<label> ignored prop ${name}`)
			}
			return
		case 'button':
			if (name === 'text' || name === 'label' || name === 'title') {
				view.set_label(String(value ?? ''))
			} else if (name === 'formattedText') {
				if (typeof value === 'string') {
					view.set_label(value)
				} else {
					warn('<button> formattedText objects are not implemented yet')
				}
			} else if (name === 'textWrap') {
				// The default child is a Gtk.Label.
				const child = view.get_child?.()
				if (child) {
					child.wrap = Boolean(value)
				}
			} else {
				warn(`<button> ignored prop ${name}`)
			}
			return
		case 'textfield':
			if (name === 'value' || name === 'text') {
				writeEntryText(node, view, value)
			} else if (name === 'placeholder' || name === 'hint') {
				view.placeholder_text = String(value ?? '')
			} else if (name === 'secure') {
				view.visibility = value !== true
			} else if (name === 'editable') {
				// Gtk.Entry has no "editable" prop; combined with `enabled` into
				// sensitive so neither clobbers the other.
				node.editableFlag = value !== false
				view.sensitive =
					node.editableFlag !== false &&
					node.props.enabled !== false &&
					node.props.isEnabled !== false
			} else if (name === 'maxLength') {
				view.get_buffer?.().set_max_length?.(Number(value))
			} else if (name === 'keyboardType') {
				const purpose = INPUT_PURPOSES[String(value)]
				if (purpose !== undefined) {
					view.input_purpose = purpose
				}
			} else if (name === 'autocorrect') {
				// Gtk.InputHints.NO_SPELLCHECK = 2
				const flags = Number(view.input_hints ?? 0)
				view.input_hints = value === false ? flags | 2 : flags & ~2
			} else {
				warn(`<textfield> ignored prop ${name}`)
			}
			return
		case 'scrollview':
			if (name === 'orientation') {
				const horizontal = value === 'horizontal'
				view.hscrollbar_policy = Gtk.PolicyType.AUTOMATIC
				view.vscrollbar_policy = horizontal
					? Gtk.PolicyType.NEVER
					: Gtk.PolicyType.AUTOMATIC
			} else if (name === 'scrollBarIndicatorVisible') {
				// Gtk.PolicyType.NEVER hides the indicator on both axes.
				view.hscrollbar_policy = value === false ? Gtk.PolicyType.NEVER : Gtk.PolicyType.AUTOMATIC
				view.vscrollbar_policy = value === false ? Gtk.PolicyType.NEVER : Gtk.PolicyType.AUTOMATIC
			} else if (name === 'isScrollEnabled') {
				if (value === false) {
					view.hscrollbar_policy = Gtk.PolicyType.NEVER
					view.vscrollbar_policy = Gtk.PolicyType.NEVER
				} else {
					view.hscrollbar_policy = Gtk.PolicyType.AUTOMATIC
					view.vscrollbar_policy = Gtk.PolicyType.AUTOMATIC
				}
			} else {
				warn(`<scrollview> ignored prop ${name}`)
			}
			return
		case 'switch':
			if (name === 'checked' || name === 'value') {
				controlledWrite(node, () => {
					view.active = Boolean(value)
				})
			} else {
				warn(`<switch> ignored prop ${name}`)
			}
			return
		case 'slider':
			if (name === 'value') {
				controlledWrite(node, () => {
					view.set_value(Number(value))
				})
			} else if (name === 'minValue' || name === 'maxValue') {
				const lower = name === 'minValue' ? Number(value) : view.adjustment.lower
				const upper = name === 'maxValue' ? Number(value) : view.adjustment.upper
				view.set_range(lower, upper)
			} else {
				warn(`<slider> ignored prop ${name}`)
			}
			return
		case 'progress':
			if (name === 'value' || name === 'maxValue') {
				// node.props already holds the incoming bag during applyUpdate —
				// read both operands from it so a paired value+maxValue update
				// derives the fraction from the same generation. Shared
				// contract: maxValue defaults to 100; a nonpositive max
				// displays 0%.
				const raw = Number(node.props.value ?? 0)
				const max = Number(node.props.maxValue ?? 100)
				view.set_fraction(max > 0 ? Math.max(0, Math.min(1, raw / max)) : 0)
			} else {
				warn(`<progress> ignored prop ${name}`)
			}
			return
		case 'activityindicator':
			if (name === 'busy') {
				if (value) {
					view.start()
				} else {
					view.stop()
				}
			} else {
				warn(`<activityindicator> ignored prop ${name}`)
			}
			return
		default:
			warn(`<${node.type}> ignored prop ${name}`)
	}
}

function applyProps(node: ElementNode, props: PropBag) {
	for (const name of Object.keys(props)) {
		setProp(node, name, props[name])
	}
}

/** Explicit reset for a dropped prop. setProp skips `undefined`, so resets
 *  need their own path — every widget state a prop can write gets its
 *  documented default back here. */
function resetProp(node: ElementNode, name: string) {
	const view = node.view
	if (view === null) {
		if (name === 'value' || name === 'text') {
			node.text = ''
			syncText(nearestViewAncestor(node))
		}
		return
	}
	switch (name) {
		case 'className':
		case 'class':
			syncClasses(node, '')
			return
		case 'style':
			syncCss(node, null)
			applyStyleExtras(node, view, null)
			return
		case 'width':
		case 'height': {
			const [w, h] = view.get_size_request()
			view.set_size_request(name === 'width' ? -1 : w, name === 'height' ? -1 : h)
			return
		}
		case 'opacity':
			view.set_opacity(1)
			return
		case 'visible':
			view.set_visible(true)
			return
		case 'enabled':
		case 'isEnabled':
			view.set_sensitive(node.type !== 'textfield' || node.editableFlag !== false)
			return
		case 'visibility':
			view.set_visible(true)
			return
		case 'alignSelf':
			view.set_halign(Gtk.Align.FILL)
			view.set_valign(Gtk.Align.FILL)
			return
		case 'horizontalAlignment':
		case 'halign':
			view.set_halign(Gtk.Align.FILL)
			return
		case 'verticalAlignment':
		case 'valign':
			view.set_valign(Gtk.Align.FILL)
			return
		case 'flexGrow':
			node.flexGrowValue = undefined
			view.set_hexpand(false)
			view.set_vexpand(false)
			return
		case 'tooltip':
		case 'tooltipText':
			view.set_tooltip_text(null)
			return
		case 'accessibilityRole':
			// Gtk.AccessibleRole.AUTOMATIC = 0 — the widget default.
			view.accessible_role = 0
			return
		case 'accessibilityLabel':
			try {
				view.update_property?.(Gtk.AccessibleProperty.LABEL, '')
			} catch {
				// unmarshalable on this GTK — nothing was applied, nothing to reset
			}
			return
		case 'id':
		case 'testID':
		case 'automationText':
			view.set_name('')
			return
		case 'x':
		case 'left':
			node.fixedX = 0
			repositionFixedChild(node)
			return
		case 'y':
		case 'top':
			node.fixedY = 0
			repositionFixedChild(node)
			return
		case 'row':
			node.gridRow = null
			repositionGridChild(node)
			return
		case 'col':
			node.gridCol = null
			repositionGridChild(node)
			return
		case 'rowSpan':
			node.gridRowSpan = 1
			repositionGridChild(node)
			return
		case 'colSpan':
			node.gridColSpan = 1
			repositionGridChild(node)
			return
	}
	// Type-specific documented defaults.
	const defaults = RESET_DEFAULTS[node.type]
	if (defaults !== undefined && name in defaults) {
		// A dropped style-only prop needs no reset under the engine —
		// routing it through setProp would fire the deprecation warn.
		if (isMasonHostView(view) && MASON_CONTAINER_STYLE_ONLY_PROPS.has(name)) {
			return
		}
		setProp(node, name, defaults[name])
	}
}

/** Restore defaults for props the update dropped — the complete-bag update
 *  contract: a vanished key resets, it does not keep its stale value. Only
 *  keys that ever wrote widget state need a reset entry — ignored props hold
 *  nothing. */
function applyUpdate(node: ElementNode, props: PropBag) {
	const dropped = Object.keys(node.props).filter((name) => !(name in props))
	// Publish the incoming bag first: prop handlers that read node.props
	// (progress' value/maxValue pair, textfield's enabled/editable pair) must
	// see the same generation the update describes.
	node.props = { ...props }
	for (const name of dropped) {
		resetProp(node, name)
	}
	applyProps(node, props)
}

// ---------------------------------------------------------------------------
// Text folding — #text/span children of a label/button write the parent's
// label, matching the proven proof semantics.
// ---------------------------------------------------------------------------

function nearestViewAncestor(node: ElementNode | null): ElementNode | null {
	let cur = node?.parent ?? null
	while (cur !== null && cur.view === null) {
		cur = cur.parent
	}
	return cur
}

function syncText(anchor: ElementNode | null) {
	if (anchor === null || anchor.view === null) {
		return
	}
	if (!TEXT_HOSTS.has(anchor.type)) {
		return
	}
	let text = ''
	let found = false
	const collect = (node: ElementNode) => {
		for (const child of node.children) {
			if (child.view !== null) {
				continue
			}
			if (child.type === TEXT || child.type === 'span') {
				text += child.text
				found = true
			} else {
				collect(child)
			}
		}
	}
	collect(anchor)
	if (!found) {
		// Last text child left — the element's own text prop owns the label
		// again, or empty if it was never set.
		if (anchor.textApplied) {
			anchor.textApplied = false
			anchor.view.label = String(anchor.props.text ?? anchor.props.value ?? '')
		}
		return
	}
	anchor.textApplied = true
	anchor.view.label = text
}

// ---------------------------------------------------------------------------
// Attachment — view-bearing descendants of viewless nodes project into the
// nearest view ancestor; box/fixed order is child order.
// ---------------------------------------------------------------------------

/** View descendants of a node in tree order (the node itself if view-bearing). */
function viewDescendants(node: ElementNode, out: GtkView[] = []): GtkView[] {
	if (node.view !== null) {
		out.push(node.view)
		return out
	}
	for (const child of node.children) {
		viewDescendants(child, out)
	}
	return out
}

/** The host widget this node's children attach into. */
function hostViewOf(container: GtkContainer, parent: ElementNode | null): GtkView {
	let cur: ElementNode | null = parent
	while (cur !== null && cur.view === null) {
		cur = cur.parent
	}
	return cur === null ? container.host : cur.view!
}

/** Flattened view position of `node` within its effective parent: count of
 *  view-bearing descendants of preceding siblings. */
function viewIndexOf(container: GtkContainer, parent: ElementNode | null, node: ElementNode): number {
	const siblings = parent === null ? container.children : parent.children
	let index = 0
	for (const sibling of siblings) {
		if (sibling === node) {
			break
		}
		index += viewDescendants(sibling).length
	}
	return index
}

/** Index → the child widget currently at that view position, or null to append. */
function viewChildAt(parentView: GtkView, index: number): Gtk.Widget | null {
	let i = 0
	for (
		let child = parentView.get_first_child();
		child !== null;
		child = child.get_next_sibling()
	) {
		if (i === index) {
			return child
		}
		i++
	}
	return null
}

/** Insert one view into a parent widget at a flattened index. `node` is the
 *  logical child that owns the view (for placement props). */
function insertViewInto(parentView: GtkView, node: ElementNode, view: GtkView, index: number) {
	if (isMasonHostView(parentView)) {
		// Mason children parent directly on the host widget — the layout
		// manager assigns rects. Align/expand defaults must be the GTK
		// ones so nothing shrinks the engine's allocation.
		view.set_halign(Gtk.Align.FILL)
		view.set_valign(Gtk.Align.FILL)
		view.set_hexpand(false)
		view.set_vexpand(false)
		view.insert_before(parentView, viewChildAt(parentView, index))
		return
	}
	if (parentView instanceof Gtk.Box) {
		// GTK4 box order is child order. There is no insert-before, so prepend
		// for index 0 and insert after the previous sibling otherwise.
		if (index === 0) {
			parentView.prepend(view)
			return
		}
		const before = viewChildAt(parentView, index - 1)
		if (before !== null) {
			parentView.insert_child_after(view, before)
		} else {
			parentView.append(view)
		}
		return
	}

	if (parentView instanceof Gtk.Fixed) {
		const x = node.fixedX ?? 0
		const y = node.fixedY ?? 0
		// Gtk.Fixed z-order is child order (later siblings on top). put()
		// always appends — a mid-list insert must go through insert_before or
		// the moved child jumps to the top.
		const next = viewChildAt(parentView, index)
		if (next === null) {
			parentView.put(view, x, y)
		} else {
			view.insert_before(parentView, next)
			parentView.move(view, x, y)
		}
		return
	}

	if (parentView instanceof Gtk.Grid) {
		if (node.gridRow !== null || node.gridCol !== null) {
			parentView.attach(
				view,
				node.gridCol ?? 0,
				node.gridRow ?? 0,
				node.gridColSpan || 1,
				node.gridRowSpan || 1,
			)
		} else {
			// Auto-placement: append below the last attached child.
			// Gtk.PositionType.BOTTOM = 3
			let last: Gtk.Widget | null = null
			for (
				let child = parentView.get_first_child();
				child !== null;
				child = child.get_next_sibling()
			) {
				last = child
			}
			parentView.attach_next_to(view, last, 3, 1, 1)
		}
		return
	}

	throw new Error(
		`linux-gtk driver: ${parentView.constructor.name} cannot host children.`,
	)
}

function repositionFixedChild(node: ElementNode) {
	const parentView = node.parent?.view
	if (!(parentView instanceof Gtk.Fixed) || node.view === null) {
		return
	}
	if (node.view.get_parent() === parentView) {
		parentView.move(node.view, node.fixedX, node.fixedY)
	}
}

function repositionGridChild(node: ElementNode) {
	const parentView = node.parent?.view
	if (!(parentView instanceof Gtk.Grid) || node.view === null) {
		return
	}
	if (node.view.get_parent() === parentView) {
		parentView.remove(node.view)
	}
	parentView.attach(
		node.view,
		node.gridCol ?? 0,
		node.gridRow ?? 0,
		node.gridColSpan || 1,
		node.gridRowSpan || 1,
	)
}

function detachView(view: GtkView) {
	const parent = view.get_parent()
	if (parent === null) {
		return
	}
	if (parent instanceof Gtk.ScrolledWindow) {
		parent.set_child(null)
	} else {
		view.unparent()
	}
}

/** Detach every view descendant of `node` (and the node itself) from the
 *  widget tree, without touching logical child links. */
function detachViews(node: ElementNode) {
	for (const view of viewDescendants(node)) {
		detachView(view)
	}
}

/** Re-attach every view descendant of `node` in order into its effective
 *  parent view. */
function attachViews(container: GtkContainer, node: ElementNode) {
	const views = viewDescendants(node)
	if (views.length === 0) {
		return
	}
	const parentView = hostViewOf(container, node.parent)
	if (parentView instanceof Gtk.ScrolledWindow) {
		// Single child; only the first view descendant can attach.
		if (views.length > 1) {
			warn(
				'<scrollview> hosts a single view — additional children were dropped from the widget tree',
			)
		}
		parentView.set_child(views[0])
		return
	}
	let index = viewIndexOf(container, node.parent, node)
	for (const view of views) {
		insertViewInto(parentView, node, view, index++)
	}
}

function detach(container: GtkContainer, node: ElementNode) {
	const parent = node.parent
	const siblings = parent === null ? container.children : parent.children
	const index = siblings.indexOf(node)
	if (index !== -1) {
		siblings.splice(index, 1)
	}
	detachViews(node)
	if (node.view === null) {
		syncText(nearestViewAncestor(node))
	}
	node.parent = null
}

function insert(
	container: GtkContainer,
	parent: ElementNode | null,
	node: ElementNode,
	before: number | null,
) {
	detach(container, node)
	const siblings = parent === null ? container.children : parent.children
	const index = before === null ? -1 : siblings.findIndex((sibling) => sibling.id === before)
	if (index === -1) {
		siblings.push(node)
	} else {
		siblings.splice(index, 0, node)
	}
	node.parent = parent
	if (node.view === null) {
		attachViews(container, node)
		syncText(nearestViewAncestor(node))
		// flexGrow on view descendants was recorded before the parent
		// existed — resolve it now.
		syncExpandDeep(node)
		return
	}
	const parentView = hostViewOf(container, parent)
	if (parentView instanceof Gtk.ScrolledWindow) {
		const existing = parentView.get_child?.()
		if (existing !== null && existing !== undefined && existing !== node.view) {
			warn('<scrollview> hosts a single view — replacing its current child')
		}
		parentView.set_child(node.view)
		return
	}
	insertViewInto(parentView, node, node.view, viewIndexOf(container, parent, node))
	// A new child changes the host's measure — ask GTK to re-run the pass.
	if (isMasonHostView(parentView)) {
		queueMasonLayout(parentView)
	}
	// flexGrow was recorded before the parent existed — resolve it now.
	if (node.flexGrowValue !== undefined) {
		syncExpand(node)
	}
}

function resolveParent(container: GtkContainer, parent: UniversalHostParent): ElementNode | null {
	if (typeof parent === 'number') {
		return expect(container, parent)
	}
	if (parent !== null) {
		throw new Error('linux-gtk driver: portal targets are not supported yet.')
	}
	return null
}

// ---------------------------------------------------------------------------
// Events — universal `event` commands carry {id, type, listener}; dispatch
// goes through root.eventScope + root.dispatchEvent so callbacks run under
// their owner record.
// ---------------------------------------------------------------------------

function payloadFor(node: ElementNode, type: string): unknown {
	const view = node.view
	switch (type) {
		case 'change':
			if (view instanceof Gtk.Entry) {
				return { eventName: 'change', object: view, value: view.get_text() }
			}
			if (view instanceof Gtk.Switch) {
				return { eventName: 'change', object: view, value: view.active }
			}
			if (view instanceof Gtk.Scale) {
				return { eventName: 'change', object: view, value: view.get_value() }
			}
			return { eventName: 'change', object: view }
		case 'submit':
			return {
				eventName: 'submit',
				object: view,
				value: view instanceof Gtk.Entry ? view.get_text() : undefined,
			}
		case 'scroll': {
			const scrolled = view instanceof Gtk.ScrolledWindow ? view : null
			return {
				eventName: 'scroll',
				object: view,
				scrollX: scrolled?.hadjustment?.value ?? 0,
				scrollY: scrolled?.vadjustment?.value ?? 0,
			}
		}
		default:
			return { eventName: type, object: view }
	}
}

/** Connect one universal event type to GTK signals/controllers. */
function connectEvent(
	container: GtkContainer,
	node: ElementNode,
	view: GtkView,
	type: string,
	listener: UniversalEventListenerDescriptor,
): { connections: SignalConnection[]; controllers: any[] } {
	const handler = (..._args: any[]) => {
		if (node.muted.has(type)) {
			return
		}
		// Real (non-muted) change events mark a user edit so a pending
		// selection settle never re-asserts over genuine input.
		if (type === 'change') {
			node.changeSeq++
		}
		const root = container.root
		if (root === null) {
			return
		}
		const fire = () => {
			try {
				root.eventScope(listener.priority, () =>
					root.dispatchEvent(listener.id, payloadFor(node, type)),
				)
			} catch (error) {
				console.error('[linux-gtk] event handler failed', error)
			}
		}
		if (applyingDepth > 0) {
			Promise.resolve().then(fire)
		} else {
			fire()
		}
	}

	switch (type) {
		case 'tap': {
			if (view instanceof Gtk.Button) {
				return { connections: [{ emitter: view, signalId: view.connect('clicked', handler) }], controllers: [] }
			}
			const gesture = new Gtk.GestureClick()
			view.add_controller(gesture)
			return {
				connections: [{ emitter: gesture, signalId: gesture.connect('released', handler) }],
				controllers: [gesture],
			}
		}
		case 'doubletap': {
			const gesture = new Gtk.GestureClick()
			view.add_controller(gesture)
			return {
				connections: [
					{
						emitter: gesture,
						signalId: gesture.connect('pressed', (_g: any, nPress: number) => {
							if (nPress === 2) {
								handler()
							}
						}),
					},
				],
				controllers: [gesture],
			}
		}
		case 'longpress': {
			const gesture = new Gtk.GestureLongPress()
			view.add_controller(gesture)
			return {
				connections: [{ emitter: gesture, signalId: gesture.connect('pressed', handler) }],
				controllers: [gesture],
			}
		}
		case 'focus':
		case 'blur': {
			const controller = new Gtk.EventControllerFocus()
			view.add_controller(controller)
			return {
				connections: [
					{
						emitter: controller,
						signalId: controller.connect(type === 'focus' ? 'enter' : 'leave', handler),
					},
				],
				controllers: [controller],
			}
		}
		case 'change': {
			const signal =
				view instanceof Gtk.Switch
					? 'notify::active'
					: view instanceof Gtk.Scale
						? 'value-changed'
						: 'changed'
			return {
				connections: [{ emitter: view, signalId: view.connect(signal, handler) }],
				controllers: [],
			}
		}
		case 'submit':
			return {
				connections: [{ emitter: view, signalId: view.connect('activate', handler) }],
				controllers: [],
			}
		case 'loaded':
			return {
				connections: [{ emitter: view, signalId: view.connect('map', handler) }],
				controllers: [],
			}
		case 'unloaded':
			return {
				connections: [{ emitter: view, signalId: view.connect('unmap', handler) }],
				controllers: [],
			}
		case 'scroll': {
			if (!(view instanceof Gtk.ScrolledWindow)) {
				warn('onScroll on a non-scrollview element is not supported')
				return { connections: [], controllers: [] }
			}
			return {
				connections: [
					{ emitter: view.vadjustment, signalId: view.vadjustment.connect('value-changed', handler) },
					{ emitter: view.hadjustment, signalId: view.hadjustment.connect('value-changed', handler) },
				],
				controllers: [],
			}
		}
		default:
			return {
				connections: [{ emitter: view, signalId: view.connect(type, handler) }],
				controllers: [],
			}
	}
}

function setEvent(
	container: GtkContainer,
	node: ElementNode,
	type: string,
	listener: UniversalEventListenerDescriptor | null,
) {
	const view = node.view
	if (view === null) {
		return
	}
	const previous = node.listeners.get(type)
	if (previous !== undefined) {
		for (const conn of previous) {
			conn.emitter.disconnect(conn.signalId)
		}
		node.listeners.delete(type)
	}
	// Controllers installed for this event type are released with it.
	const controllers = node.controllers.get(type)
	if (controllers !== undefined) {
		for (const controller of controllers) {
			view.remove_controller(controller)
		}
		node.controllers.delete(type)
	}
	if (listener === null) {
		return
	}

	let connections: SignalConnection[] = []
	let next: any[] = []
	try {
		const wired = connectEvent(container, node, view, type, listener)
		connections = wired.connections
		next = wired.controllers
	} catch (error) {
		// A signal name the widget class lacks throws out of connect() —
		// dropping the listener must not abort the surrounding batch. Nothing
		// is recorded yet; an added-but-unconnected controller is inert.
		warn(`<${node.type}> could not wire event "${type}": ${(error as Error)?.message ?? error}`)
		return
	}
	if (connections.length) {
		node.listeners.set(type, connections)
	}
	if (next.length) {
		node.controllers.set(type, next)
	}
}

function disposeListeners(node: ElementNode) {
	const view = node.view
	if (view !== null) {
		for (const connections of node.listeners.values()) {
			for (const conn of connections) {
				conn.emitter.disconnect(conn.signalId)
			}
		}
		for (const controllers of node.controllers.values()) {
			for (const controller of controllers) {
				view.remove_controller(controller)
			}
		}
	}
	node.listeners.clear()
	node.controllers.clear()
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

function expect(container: GtkContainer, id: number): ElementNode {
	const node = container.nodes.get(id)
	if (node === undefined) {
		throw new Error(`linux-gtk driver: unknown host ${id}.`)
	}
	return node
}

function createNode(container: GtkContainer, id: number, type: string, props: PropBag): ElementNode {
	const view = VIEWLESS.has(type) ? null : instantiate(type)
	const node: ElementNode = {
		id,
		type,
		view,
		text: '',
		props,
		parent: null,
		children: [],
		container,
		listeners: new Map(),
		controllers: new Map(),
		muted: new Set(),
		changeSeq: 0,
		selSettleSource: null,
		fixedX: 0,
		fixedY: 0,
		gridRow: null,
		gridCol: null,
		gridRowSpan: 1,
		gridColSpan: 1,
		flexGrowValue: undefined,
		editableFlag: undefined,
		cssClass: null,
		cssProvider: null,
		cssSignature: '',
		classes: [],
		textApplied: false,
		destroyed: false,
	}
	if (view !== null && isMasonView(view)) {
		// The layout manager's vfuncs resolve the logical node from the
		// widget — link them before props land so style writes find it.
		bindMasonView(view, node)
	}
	applyProps(node, props)
	return node
}

function applyCommand(container: GtkContainer, command: UniversalHostCommand) {
	switch (command.op) {
		case 'create':
			container.nodes.set(
				command.id,
				createNode(container, command.id, command.type, command.props),
			)
			return
		case 'update':
			applyUpdate(expect(container, command.id), command.props)
			return
		case 'insert':
		case 'move':
			insert(
				container,
				resolveParent(container, command.parent),
				expect(container, command.id),
				command.before,
			)
			return
		case 'remove':
			detach(container, expect(container, command.id))
			return
		case 'destroy': {
			const node = container.nodes.get(command.id)
			if (node === undefined) {
				return
			}
			node.destroyed = true
			cancelSelectionSettle(node)
			disposeListeners(node)
			releaseMasonNodes(node)
			// Batches normally remove before destroy — detach defensively so a
			// destroy without a preceding remove can't leave a parented view or
			// a stale logical child behind.
			if (node.parent !== null || container.children.includes(node)) {
				detach(container, node)
			}
			if (node.view !== null && node.cssProvider !== null) {
				node.view.get_style_context().remove_provider(node.cssProvider)
			}
			container.nodes.delete(command.id)
			return
		}
		case 'event':
			setEvent(container, expect(container, command.id), command.type, command.listener)
			return
		case 'visibility': {
			const view = expect(container, command.id).view
			if (view !== null) {
				view.set_visible(command.state === 'visible')
			}
			return
		}
		case 'recreate': {
			// Rebuild the widget in place: keep logical identity and children,
			// swap the view at the same slot, then re-parent the children.
			const node = expect(container, command.id)
			disposeListeners(node)
			node.muted.clear()
			detachViews(node)
			releaseMasonNodes(node)
			node.view = VIEWLESS.has(command.type) ? null : instantiate(command.type)
			node.type = command.type
			node.textApplied = false
			node.cssProvider = null
			node.cssClass = null
			node.cssSignature = ''
			node.classes = []
			node.appliedWidth = undefined
			node.appliedHeight = undefined
			node.appliedOpacity = undefined
			node.props = command.props
			if (node.view !== null && isMasonHostView(node.view)) {
				bindMasonView(node.view, node)
			}
			applyProps(node, command.props)
			if (node.view !== null) {
				const parentView = hostViewOf(container, node.parent)
				if (parentView instanceof Gtk.ScrolledWindow) {
					parentView.set_child(node.view)
				} else {
					insertViewInto(parentView, node, node.view, viewIndexOf(container, node.parent, node))
				}
				// Children ride inside the view — re-attach them into the new one.
				for (const child of node.children) {
					detachViews(child)
					attachViews(container, child)
				}
				syncExpandDeep(node)
			} else {
				attachViews(container, node)
				syncText(nearestViewAncestor(node))
				syncExpandDeep(node)
			}
			return
		}
		case 'ensure-public-instance':
			// Public instances are the widgets themselves — already materialized.
			return
		case 'lifecycle':
		case 'local-callback':
			// The driver declares no lifecycles/localCallbacks capabilities, so
			// the core never emits these with a listener; a null-listener form
			// may still arrive in teardown batches.
			return
		default:
			warn(`unhandled host command ${(command as { op: string }).op}`)
	}
}

export const gtkDriver: UniversalHostDriver<GtkContainer, GtkView | ElementNode | null> = {
	id: GTK_RENDERER_ID,
	capabilities: { text: 'host', visibility: true },
	events: {
		classify(name: string) {
			const definition = EVENT_PROP_TYPE[name]
			return definition === undefined ? null : definition
		},
	},
	prepareBatch(container: GtkContainer, batch: UniversalHostBatch) {
		// Reject deterministic failures before any command mutates — a
		// partially applied batch cannot be rolled back once apply() commits.
		if (batch.renderer !== GTK_RENDERER_ID) {
			throw new Error(
				`linux-gtk driver: batch renderer ${JSON.stringify(batch.renderer)} does not match.`,
			)
		}
		return {
			apply() {
				applyingDepth++
				try {
					for (const command of batch.commands) {
						try {
							applyCommand(container, command)
						} catch (error) {
							console.error(
								`[linux-gtk] command ${command.op} failed for <${
									(command as { type?: string }).type ?? '?'
								}> id=${'id' in command ? command.id : '?'}`,
								error,
							)
							throw error
						}
					}
				} finally {
					applyingDepth--
				}
			},
			abort() {},
		}
	},
	getPublicInstance(container: GtkContainer, id: number) {
		const node = container.nodes.get(id)
		if (node === undefined) {
			return null
		}
		// Viewless nodes resolve to their logical handle — refs must not
		// observe a synthesized widget that was never created.
		return node.view ?? node
	},
}

export function createGtkContainer(host: GtkView): GtkContainer {
	return { host, nodes: new Map(), children: [], root: null }
}

export interface GtkRootOptions extends UniversalRootOptions<GtkContainer> {}

export function createGtkRoot(host: GtkView, options: GtkRootOptions = {}) {
	const container = createGtkContainer(host)
	const root = createUniversalRoot(container, gtkDriver, {
		// GJS has no queueMicrotask — the universal runtime requires a
		// scheduler bridge; Promise resolution is the proven path (feasibility
		// evidence: idle/timeout ordering held at p95 1.4–1.7ms).
		scheduleMicrotask: (callback: () => void) => {
			Promise.resolve().then(callback)
		},
		onUncaughtError: (error: unknown) => {
			console.error('[linux-gtk] uncaught error', error)
		},
		...options,
	})
	container.root = root
	return { root, container }
}

export * from 'octane/universal/native'
