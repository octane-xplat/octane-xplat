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
	MASON_STYLE_KEYS,
} from './mason.js'

import {
	computeCascade,
	INHERITED_CSS_PROPERTIES,
	onStylesheetsChanged,
	refreshMediaQueries,
	sampleKeyframeAnimation,
	setStyleEnvironment,
	stylesheetPseudoClasses,
	stylesheetScope,
	type CssHostNode,
	type KeyframeAnimationInfo,
	type SampledValues,
} from '@octane-xplat/css-engine'

import { bindPublicInstance } from './public-instance.js'

import { CSS_PROPS, gtkStyleCss } from './style-css.js'
import { resolveTransform } from './transform-style.js'
import { createUniversalRoot } from 'octane/universal/native'
import type {
	UniversalEventListenerDescriptor,
	UniversalHostBatch,
	UniversalHostCommand,
	UniversalHostDriver,
	UniversalHostParent,
	UniversalRootOptions,
} from 'octane/universal/native'

import type { GtkRoot } from './root-types.js'
export type { GtkComponent, GtkRoot } from './root-types.js'

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
	/** Selector-engine adapter fields — the vendored NS engine matches on
	 *  the node directly (same contract as the macOS renderer). */
	cssType: string
	cssClasses: Set<string>
	cssPseudoClasses: Set<string>
	cssBaseClasses: Set<string>
	cssId: string | undefined
	computedStyle: PropBag | undefined
	computedCustomProps: Map<string, string>
	cssOriginKeys?: Set<string>
	inheritedOnlyKeys?: Set<string>
	cascadeInline?: PropBag
	appliedStyle?: PropBag
	/** Set when the node's own selector inputs changed (class, id,
	 *  pseudo-class, insertion, stylesheet) — NS `updateDynamicState`, which
	 *  restarts the node's keyframe animations. Inline-style restyles and
	 *  descendants of a changed node leave it unset; those restart only when
	 *  their matched animations change. */
	cssMatchDirty?: boolean
	/** Keyframe animations playing (or holding a forwards fill) on this node. */
	cssAnimation?: CssAnimationPlayback
	/** Keyframe overlay — NS's `keyframe:` style layer, above every other
	 *  source including inline style. */
	animatedStyle?: PropBag
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
	root: GtkRoot | null
	/** Style restyle queue — flushed at batch end, or on one microtask
	 *  outside a batch (GJS has no queueMicrotask). */
	cssDirty?: Set<ElementNode>
	cssFlushQueued?: boolean
	inBatch?: boolean
	/** Resize watch on the root Gtk.Window (media/orientation re-eval). */
	windowSignalIds?: number[]
	rootSignalId?: number
	window?: Gtk.Window
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
	onPan: { type: 'pan', priority: 'continuous' },
	onSwipe: { type: 'swipe', priority: 'discrete' },
	onTouch: { type: 'touch', priority: 'discrete' },
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
			return new Gtk.ScrolledWindow({
				hscrollbar_policy: Gtk.PolicyType.NEVER,
				vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
			})
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
// Styles — the effective style bag (inline + stylesheet cascade) maps onto
// per-widget Gtk.CssProvider rules plus direct widget properties; removed
// keys reset, never go stale. The property table and rule text live in
// style-css.ts (GI-free, Node-testable); the provider plumbing stays here.
// ---------------------------------------------------------------------------

// `~/x.png` in background-image resolves against the bundled app.js's
// directory — import.meta.url *is* the app.js URL at runtime.
const GTK_STYLE_OPTIONS = {
	resolveUrl: (rel: string): string => {
		const base = String(import.meta.url ?? '')
		const dir = base.slice(0, base.lastIndexOf('/') + 1)
		return dir + rel.split('/').map(encodeURIComponent).join('/')
	},
	onWarn: (message: string) => warnOnce(message, message),
}

function syncCss(node: ElementNode, style: PropBag | null | undefined) {
	const view = node.view
	if (view === null) {
		return
	}

	// Mason children carry their transform on the allocation (src/mason.ts);
	// everything else gets GTK CSS `transform`, % resolved against the
	// current size (re-resolved on the next restyle, not on every resize).
	const options = isMasonChild(node)
		? GTK_STYLE_OPTIONS
		: { ...GTK_STYLE_OPTIONS, transformBox: { width: view.get_width(), height: view.get_height() } }
	const css = gtkStyleCss(`.xplat-n${node.id}`, style, node.type, options)
	if (css === node.cssSignature) {
		return
	}
	node.cssSignature = css

	// Providers attach per-widget. Internal subnodes do NOT inherit the
	// widget's context provider (GTK 4.24: `slider`, `trough > highlight`,
	// `placeholder` stay unstyled otherwise) — for controls whose rules
	// target them, the same provider goes on every internal descendant's
	// context. Selectors still match the full node path (.xplat-n<id>
	// subnode), so scoping stays per-node. Display-level providers were
	// measured O(N²) on restyle and are not used.
	if (css === '') {
		if (node.cssProvider !== null) {
			for (const target of node.cssProviderTargets ?? [view]) {
				target.get_style_context().remove_provider(node.cssProvider)
			}

			node.cssProvider = null
			node.cssProviderTargets = undefined
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
	if (node.cssProvider === null) {
		node.cssProvider = new Gtk.CssProvider()
		try {
			// Malformed declarations surface through the provider's error
			// signal — warn once per message instead of failing the apply.
			node.cssProvider.connect('parsing-error', (_provider: any, _section: any, error: any) => {
				warnOnce(
					'css-parse:' + String(error?.message ?? error),
					`[linux-gtk-css] ${error?.message ?? error}`,
				)
			})
		} catch {
			// Older GTK revisions lack the signal — load errors stay silent.
		}

		const targets = [view]
		if (CONTROL_SUBNODE_TYPES.has(node.type)) {
			for (const child of internalDescendants(view)) {
				targets.push(child)
			}
		}

		for (const target of targets) {
			target
				.get_style_context()
				.add_provider(node.cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
		}

		node.cssProviderTargets = targets
	}
	node.cssProvider?.load_from_string(css)
}

// Controls whose generated rules address internal subnodes — the same set
// style-css.ts's CONTROL_SUBNODES covers, plus textfield's `placeholder`.
// These leaf controls have no Octane-managed children, so walking internal
// descendants is safe.
const CONTROL_SUBNODE_TYPES: ReadonlySet<string> = new Set([
	'switch',
	'slider',
	'progress',
	'textfield',
])

function internalDescendants(view: GtkView, out: GtkView[] = []): GtkView[] {
	for (let child = view.get_first_child?.(); child; child = child.get_next_sibling?.()) {
		out.push(child)
		internalDescendants(child, out)
	}
	return out
}

/** clsx-style ClassValue → flat class-name list (the shared contract's
 *  className composition). */
function classList(value: unknown, out: string[] = []): string[] {
	if (typeof value === 'string') {
		out.push(...value.split(/\s+/).filter(Boolean))
	} else if (typeof value === 'number' && value) {
		out.push(String(value))
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

// ---- CSS cascade -----------------------------------------------------------

// The vendored NS selector engine (shared with the macOS renderer through
// @octane-xplat/css-engine) matches against `node` directly: cssType
// is the element type, cssClasses come from the className prop plus the
// ambient root classes, cssPseudoClasses from wired state. User class names
// are never forwarded onto GTK widgets — GTK's default theme ships classes
// like .card/.title/.error that would silently style app classes of the same
// name; computed styles reach the widget only through the per-node
// `xplat-n<id>` provider in syncCss.

/** CSS-visible element children — text nodes (#text/span/formattedstring)
 *  fold into their host's text and carry no style of their own; viewless
 *  containers (contentview/proxyviewcontainer/rootlayout) DO participate so
 *  inheritance and custom props flow through them. */
const CSS_INERT_TYPES: ReadonlySet<string> = new Set([TEXT, 'span', 'formattedstring'])

function cssChildren(node: ElementNode): ElementNode[] {
	return node.children.filter((child) => !CSS_INERT_TYPES.has(child.type))
}

/** Root container top-level nodes carry the NS ambient classes:
 *  ns-root, ns-gtk, ns-light|ns-dark. */
function isCssRootNode(node: ElementNode): boolean {
	return node.parent === null
}

function gtkSettings(): any {
	try {
		return (Gtk.Settings as any)?.get_default?.() ?? null
	} catch {
		return null
	}
}

/** Color scheme for the ns-light/ns-dark root classes and the
 *  prefers-color-scheme media feature. GTK 4.20+ exposes
 *  gtk-interface-color-scheme; older themes fall back to
 *  prefer-dark-theme and a -dark theme-name suffix. */
function cssSchemeName(): string {
	const settings = gtkSettings()
	if (settings) {
		try {
			if ((Gtk as any).InterfaceColorScheme !== undefined) {
				const scheme = settings.gtk_interface_color_scheme
				if (scheme === (Gtk as any).InterfaceColorScheme.DARK) {
					return 'dark'
				}

				if (scheme === (Gtk as any).InterfaceColorScheme.LIGHT) {
					return 'light'
				}
			}
		} catch {
			// gtk-interface-color-scheme absent on GTK < 4.20.
		}

		try {
			if (settings.gtk_application_prefer_dark_theme === true) {
				return 'dark'
			}

			if (/-dark$/i.test(String(settings.gtk_theme_name ?? ''))) {
				return 'dark'
			}
		} catch {
			// Settings properties unreadable — default below.
		}
	}
	return 'light'
}

// Per-container dirty sets — flushed top-down at batch end, or coalesced
// onto one microtask outside a batch (appearance change, registerStylesheet).
function markStyleDirty(node: ElementNode, subtree = false, matchChanged = true) {
	const container = node.container
	if (!container) {
		return
	}
	;(container.cssDirty ??= new Set()).add(node)
	if (matchChanged) {
		node.cssMatchDirty = true
	}
	if (subtree) {
		for (const child of cssChildren(node)) {
			markStyleDirty(child, true, false)
		}
	}
	if (!container.inBatch && !container.cssFlushQueued) {
		container.cssFlushQueued = true
		Promise.resolve().then(() => {
			container.cssFlushQueued = false
			if (!container.inBatch) {
				flushStyleDirty(container)
			}
		})
	}
}

function flushStyleDirty(container: GtkContainer) {
	const dirty = container.cssDirty
	container.cssDirty = undefined
	if (!dirty?.size) {
		return
	}
	// Top-down: parents must compute before children that inherit from them.
	const nodes = [...dirty].sort((a, b) => cssDepth(a) - cssDepth(b))
	for (const node of nodes) {
		// Dead nodes (destroyed/detached before the flush) skip the restyle.
		if (!container.nodes.has(node.id)) {
			continue
		}

		restyleNode(node)
	}
	// No explicit layout pass — GTK coalesces queue_resize on its own.
}

function cssDepth(node: ElementNode): number {
	let depth = 0
	for (let p = node.parent; p; p = p.parent) {
		depth++
	}
	return depth
}

function shallowEqualStyle(a: PropBag, b: PropBag) {
	const keys = Object.keys(a)
	return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

/** Recompute one node's effective style and apply it. Caller guarantees the
 *  parent is already styled (top-down flush order). */
function restyleNode(node: ElementNode) {
	refreshCssClasses(node)
	const {
		style: cascadeStyle,
		customProps,
		cssKeys,
		inheritedKeys,
		animations,
	} = computeCascade(node as unknown as CssHostNode, stylesheetScope(), { borderLonghands: true })
	// Imperative numeric refs are local style values: above authored inline
	// styles and below CSS keyframe samples. Never mutate the frozen props bag.
	const style = { ...cascadeStyle, ...node.localStyle }
	for (const key of Object.keys(node.localStyle ?? {})) inheritedKeys.delete(key)

	node.cssOriginKeys = cssKeys
	node.inheritedOnlyKeys = inheritedKeys
	const prevStyle = node.computedStyle ?? {}
	const prevCustom = node.computedCustomProps ?? new Map()
	node.computedStyle = style
	node.computedCustomProps = customProps

	const customChanged =
		prevCustom.size !== customProps.size ||
		[...customProps].some(([k, v]) => prevCustom.get(k) !== v)
	let inheritedChanged = false
	for (const prop of INHERITED_CSS_PROPERTIES) {
		const camel = prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
		if (prevStyle[camel] !== style[camel]) {
			inheritedChanged = true
			break
		}
	}

	// NS updateDynamicState: stop the node's keyframe animations (dropping
	// the keyframe layer), apply the new values, then play what now matches.
	const playable = animations.filter((info) => info.keyframes?.length)
	const replay =
		node.cssMatchDirty === true || !sameAnimations(node.cssAnimation?.infos ?? [], playable)
	node.cssMatchDirty = false
	const droppedOverlay = replay && cancelKeyframeAnimations(node)

	// Unchanged effective styles skip the native apply: most restyles (class
	// or sibling marks, ancestor cascades) resolve to the same bag.
	if (droppedOverlay || !shallowEqualStyle(prevStyle, style) || !node.appliedStyle) {
		applyStyle(node, style)
	}
	if (replay && playable.length > 0) {
		playKeyframeAnimations(node, playable)
	}

	// Only cascade to children when values they could inherit moved.
	if (customChanged || inheritedChanged) {
		for (const child of cssChildren(node)) {
			restyleNode(child)
		}
	}
}

// ---- Keyframe animations ---------------------------------------------------
// NS CssState.playKeyframeAnimations over the shared sampler: every matched
// `animation` plays from its rule's start on each selector re-match, later
// animations override earlier ones per property, and the overlay sits above
// the computed style. One shared ~60 Hz GLib timer drives every playing node
// (it runs unmapped too, so headless tests observe frames).

interface CssAnimationPlayback {
	infos: KeyframeAnimationInfo[]
	startMs: number
	base: Partial<SampledValues>
}

const ANIMATION_FRAME_MS = 16
/** Nodes holding a playback (playing or forwards-filled) — detach walks
 *  only when this is non-empty. */
const animatedNodes = new Set<ElementNode>()
const playingNodes = new Set<ElementNode>()
let animationTimer: number | null = null

function nowMs(): number {
	return GLib.get_monotonic_time() / 1000
}

/** Values a property animates from when no earlier keyframe declares it —
 *  the node's current (pre-animation) computed value. */
function animationBase(node: ElementNode): Partial<SampledValues> {
	const style = node.computedStyle ?? {}
	const view = node.view
	const parts = resolveTransform(style)
	const opacity = Number(style.opacity ?? node.props.opacity)
	const width = typeof style.width === 'number' ? style.width : (view?.get_width() ?? 0)
	const height = typeof style.height === 'number' ? style.height : (view?.get_height() ?? 0)
	return {
		opacity: Number.isFinite(opacity) ? opacity : 1,
		backgroundColor:
			typeof style.backgroundColor === 'string' ? style.backgroundColor : 'rgba(0,0,0,0)',
		translateX: parts?.translateX ?? 0,
		translateY: parts?.translateY ?? 0,
		scaleX: parts?.scaleX ?? 1,
		scaleY: parts?.scaleY ?? 1,
		rotate: parts?.rotate ?? 0,
		rotateX: parts?.rotateX ?? 0,
		rotateY: parts?.rotateY ?? 0,
		width,
		height,
	}
}

function sameAnimations(a: KeyframeAnimationInfo[], b: KeyframeAnimationInfo[]): boolean {
	return a.length === b.length && a.every((info, i) => info === b[i])
}

function playKeyframeAnimations(node: ElementNode, infos: KeyframeAnimationInfo[]) {
	if (node.view === null) {
		return
	}
	node.cssAnimation = { infos, startMs: nowMs(), base: animationBase(node) }
	animatedNodes.add(node)
	// Segment 0 lands synchronously, like NS `animate(view, 0)` at play.
	if (advanceKeyframeAnimation(node, node.cssAnimation.startMs)) {
		playingNodes.add(node)
		animationTimer ??= GLib.timeout_add(
			GLib.PRIORITY_DEFAULT,
			ANIMATION_FRAME_MS,
			tickKeyframeAnimations,
		)
	}
}

function tickKeyframeAnimations(): boolean {
	const now = nowMs()
	for (const node of playingNodes) {
		if (!advanceKeyframeAnimation(node, now)) {
			playingNodes.delete(node)
		}
	}
	if (playingNodes.size === 0) {
		animationTimer = null
		return GLib.SOURCE_REMOVE
	}
	return GLib.SOURCE_CONTINUE
}

/** Writes one frame; false once every animation on the node has finished. */
function advanceKeyframeAnimation(node: ElementNode, now: number): boolean {
	const play = node.cssAnimation
	const view = node.view
	if (play === undefined || view === null || node.destroyed) {
		return false
	}
	const box = { width: view.get_width(), height: view.get_height() }
	const overlay: PropBag = {}
	let done = true
	for (const info of play.infos) {
		const sample = sampleKeyframeAnimation(info, now - play.startMs, { base: play.base, box })
		Object.assign(overlay, sample.values)
		done &&= sample.done
	}
	const prev = node.animatedStyle
	node.animatedStyle = Object.keys(overlay).length > 0 ? overlay : undefined
	if (prev !== undefined || node.animatedStyle !== undefined) {
		applyAnimationFrame(node, view, prev)
	}
	return !done
}

/** Per-frame write. Size keys go through the full style apply (they feed
 *  set_size_request / the Mason style dict); everything else touches only
 *  the CSS provider, opacity, and — for Mason children — the parent's
 *  allocation, which re-applies the child Gsk.Transform. */
function applyAnimationFrame(node: ElementNode, view: GtkView, prev: PropBag | undefined) {
	const overlay = node.animatedStyle ?? {}
	const sized = ['width', 'height'].some(
		(key) => key in overlay || (prev !== undefined && key in prev),
	)
	if (sized || !node.appliedStyle) {
		applyStyle(node, node.computedStyle ?? {})
		return
	}
	const merged = { ...node.computedStyle, ...overlay }
	node.appliedStyle = merged
	syncCss(node, merged)
	const opacity = merged.opacity ?? node.props.opacity
	view.set_opacity(opacity != null ? Number(opacity) : 1)
	node.appliedOpacity = opacity
	if (isMasonChild(node)) {
		view.get_parent?.()?.queue_allocate?.()
	}
}

/** Stops the node's animations and drops the keyframe layer without
 *  re-applying; returns true when an overlay was showing. */
function cancelKeyframeAnimations(node: ElementNode): boolean {
	if (node.cssAnimation === undefined) {
		return false
	}
	node.cssAnimation = undefined
	animatedNodes.delete(node)
	playingNodes.delete(node)
	const hadOverlay = node.animatedStyle !== undefined
	node.animatedStyle = undefined
	return hadOverlay
}

/** NS onUnloaded: removal from the tree stops the subtree's animations and
 *  restores the underlying style. */
function stopSubtreeAnimations(node: ElementNode) {
	if (animatedNodes.size === 0) {
		return
	}
	if (cancelKeyframeAnimations(node) && !node.destroyed) {
		applyStyle(node, node.computedStyle ?? {})
	}
	for (const child of node.children) {
		stopSubtreeAnimations(child)
	}
}

function warnUnsupportedCssProp(node: ElementNode, name: string) {
	warnOnce(
		'css-prop:' + name,
		'[linux-gtk-css] ignored unsupported property ' + name + ' (on <' + node.type + '>)',
	)
}

/** Style keys a computed bag can carry that have a real consumer: the GTK
 *  CSS table, the direct-widget extras below, the Mason dict, and the
 *  Gtk.Box emulation. */
const SUPPORTED_STYLE_KEYS: ReadonlySet<string> = new Set([
	...Object.keys(CSS_PROPS),
	'width',
	'height',
	'opacity',
	'textAlign',
	'placeholderColor',
	'letterSpacing',
	'textStroke',
	'direction',
	'visibility',
	'whiteSpace',
	'textOverflow',
	'maxLines',
	'horizontalAlign',
	'verticalAlign',
	// Transform / paint keys (src/transform-style.ts); zIndex and clipPath
	// warn separately outside masonview.
	'zIndex',
	'clipPath',
	'transform',
	'translateX',
	'translateY',
	'scaleX',
	'scaleY',
	'rotate',
	'rotateX',
	'rotateY',
	'rotatex',
	'rotatey',
	'perspective',
	...MASON_STYLE_KEYS,
	// Gtk.Box / Gtk.Fixed / Gtk.Grid emulation keys.
	'flexGrow',
	'alignSelf',
	'justifySelf',
	'left',
	'top',
	'gridRow',
	'gridColumn',
	'flexDirection',
	'gap',
	'rowGap',
	'columnGap',
])

function warnUnsupportedCssProps(node: ElementNode, style: PropBag) {
	for (const name of Object.keys(style)) {
		if (style[name] == null || SUPPORTED_STYLE_KEYS.has(name)) {
			continue
		}

		// Inherited values, and inheritable properties a stylesheet declares
		// on a container for its descendants, are not unsupported here.
		if (
			node.inheritedOnlyKeys?.has(name) ||
			(node.cssOriginKeys?.has(name) &&
				INHERITED_CSS_PROPERTIES.has(name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())))
		) {
			continue
		}

		// Only CSS-origin keys warn — inline-only unsupported keys stay
		// silent (unchanged pre-cascade behavior).
		if (node.cssOriginKeys?.has(name)) {
			warnUnsupportedCssProp(node, name)
		}
	}
}

function setNodeInlineStyle(node: ElementNode, value: any) {
	const prev = node.cascadeInline
	// The create command stores the runtime's own props bag, which the
	// compiled component path can freeze — never mutate it in place.
	node.props = { ...node.props, style: value }
	node.cascadeInline = value
	// Subtree restyle only when an inherited or custom-property input changed.
	const inheritedOrCustom = (bag: any): boolean =>
		!!bag &&
		Object.keys(bag).some(
			(k) =>
				k.startsWith('--') ||
				INHERITED_CSS_PROPERTIES.has(k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())),
		)
	const subtree = Boolean(inheritedOrCustom(prev)) || Boolean(inheritedOrCustom(value))
	markStyleDirty(node, subtree, false)
}

/** className now only feeds the selector engine (cssClasses) and marks the
 *  subtree for restyle — it is never forwarded to the widget's GTK css
 *  classes (see the cascade note above). */
function applyClassName(node: ElementNode, value: unknown) {
	const next = new Set(classList(value))
	// Updates carry the full prop bag — an unchanged className is not a
	// selector change and must not restart keyframe animations.
	const prev = node.cssBaseClasses
	if (prev && prev.size === next.size && [...next].every((name) => prev.has(name))) {
		return
	}
	node.cssBaseClasses = next
	refreshCssClasses(node)
	markStyleDirty(node, true)
}

/** Largest live host's size — the same source setStyleEnvironment uses,
 *  shared with the orientation root classes. */
function envSize(): { width: number; height: number } {
	let width = 0
	let height = 0
	for (const container of liveGtkContainers) {
		let w = container.host.get_width?.() ?? 0
		let h = container.host.get_height?.() ?? 0
		if (w === 0 || h === 0) {
			const root = container.host.get_root?.()
			w = w || (root?.default_width ?? 0)
			h = h || (root?.default_height ?? 0)
		}

		if (w > width) {
			width = w
		}

		if (h > height) {
			height = h
		}
	}
	return { width, height }
}

function cssOrientation(): string {
	const { width, height } = envSize()
	return width >= height ? 'ns-landscape' : 'ns-portrait'
}

function cssDirection(): string {
	return Gtk.Widget.get_default_direction?.() === Gtk.TextDirection.RTL ? 'ns-rtl' : 'ns-ltr'
}

/** cssClasses = className tokens ∪ ambient root classes on every
 *  parent-less node. Recomputed on insert/remove/appearance via
 *  markStyleDirty → restyleNode → refreshCssClasses. */
function refreshCssClasses(node: ElementNode) {
	const set = new Set(node.cssBaseClasses ?? [])
	if (isCssRootNode(node)) {
		set.add('ns-root')
		set.add('ns-gtk')
		set.add(cssSchemeName() === 'dark' ? 'ns-dark' : 'ns-light')
		set.add(cssOrientation())
		set.add(cssDirection())
	}
	node.cssClasses = set
}

function setNodeId(node: ElementNode, value: any) {
	const next = value == null ? undefined : String(value)
	if (next === node.cssId) {
		return
	}
	node.cssId = next
	markStyleDirty(node, true)
}

function setPseudoClass(node: ElementNode, name: string, on: boolean) {
	const had = node.cssPseudoClasses.has(name)
	if (on === had) {
		return
	}
	if (on) {
		node.cssPseudoClasses.add(name)
	} else {
		node.cssPseudoClasses.delete(name)
	}
	// Only pseudo-classes some registered selector actually uses can
	// restyle — an unused state change must not flush a subtree.
	if (stylesheetPseudoClasses().has(name)) {
		markStyleDirty(node, true)
	}
}

// ---- Visual states -----------------------------------------------------------

// NS maps state-flags onto visual pseudo-classes: `normal` while no visual
// state is active; `highlighted`/`active`/`pressed` from ACTIVE; `focus`
// (FOCUS_WITHIN for entry — the inner Gtk.Text carries real focus);
// `checked` from the switch's `active` property. Desktop adds `hover`
// (PRELIGHT), `focus-visible` and `focus-within`.
const STATE_VISUAL: [number, string][] = [
	[Gtk.StateFlags.ACTIVE, 'highlighted'],
	[Gtk.StateFlags.ACTIVE, 'active'],
	[Gtk.StateFlags.ACTIVE, 'pressed'],
	[Gtk.StateFlags.PRELIGHT, 'hover'],
	[Gtk.StateFlags.FOCUS_WITHIN, 'focus-within'],
]

// Pseudo-classes that count as "another visual state" for :normal — NS's
// visual states only (view-common.js): highlighted/active/pressed, focus,
// checked, disabled. The desktop extras (hover, focus-visible,
// focus-within) do NOT cancel :normal.
const NORMAL_OFF = new Set(['highlighted', 'active', 'pressed', 'focus', 'checked', 'disabled'])

/** Recompute pseudo-classes from the widget's state flags (+switch active).
 *  Called from state-flags-changed, notify::active and once at mount. */
function syncPseudoState(node: ElementNode) {
	const view = node.view
	if (view === null) {
		return
	}
	let flags = 0
	try {
		flags = view.get_state_flags?.() ?? 0
	} catch {
		flags = 0
	}
	for (const [flag, name] of STATE_VISUAL) {
		setPseudoClass(node, name, (flags & flag) !== 0)
	}
	if (node.type === 'textfield') {
		setPseudoClass(node, 'focus', (flags & Gtk.StateFlags.FOCUS_WITHIN) !== 0)
	} else {
		setPseudoClass(node, 'focus', (flags & Gtk.StateFlags.FOCUSED) !== 0)
	}
	setPseudoClass(
		node,
		'focus-visible',
		(flags & Gtk.StateFlags.FOCUS_VISIBLE) !== 0 &&
			(flags & (Gtk.StateFlags.FOCUSED | Gtk.StateFlags.FOCUS_WITHIN)) !== 0,
	)
	if (view instanceof Gtk.Switch) {
		setPseudoClass(node, 'checked', view.active === true)
	}
	setPseudoClass(node, 'normal', ![...NORMAL_OFF].some((name) => node.cssPseudoClasses.has(name)))
}

/** Connect state tracking once per view-bearing node; ids ride on the node
 *  for destroy/recreate. Switch's `active` drives :checked. */
function wireStateFlags(node: ElementNode) {
	const view = node.view
	if (view === null) {
		return
	}
	const ids: number[] = []
	try {
		ids.push(view.connect('state-flags-changed', () => syncPseudoState(node)))
	} catch {
		// Widgets without state-flags-changed simply stay untracked.
	}
	if (view instanceof Gtk.Switch) {
		try {
			ids.push(view.connect('notify::active', () => syncPseudoState(node)))
		} catch {
			// no active property — skip
		}
	}
	node.cssStateSignalIds = ids
	syncPseudoState(node)
}

function unwireStateFlags(node: ElementNode) {
	const view = node.view
	if (view !== null && node.cssStateSignalIds) {
		for (const id of node.cssStateSignalIds) {
			try {
				view.disconnect(id)
			} catch {
				// already gone
			}
		}
	}
	node.cssStateSignalIds = undefined
}

/** textAlign maps to widget props, not GTK CSS — labels take xalign plus
 *  Gtk.Justification; textfields take xalign. When the key leaves the
 *  effective style the prop-level value (or the widget default) returns. */
function syncTextAlign(node: ElementNode, view: GtkView, style: PropBag) {
	if (node.type !== 'label' && node.type !== 'textfield') {
		return
	}
	const justifyFor = (x: number) =>
		x === 0.5
			? Gtk.Justification.CENTER
			: x === 1
				? Gtk.Justification.RIGHT
				: Gtk.Justification.LEFT
	const ta = style?.textAlign
	if (ta != null) {
		const x = ta === 'center' ? 0.5 : ta === 'right' || ta === 'end' ? 1 : 0
		view.xalign = x
		if (node.type === 'label') {
			view.justify = justifyFor(x)
		}

		node.styleTextAlign = true
		return
	}
	if (node.styleTextAlign) {
		node.styleTextAlign = false
		const pv = node.props.textAlignment ?? node.props.xalign
		const x =
			typeof pv === 'number'
				? Math.max(0, Math.min(1, pv))
				: pv === 'center'
					? 0.5
					: pv === 'right' || pv === 'end'
						? 1
						: 0

		view.xalign = x
		if (node.type === 'label') {
			view.justify = justifyFor(x)
		}
	}
}

/** Apply the node's computed effective style — the cascade output, which
 *  already folds the inline `style` prop in as the highest tier. Viewless
 *  nodes still carry computedStyle (inheritance and custom props flow
 *  through them) but write nothing. */
function applyStyle(node: ElementNode, style: PropBag) {
	const next: PropBag = node.animatedStyle ? { ...style, ...node.animatedStyle } : (style ?? {})
	node.appliedStyle = next
	const view = node.view
	if (view === null) {
		return
	}
	syncCss(node, next)
	applyStyleExtras(node, view, next)
	syncTextAlign(node, view, next)
	applyStyleViewProps(node, view, next)
	warnUnsupportedCssProps(node, next)
}

/** Every live container — stylesheet and appearance changes restyle them all. */
const liveGtkContainers = new Set<GtkContainer>()

function restyleAllContainers() {
	for (const container of liveGtkContainers) {
		for (const child of container.children) {
			markStyleDirty(child, true)
		}

		flushStyleDirty(container)
	}
}

onStylesheetsChanged(restyleAllContainers)

// Media environment: largest live host size + color scheme + animations.
setStyleEnvironment(() => {
	const { width, height } = envSize()
	let reducedMotion = false
	try {
		reducedMotion = gtkSettings()?.gtk_enable_animations === false
	} catch {
		// property absent on older GTK — animations enabled.
	}
	return { width, height, colorScheme: cssSchemeName() as 'light' | 'dark', reducedMotion }
})

// Appearance and a11y flips change ns-light/ns-dark on roots and may flip
// media-gated rules. Settings exist only after Gtk.init — connect lazily on
// the first container, once.
let settingsObserved = false
// ---- Media queries on resize -------------------------------------------------

let lastOrientation = ''
let resizeQueued = false
function onWindowResize() {
	if (resizeQueued) {
		return
	}
	resizeQueued = true
	Promise.resolve().then(() => {
		resizeQueued = false
		const orientation = cssOrientation()
		const flipped = orientation !== lastOrientation
		lastOrientation = orientation
		if (refreshMediaQueries() || flipped) {
			restyleAllContainers()
		}
	})
}

/** Wire a container's root window for resize-driven media/orientation
 *  re-eval — once per window, retried when the host later gets a root
 *  (fixtures mount a bare box that gains a window afterwards). */
function wireContainerWindow(container: GtkContainer) {
	if (container.windowSignalIds?.length) {
		return
	}
	const root = container.host.get_root?.()
	if (!(root instanceof Gtk.Window)) {
		if (!container.rootSignalId) {
			try {
				container.rootSignalId = container.host.connect?.('notify::root', () =>
					wireContainerWindow(container),
				)
			} catch {
				// no root property — never wired
			}
		}

		return
	}
	const ids: number[] = []
	for (const signal of [
		'notify::default-width',
		'notify::default-height',
		'notify::maximized',
		'notify::fullscreened',
	]) {
		try {
			ids.push(root.connect(signal, () => onWindowResize()))
		} catch {
			// older GTK lacks some signals — keep the rest
		}
	}
	container.windowSignalIds = ids
	container.window = root
}

function observeGtkSettings() {
	if (settingsObserved) {
		return
	}
	const settings = gtkSettings()
	if (!settings) {
		return
	}
	settingsObserved = true
	for (const signal of [
		// gtk-interface-color-scheme is absent before GTK 4.20 — connect
		// failures leave the other watches in place.
		'notify::gtk-interface-color-scheme',
		'notify::gtk-application-prefer-dark-theme',
		'notify::gtk-theme-name',
		'notify::gtk-enable-animations',
	]) {
		try {
			settings.connect(signal, () => restyleAllContainers())
		} catch {
			// signal unknown on this GTK — skip it
		}
	}
}

/** True when the node's widget is laid out by a mason host. */
function isMasonChild(node: ElementNode): boolean {
	return isMasonHostView(hostViewOf(node.container, node.parent))
}

function dimension(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : -1
}

/** Gtk.Box stretches cross-axis children by default even when they have a
 * size request. Preserve definite authored sizes at the GTK/Mason boundary;
 * inside a Mason parent the engine owns alignment and allocation. */
function syncBoxAlignment(node: ElementNode, source: PropBag) {
	const view = node.view
	if (!view) return
	const host = hostViewOf(node.container, node.parent)
	if (!(host instanceof Gtk.Box) || isMasonHostView(host)) {
		if (node.boxAlignmentManaged) {
			view.set_halign(Gtk.Align.FILL)
			view.set_valign(Gtk.Align.FILL)
			node.boxAlignmentManaged = false
		}
		return
	}
	const horizontal = host.orientation === Gtk.Orientation.HORIZONTAL
	const cross = ALIGN[String(source.alignSelf ?? node.props.alignSelf)]
	let halign =
		ALIGN[String(source.horizontalAlign ?? node.props.horizontalAlignment ?? node.props.halign)]
	let valign =
		ALIGN[String(source.verticalAlign ?? node.props.verticalAlignment ?? node.props.valign)]
	if (cross !== undefined) {
		if (horizontal) valign ??= cross
		else halign ??= cross
	}
	halign ??= ALIGN[String(source.justifySelf ?? node.props.justifySelf)]
	const width = dimension(source.width ?? node.props.width)
	const height = dimension(source.height ?? node.props.height)
	const grow = Number(source.flexGrow ?? node.props.flexGrow) > 0
	// Stretch only changes an auto cross size. Flex growth may enlarge the
	// main size even when the basis has a definite authored dimension.
	if (halign == null || halign === Gtk.Align.FILL) {
		halign = width >= 0 && !(horizontal && grow) ? Gtk.Align.START : Gtk.Align.FILL
	}
	if (valign == null || valign === Gtk.Align.FILL) {
		valign = height >= 0 && !(!horizontal && grow) ? Gtk.Align.START : Gtk.Align.FILL
	}
	view.set_halign(halign)
	view.set_valign(valign)
	node.boxAlignmentManaged = true
	node.flexGrowValue = source.flexGrow ?? node.props.flexGrow
	syncExpand(node)
}

// Style applies at batch end, after every prop — the effective bag wins but
// each key falls back to the prop-level value the element still carries.
function applyStyleExtras(node: ElementNode, view: GtkView, style: PropBag | null | undefined) {
	const source = style && typeof style === 'object' ? style : {}
	const widthValue = source.width ?? node.props.width
	const heightValue = source.height ?? node.props.height
	const width = widthValue != null ? dimension(widthValue) : -1
	const height = heightValue != null ? dimension(heightValue) : -1
	if (width !== node.appliedWidth || height !== node.appliedHeight) {
		node.appliedWidth = width
		node.appliedHeight = height
		view.set_size_request(width, height)
	}
	const opacity = source.opacity ?? node.props.opacity
	if (opacity != null) {
		view.set_opacity(Number(opacity))
	} else if (node.appliedOpacity !== undefined) {
		view.set_opacity(1)
	}
	node.appliedOpacity = opacity

	const overflow = source.overflow
	if (overflow === 'hidden' || overflow === 'clip' || overflow === 'visible') {
		node.originalOverflow ??= view.get_overflow()
		view.set_overflow(overflow === 'visible' ? Gtk.Overflow.VISIBLE : Gtk.Overflow.HIDDEN)
		node.styleOverflow = true
	} else if (node.styleOverflow) {
		view.set_overflow(node.originalOverflow)
		node.styleOverflow = false
	}

	// Inside a Mason subtree the engine owns layout — the keys below are
	// consumed by the style dict in src/mason.ts during the next
	// measure/allocate pass, so the Gtk.Box emulation must not also apply
	// them. queue_resize re-runs GTK's layout pipeline on the host.
	if (isMasonChild(node) || isMasonHostView(view)) {
		queueMasonLayout(view)
		// z-index and clip-path paint in the parent's snapshot — a change
		// that leaves the allocation alone still needs a redraw.
		view.get_parent?.()?.queue_draw?.()
		return
	}
	for (const name of ['zIndex', 'clipPath']) {
		if (source[name] != null && node.cssOriginKeys?.has(name)) {
			warnOnce(
				`css-outside-mason:${name}`,
				`[linux-gtk-css] ${name} applies only to masonview children — ignored on <${node.type}>`,
			)
		}
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
	node.flexGrowValue = source.flexGrow ?? node.props.flexGrow
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

/** CSS-driven widget writes that GTK CSS cannot express — direction,
 *  child-visibility, label wrapping/ellipsize/lines, and alignment outside
 *  Mason subtrees. Each key restores the prop value or widget default when
 *  it leaves the effective style. */
function applyStyleViewProps(node: ElementNode, view: GtkView, style: PropBag) {
	const source = style ?? {}

	if (source.direction != null) {
		const d =
			source.direction === 'rtl'
				? Gtk.TextDirection.RTL
				: source.direction === 'ltr'
					? Gtk.TextDirection.LTR
					: Gtk.TextDirection.NONE

		view.set_direction(d)
		node.styleDirection = true
	} else if (node.styleDirection) {
		node.styleDirection = false
		view.set_direction(Gtk.TextDirection.NONE)
	}

	// NS visibility: 'hidden' keeps layout space (child-invisible), only
	// 'collapse' removes it — styleDict keeps the same split for Mason.
	const vis = source.visibility
	if (vis != null) {
		node.styleVisibility = true
		if (vis === 'collapse') {
			view.set_visible(false)
		} else {
			view.set_visible(true)
			view.set_child_visible(vis !== 'hidden')
		}
	} else if (node.styleVisibility) {
		node.styleVisibility = false
		view.set_visible(
			node.props.visible !== false &&
				(node.props.visibility == null || node.props.visibility === 'visible'),
		)

		view.set_child_visible(true)
	}

	// Label text behaviour — buttons reach their Gtk.Label child; keys reset
	// to the prop value or the widget default.
	if (node.type === 'label' || node.type === 'button') {
		const labelView = node.type === 'button' ? (view.get_child?.() ?? view) : view
		if (source.whiteSpace != null) {
			labelView.wrap = source.whiteSpace === 'normal' || source.whiteSpace === 'wrap'
			node.styleWhiteSpace = true
		} else if (node.styleWhiteSpace) {
			node.styleWhiteSpace = false
			const pv = node.props.whiteSpace ?? node.props.textWrap
			labelView.wrap = pv === true || pv === 'normal' || pv === 'wrap'
		}

		if (source.textOverflow != null) {
			// Pango.EllipsizeMode.END = 3
			labelView.ellipsize = source.textOverflow === 'ellipsis' ? 3 : 0
			node.styleTextOverflow = true
		} else if (node.styleTextOverflow) {
			node.styleTextOverflow = false
			labelView.ellipsize = node.props.textOverflow === 'ellipsis' ? 3 : 0
		}

		if (source.maxLines != null) {
			labelView.lines = Number(source.maxLines)
			node.styleMaxLines = true
		} else if (node.styleMaxLines) {
			node.styleMaxLines = false
			labelView.lines = node.props.maxLines != null ? Number(node.props.maxLines) : -1
		}
	}

	// Alignment outside Mason subtrees; inside, the engine owns layout.
	if (source.horizontalAlign != null || source.verticalAlign != null) {
		if (isMasonHostView(hostViewOf(node.container, node.parent))) {
			warnOnce(
				'css-align-mason',
				'[linux-gtk-css] horizontalAlign/verticalAlign inside a Mason subtree is handled by the layout engine',
			)
		} else {
			const halign = ALIGN[String(source.horizontalAlign)]
			if (halign !== undefined) {
				view.set_halign(halign)
				node.styleHAlign = true
			}

			const valign = ALIGN[String(source.verticalAlign)]
			if (valign !== undefined) {
				view.set_valign(valign)
				node.styleVAlign = true
			}
		}
	}
	if (source.horizontalAlign == null && node.styleHAlign) {
		node.styleHAlign = false
		const pv = ALIGN[String(node.props.horizontalAlignment ?? node.props.halign)]
		view.set_halign(pv ?? Gtk.Align.FILL)
	}
	if (source.verticalAlign == null && node.styleVAlign) {
		node.styleVAlign = false
		const pv = ALIGN[String(node.props.verticalAlignment ?? node.props.valign)]
		view.set_valign(pv ?? Gtk.Align.FILL)
	}
	syncBoxAlignment(node, source)
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
		syncBoxAlignment(n, n.computedStyle ?? {})
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

// Keep automation identifiers separate from the AT-visible accessible label.
function widgetName(node: ElementNode): string {
	const { testID, automationText, id, accessibilityLabel } = node.props
	return String(testID ?? automationText ?? id ?? accessibilityLabel ?? '')
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
	// Cascade-fed props apply on viewless nodes too — contentview and friends
	// carry computed styles so inheritance and custom props flow through them.
	if (name === 'className' || name === 'class') {
		applyClassName(node, value)
		return
	}
	if (name === 'style') {
		setNodeInlineStyle(node, styleBag(value) ?? undefined)
		return
	}
	if (name === 'id' || name === 'testID' || name === 'automationText') {
		// Widget names are the GTK-side queryable identifier (GTK inspector,
		// gtk_widget_get_name) — the identifier plumbing row of family J.
		view?.set_name(widgetName(node))
		if (name === 'id') {
			setNodeId(node, value)
		}

		return
	}
	if (name === 'disabled' || name === 'isEnabled' || name === 'enabled') {
		setPseudoClass(
			node,
			'disabled',
			node.props.disabled === true ||
				node.props.isEnabled === false ||
				node.props.enabled === false,
		)
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
		case 'visible':
			view.set_visible(value !== false)
			return
		case 'visibility':
			// 'hidden' keeps layout space (child-invisible); 'collapse'
			// unmaps entirely — the same split the style path applies.
			if (value === 'collapse') {
				view.set_visible(false)
			} else {
				view.set_visible(true)
				view.set_child_visible(value !== 'hidden')
			}

			return
		case 'opacity':
			view.set_opacity(Number(value))
			return
		case 'enabled':
		case 'isEnabled':
		case 'disabled':
			view.set_sensitive(
				(name === 'disabled' ? value !== true : value !== false) &&
					(node.type !== 'textfield' || node.editableFlag !== false),
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
		case 'accessibilityLabel':
			// GIR exposes the non-varargs gtk_accessible_update_property_value
			// as update_property, with parallel property/value arrays.
			syncAccessibleName(node)
			view.set_name(widgetName(node))
			return
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
			if (['orientation', 'scrollBarIndicatorVisible', 'isScrollEnabled'].includes(name)) {
				const orientation = node.props.orientation ?? 'vertical'
				const policy =
					node.props.scrollBarIndicatorVisible === false
						? Gtk.PolicyType.EXTERNAL
						: Gtk.PolicyType.AUTOMATIC
				const enabled = node.props.isScrollEnabled !== false
				view.hscrollbar_policy =
					enabled && orientation !== 'vertical' ? policy : Gtk.PolicyType.NEVER
				view.vscrollbar_policy =
					enabled && orientation !== 'horizontal' ? policy : Gtk.PolicyType.NEVER
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

function syncAccessibleName(node: ElementNode) {
	const view = node.view
	if (!view) {
		return
	}
	const label = node.props.accessibilityLabel
	if (label != null) {
		view.update_property([Gtk.AccessibleProperty.LABEL], [String(label)])
		if (node.type === 'button') {
			// GTK's mnemonic labelled-by relation takes priority over LABEL.
			view.reset_relation(Gtk.AccessibleRelation.LABELLED_BY)
		}
	} else if (node.type === 'label') {
		// Gtk.Label stores its visible text in LABEL too. A reset or a text
		// write must restore the natural name when no override is present.
		view.update_property([Gtk.AccessibleProperty.LABEL], [view.get_text()])
	}
}

function applyProps(node: ElementNode, props: PropBag) {
	for (const name of Object.keys(props)) {
		setProp(node, name, props[name])
	}
	syncAccessibleName(node)
}

/** Explicit reset for a dropped prop. setProp skips `undefined`, so resets
 *  need their own path — every widget state a prop can write gets its
 *  documented default back here. */
function resetProp(node: ElementNode, name: string) {
	if (name === 'id') setNodeId(node, undefined)
	const view = node.view
	// Cascade-fed props reset on viewless nodes too (see setProp).
	if (name === 'className' || name === 'class') {
		applyClassName(node, '')
		return
	}
	if (name === 'style') {
		setNodeInlineStyle(node, undefined)
		return
	}
	if (name === 'id') {
		setNodeId(node, undefined)
	} else if (name === 'disabled' || name === 'isEnabled' || name === 'enabled') {
		setPseudoClass(
			node,
			'disabled',
			node.props.disabled === true ||
				node.props.isEnabled === false ||
				node.props.enabled === false,
		)
	}
	if (view === null) {
		if (name === 'value' || name === 'text') {
			node.text = ''
			syncText(nearestViewAncestor(node))
		}

		return
	}
	switch (name) {
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
		case 'disabled':
			view.set_sensitive(node.type !== 'textfield' || node.editableFlag !== false)
			return
		case 'visibility':
			view.set_visible(true)
			view.set_child_visible(true)
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
			view.reset_property(Gtk.AccessibleProperty.LABEL)
			view.set_name(widgetName(node))
			return
		case 'id':
		case 'testID':
		case 'automationText':
			view.set_name(widgetName(node))
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
			syncAccessibleName(anchor)
		}

		return
	}
	anchor.textApplied = true
	anchor.view.label = text
	syncAccessibleName(anchor)
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
function viewIndexOf(
	container: GtkContainer,
	parent: ElementNode | null,
	node: ElementNode,
): number {
	const siblings = parent === null ? container.children : parent.children
	// A viewless parent occupies a slice of its own effective parent.
	let index =
		parent !== null && parent.view === null ? viewIndexOf(container, parent.parent, parent) : 0
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
	for (let child = parentView.get_first_child(); child !== null; child = child.get_next_sibling()) {
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

	throw new Error(`linux-gtk driver: ${parentView.constructor.name} cannot host children.`)
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

/** A node's insertion/removal can flip sibling-combinator matches on the
 *  siblings that stay — restyle them when any registered sheet uses one. */
function markSiblingsForSelectors(
	container: GtkContainer,
	parent: ElementNode | null,
	skip: ElementNode,
) {
	const scope = stylesheetScope()
	if (!scope.hasAdjacentCombinatorSelectors && !scope.hasSiblingCombinatorSelectors) {
		return
	}
	for (const sibling of parent === null ? container.children : parent.children) {
		if (sibling !== skip) {
			markStyleDirty(sibling, true)
		}
	}
}

function detach(container: GtkContainer, node: ElementNode) {
	const parent = node.parent
	const siblings = parent === null ? container.children : parent.children
	const index = siblings.indexOf(node)
	if (index !== -1) {
		siblings.splice(index, 1)
	}
	markSiblingsForSelectors(container, parent, node)
	stopSubtreeAnimations(node)
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
	markStyleDirty(node, true)
	markSiblingsForSelectors(container, parent, node)
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
	syncBoxAlignment(node, node.computedStyle ?? {})
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
	listener: UniversalEventListenerDescriptor | ((payload: any) => void),
): { connections: SignalConnection[]; controllers: any[] } {
	const dispatch = (payload: unknown) => {
		if (node.muted.has(type)) {
			return
		}
		// Real (non-muted) change events mark a user edit so a pending
		// selection settle never re-asserts over genuine input.
		if (type === 'change') {
			node.changeSeq++
		}
		const root = container.root
		if (root === null && typeof listener !== 'function') {
			return
		}
		const fire = () => {
			try {
				if (typeof listener === 'function') {
					if (root) root.eventScope('continuous', () => listener(payload))
					else listener(payload)
				} else {
					root!.eventScope(listener.priority, () => root!.dispatchEvent(listener.id, payload))
				}
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

	const handler = (..._args: any[]) => dispatch(payloadFor(node, type))

	switch (type) {
		case 'touch': {
			const gesture = new Gtk.GestureClick()
			let pressed = false
			const send = (action: string, x = 0, y = 0) => {
				pressed = action === 'down'
				dispatch({ eventName: 'touch', object: view, action, x, y })
			}
			view.add_controller(gesture)
			return {
				connections: [
					{
						emitter: gesture,
						signalId: gesture.connect('pressed', (_g: any, _n: number, x: number, y: number) =>
							send('down', x, y),
						),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('released', (_g: any, _n: number, x: number, y: number) => {
							if (pressed) send('up', x, y)
						}),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('cancel', () => {
							if (pressed) send('cancel')
						}),
					},
				],
				controllers: [gesture],
			}
		}
		case 'pan': {
			const gesture = new Gtk.GestureDrag()
			gesture.set_name?.('octane-pan')
			let active = false
			let x = 0,
				y = 0,
				time = 0
			const send = (state: string, dx: number, dy: number) => {
				const now = GLib.get_monotonic_time() / 1000
				const elapsed = now - time
				const vx = elapsed > 0 ? ((dx - x) * 1000) / elapsed : 0
				const vy = elapsed > 0 ? ((dy - y) * 1000) / elapsed : 0
				x = dx
				y = dy
				time = now
				dispatch({ x, y, dx: x, dy: y, vx, vy, state, target: view })
			}
			view.add_controller(gesture)
			return {
				connections: [
					{
						emitter: gesture,
						signalId: gesture.connect('drag-begin', () => {
							active = true
							x = 0
							y = 0
							time = GLib.get_monotonic_time() / 1000
							send('began', 0, 0)
						}),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('drag-update', (_g: any, dx: number, dy: number) => {
							if (active) send('moved', dx, dy)
						}),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('drag-end', (_g: any, dx: number, dy: number) => {
							if (active) {
								active = false
								send('ended', dx, dy)
							}
						}),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('cancel', () => {
							if (active) {
								active = false
								send('cancelled', x, y)
							}
						}),
					},
				],
				controllers: [gesture],
			}
		}
		case 'swipe': {
			const gesture = new Gtk.GestureSwipe()
			view.add_controller(gesture)
			return {
				connections: [
					{
						emitter: gesture,
						signalId: gesture.connect('swipe', (_g: any, vx: number, vy: number) => {
							if (vx === 0 && vy === 0) return
							dispatch({
								direction: Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 1 : 2) : vy > 0 ? 8 : 4,
							})
						}),
					},
				],
				controllers: [gesture],
			}
		}
		case 'tap': {
			if (view instanceof Gtk.Button) {
				return {
					connections: [{ emitter: view, signalId: view.connect('clicked', handler) }],
					controllers: [],
				}
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
					{
						emitter: view.vadjustment,
						signalId: view.vadjustment.connect('value-changed', handler),
					},
					{
						emitter: view.hadjustment,
						signalId: view.hadjustment.connect('value-changed', handler),
					},
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

function bindNodePublicInstance(node: ElementNode): () => void {
	return bindPublicInstance(
		node,
		{
			read: (key) => {
				const direct = node.localStyle?.[key] ?? node.computedStyle?.[key] ?? node.props[key]
				if (direct !== undefined) return direct
				return (resolveTransform({ ...node.computedStyle, ...node.localStyle }) as any)?.[key]
			},
			write: (key, value) => {
				if (value === undefined) delete node.localStyle?.[key]
				else (node.localStyle ??= {})[key] = value
				markStyleDirty(node, false, false)
			},
		},
		(listener) => {
			const view = node.view!
			const wired = connectEvent(node.container, node, view, 'pan', listener)
			return () => {
				for (const connection of wired.connections)
					connection.emitter.disconnect(connection.signalId)
				for (const controller of wired.controllers) view.remove_controller(controller)
			}
		},
	)
}

function createNode(
	container: GtkContainer,
	id: number,
	type: string,
	props: PropBag,
): ElementNode {
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
		cssType: type,
		cssClasses: new Set(),
		cssPseudoClasses: new Set(),
		cssBaseClasses: new Set(),
		cssId: undefined,
		computedStyle: undefined,
		computedCustomProps: new Map(),
		cssStateSignalIds: undefined,
		textApplied: false,
		destroyed: false,
	}
	node.getChildIndex = (child: ElementNode) => cssChildren(node).indexOf(child)
	node.getChildAt = (i: number) => cssChildren(node)[i]
	node.getChildrenCount = () => cssChildren(node).length
	if (view !== null && isMasonView(view)) {
		// The layout manager's vfuncs resolve the logical node from the
		// widget — link them before props land so style writes find it.
		bindMasonView(view, node)
	}
	node.disposePublicInstance = bindNodePublicInstance(node)
	wireStateFlags(node)
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

			node.disposePublicInstance?.()
			node.destroyed = true
			container.cssDirty?.delete(node)
			cancelKeyframeAnimations(node)
			cancelSelectionSettle(node)
			disposeListeners(node)
			unwireStateFlags(node)
			releaseMasonNodes(node)
			// Batches normally remove before destroy — detach defensively so a
			// destroy without a preceding remove can't leave a parented view or
			// a stale logical child behind.
			if (node.parent !== null || container.children.includes(node)) {
				detach(container, node)
			}

			if (node.cssProvider !== null) {
				for (const target of node.cssProviderTargets ?? []) {
					target.get_style_context().remove_provider(node.cssProvider)
				}

				node.cssProviderTargets = undefined
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
			node.disposePublicInstance?.()
			disposeListeners(node)
			node.muted.clear()
			cancelKeyframeAnimations(node)
			detachViews(node)
			releaseMasonNodes(node)
			if (node.cssProvider !== null) {
				for (const target of node.cssProviderTargets ?? []) {
					target.get_style_context().remove_provider(node.cssProvider)
				}

				node.cssProviderTargets = undefined
			}

			unwireStateFlags(node)
			node.view = VIEWLESS.has(command.type) ? null : instantiate(command.type)
			wireStateFlags(node)
			node.type = command.type
			node.textApplied = false
			node.cssProvider = null
			node.cssClass = null
			node.cssSignature = ''
			node.cssType = command.type
			node.localStyle = undefined
			node.computedStyle = undefined
			node.computedCustomProps = new Map()
			node.cssOriginKeys = undefined
			node.inheritedOnlyKeys = undefined
			node.appliedStyle = undefined
			node.styleTextAlign = undefined
			node.appliedWidth = undefined
			node.appliedHeight = undefined
			node.appliedOpacity = undefined
			node.styleOverflow = false
			node.originalOverflow = undefined
			node.props = command.props
			if (node.view !== null && isMasonHostView(node.view)) {
				bindMasonView(node.view, node)
			}

			node.disposePublicInstance = bindNodePublicInstance(node)
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

			// The new widget dropped its provider and computed bag — restyle.
			markStyleDirty(node, true)
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
				// Styles restyle once at batch end — props settle first so the
				// computed bag sees the same generation.
				container.inBatch = true
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
					container.inBatch = false
					flushStyleDirty(container)
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
	const container: GtkContainer = { host, nodes: new Map(), children: [], root: null }
	liveGtkContainers.add(container)
	// Gtk.Settings exists only after Gtk.init — the first container is the
	// earliest point appearance watches can connect.
	observeGtkSettings()
	wireContainerWindow(container)
	// Prime the media-query cache and the tracked orientation so the first
	// resize diff compares against a baseline, not an empty cache.
	refreshMediaQueries()
	lastOrientation = cssOrientation()
	return container
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
	}) as GtkRoot
	container.root = root
	return { root, container }
}

export { registerStylesheet } from '@octane-xplat/css-engine'

export * from 'octane/universal/native'
