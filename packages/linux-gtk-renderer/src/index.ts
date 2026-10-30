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
import Gdk from 'gi://Gdk?version=4.0'
import { bindAccessibilityMapping, syncAccessibilityState } from './accessibility.js'
import { bindPressKeys } from './press-keyboard.js'
import {
	bindMasonView,
	isMasonHostView,
	isMasonView,
	makeMasonView,
	makeMasonFallbackView,
	masonAvailable,
	queueMasonLayout,
	releaseMasonNodes,
	MASON_STYLE_KEYS,
} from './mason.js'

import {
	computeCascade,
	evalMediaQuery,
	INHERITED_CSS_PROPERTIES,
	onStylesheetsChanged,
	refreshMediaQueries,
	registerStylesheet,
	sampleKeyframeAnimation,
	setStyleEnvironment,
	stylesheetPseudoClasses,
	stylesheetScope,
	type CssHostNode,
	type KeyframeAnimationInfo,
	type SampledValues,
} from '@octane-xplat/css-engine'

import { physicalView } from './physical-view.js'
import { makeTextView, takeTextViewControl, type TextViewControl } from './text-view.js'
import { bindPicture } from './picture.js'
import { popoverChromeUsers } from './popover-instance.js'
import { bindOverlayHost } from './overlay-host.js'
import { bindPublicInstance } from './public-instance.js'
import { normalizeKeyEvent } from './key-event.js'
import { createGtkWindowService, type GtkWindowService } from './window-service.js'

import { CSS_PROPS, gtkStyleCss } from './style-css.js'
import { resolveTransform, cssTransformText } from './transform-style.js'
import { createUniversalRoot } from 'octane/universal/native'
import type {
	UniversalEventListenerDescriptor,
	UniversalHostBatch,
	UniversalHostCommand,
	UniversalHostDriver,
	UniversalPortalTargetHandle,
	UniversalPortalTargetContext,
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
	/** Host bindings dispatch leaf-observable ref events (isLoadingChange). */
	emitRefEvent?: (eventName: string, detail?: Record<string, unknown>) => void
	signalId: number
}

/** A retained element in the GTK tree. */
export interface ElementNode {
	id: number
	type: string
	view: GtkView | null
	/** Outer native host for composite controls; public refs stay on view. */
	layoutView?: GtkView
	textView?: TextViewControl
	/** Physical boundary for a viewless, renderer-owned external portal root. */
	portalHost?: GtkView
	picture?: ReturnType<typeof bindPicture>
	fontObservers?: Set<() => void>
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

interface GtkPortalTarget {
	id: number
	handle: UniversalPortalTargetHandle
	target: unknown
	parent: ElementNode | null
	synthetic: boolean
	references: number
}

/** Per-root state shared by the driver commands. */
export interface GtkContainer {
	/** The GTK widget the tree mounts into — a container (Gtk.Box, Gtk.Fixed)
	 *  or the window's content widget. */
	host: GtkView
	/** The renderer-owned `Gtk.Overlay` inside `host` — overlay layers stack
	 *  above `contentHost` (the root's render target). */
	overlay?: any
	contentHost?: GtkView
	overlayLayers?: Set<any>
	overlayLayerHandles?: Set<any>
	layerKeySink?: ((event: any) => void) | null
	layerKeyController?: any
	/** Focus-visible modality controllers on the window root — capture-phase
	 *  key + pointer-press watches feeding the shared inputModality state. */
	modalityControllers?: any[]
	/** Service roots mount inside a host's overlay layer (toast stack) —
	 *  they live in `liveGtkContainers` for restyle but never become the
	 *  `__octaneGtkHost` bridge's layer target. */
	service?: boolean
	nodes: Map<number, ElementNode>
	children: ElementNode[]
	root: GtkRoot | null
	portalTargets: Map<number, GtkPortalTarget>
	portalTargetsByObject: Map<unknown, GtkPortalTarget>
	nextPortalTarget: number
	/** Qualification aid: shared popover chrome users on the host display. @internal */
	popoverChromeUsers?: () => number
	/** Style restyle queue — flushed at batch end, or on one microtask
	 *  outside a batch (GJS has no queueMicrotask). */
	cssDirty?: Set<ElementNode>
	cssFlushQueued?: boolean
	inBatch?: boolean
	/** Resize watch on the root Gtk.Window (media/orientation re-eval). */
	windowSignalIds?: number[]
	rootSignalId?: number
	window?: Gtk.Window
	surfaceWired?: boolean
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
	onKeyDown: { type: 'keydown', priority: 'discrete' },
	onKeyUp: { type: 'keyup', priority: 'discrete' },
	onLoaded: { type: 'loaded', priority: 'default' },
	onUnloaded: { type: 'unloaded', priority: 'default' },
	onLayoutChanged: { type: 'layoutChanged', priority: 'continuous' },
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
// Element factories — one public Gtk widget per intrinsic, with a native
// layout host when the control needs one.
// ---------------------------------------------------------------------------

function instantiate(type: string): GtkView {
	switch (type) {
		// The real layout engine when the XplatMason typelib is loadable —
		// a Gtk.Widget + custom Gtk.LayoutManager driven by mason-c. The
		// Gtk.Box fallback keeps the shim's emulation for builds without
		// the native artifact (see src/mason.ts module note).
		case 'masonview':
			return masonAvailable() ? makeMasonView() : makeMasonFallbackView()
		case 'label':
			return new Gtk.Label({ label: '', xalign: 0 })
		case 'button':
			return new Gtk.Button()
		case 'scrollview':
			return new Gtk.ScrolledWindow({
				hscrollbar_policy: Gtk.PolicyType.NEVER,
				vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
			})
		case 'image':
		case 'svgview':
			return new Gtk.Picture({ can_shrink: true })
		case 'textfield':
			return new Gtk.Entry()
		case 'textview':
			return makeTextView()
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
	const layout = physicalView(node)!
	const composite = layout !== view
	const options =
		isMasonChild(node) || composite
			? GTK_STYLE_OPTIONS
			: {
					...GTK_STYLE_OPTIONS,
					transformBox: { width: view.get_width(), height: view.get_height() },
				}
	let css = gtkStyleCss(`.xplat-n${node.id}`, style, node.type, options)
	const transform = composite && !isMasonChild(node) ? resolveTransform(style) : null
	if (transform) {
		css += `.xplat-n${node.id}-layout { transform: ${cssTransformText(transform, layout.get_width(), layout.get_height())}; transform-origin: center; }`
	}
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
			if (composite) {
				layout.remove_css_class(node.cssClass + '-layout')
			}
			node.cssClass = null
		}

		return
	}

	if (node.cssClass === null) {
		node.cssClass = `xplat-n${node.id}`
		view.add_css_class(node.cssClass)
		if (composite) {
			layout.add_css_class(node.cssClass + '-layout')
		}
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

		const targets = composite ? [view, layout] : [view]
		if (CONTROL_SUBNODE_TYPES.has(node.type)) {
			for (const child of internalDescendants(composite ? layout : view)) {
				if (!targets.includes(child)) {
					targets.push(child)
				}
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
	'textview',
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
		if (node.destroyed || (!container.nodes.has(node.id) && !node.portalHost)) {
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
	for (const key of Object.keys(node.localStyle ?? {})) {
		inheritedKeys.delete(key)
	}

	node.cssOriginKeys = cssKeys
	node.inheritedOnlyKeys = inheritedKeys
	const prevStyle = node.computedStyle ?? {}
	const prevCustom = node.computedCustomProps ?? new Map()
	node.computedStyle = style
	node.computedCustomProps = customProps
	node.picture?.restyle()

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
	const view = physicalView(node)
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
		applyAnimationFrame(node, prev)
	}
	return !done
}

/** Per-frame write. Size keys go through the full style apply (they feed
 *  set_size_request / the Mason style dict); everything else touches only
 *  the CSS provider, opacity, and — for Mason children — the parent's
 *  allocation, which re-applies the child Gsk.Transform. */
function applyAnimationFrame(node: ElementNode, prev: PropBag | undefined) {
	const view = physicalView(node)!
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
	// The selector engine delegates pseudo classes to the host node, including
	// :root. Keep it in step with the same logical-root boundary as ns-root.
	if (isCssRootNode(node)) {
		node.cssPseudoClasses.add('root')
	} else {
		node.cssPseudoClasses.delete('root')
	}
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
 *  Gtk.Justification; textfields take xalign; textviews share justification
 *  with their private hint. When the key leaves the
 *  effective style the prop-level value (or the widget default) returns. */
function syncTextAlign(node: ElementNode, view: GtkView, style: PropBag) {
	if (node.type === 'textview') {
		const value = style?.textAlign ?? node.props.textAlignment ?? node.props.xalign ?? 'left'
		const rtl =
			style?.direction === 'rtl' ||
			(style?.direction == null && view.get_direction() === Gtk.TextDirection.RTL)
		const right =
			value === 'right' || value === 1 || (value === 'end' && !rtl) || (value === 'start' && rtl)
		const center = value === 'center' || value === 0.5
		const justification =
			value === 'justify'
				? Gtk.Justification.FILL
				: center
					? Gtk.Justification.CENTER
					: right
						? Gtk.Justification.RIGHT
						: Gtk.Justification.LEFT
		view.set_justification(justification)
		const hint = node.textView!.placeholder
		hint.set_xalign(center ? 0.5 : right ? 1 : 0)
		hint.set_justify(justification)
		return
	}
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
	const previous = node.appliedStyle ?? {}
	node.appliedStyle = next
	const view = node.view
	if (view === null) {
		return
	}
	syncCss(node, next)
	applyStyleExtras(node, physicalView(node)!, next)
	applyStyleViewProps(node, view, next)
	syncTextAlign(node, view, next)
	warnUnsupportedCssProps(node, next)
	if (
		node.fontObservers?.size &&
		['fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing'].some(
			(key) => previous[key] !== next[key],
		)
	) {
		for (const notify of [...node.fontObservers]) {
			notify()
		}
	}
}

/** Every live container — stylesheet and appearance changes restyle them all. */
const liveGtkContainers = new Set<GtkContainer>()

/** The app's primary window — the most recently mounted non-service
 *  container's Gtk root. openWindow 'dialog'/'popup' parenting, openUri's
 *  transient parent, and the resizable window-size basis all read it. */
function mainGtkWindow(): Gtk.Window | null {
	const last = [...liveGtkContainers].filter((c) => !c.service).at(-1)
	const root = last?.host?.get_root?.()
	return root instanceof Gtk.Window ? root : null
}

// `openWindow` from @octane-xplat/ui reaches the host through the
// __octaneGtkHost bridge (windows.gtk) — the GTK counterpart of the macOS
// __xplatAppKitOpenWindow + setWindowContentResolver seam. The service is
// app-global: windows and the content resolver outlive any one root.
let gtkWindowService: GtkWindowService | null = null
function windowService(): GtkWindowService {
	if (gtkWindowService === null) {
		gtkWindowService = createGtkWindowService({
			mount: (host) => {
				const mounted = createGtkRoot(host)
				return { root: mounted.root }
			},
			parentWindow: mainGtkWindow,
		})
	}
	return gtkWindowService
}

function restyleAllContainers() {
	for (const container of liveGtkContainers) {
		for (const child of container.children) {
			markStyleDirty(child, true)
		}
		for (const target of container.portalTargets.values()) {
			if (target.synthetic && target.parent) {
				markStyleDirty(target.parent, true)
			}
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
// JS-facing environment subscriptions — `ui` reaches these through the
// `__octaneGtkHost` bridge (mirroring __xplatAppKit on macOS). Scheme
// listeners fire on a real scheme diff; media listeners on every
// debounced environment re-eval (resize or settings notify), so a JS
// query can re-check even when no registered stylesheet moved.
const colorSchemeListeners = new Set<() => void>()
const mediaListeners = new Set<() => void>()
// Input-modality tracking for focus-visible — the web leaf listens on DOM
// window keydown/pointerdown/blur; GTK has no :focus-visible, so the honest
// counterpart watches the same boundaries on each window root (installed in
// wireContainerWindow): an unmodified non-modifier key press means keyboard
// modality, a pointer press means pointer, and window deactivation returns
// to unknown. JS reads it through the __octaneGtkHost bridge.
let inputModality: 'keyboard' | 'pointer' | 'unknown' = 'unknown'
const inputModalityListeners = new Set<() => void>()
function setInputModality(next: 'keyboard' | 'pointer' | 'unknown') {
	if (next === inputModality) {
		return
	}
	inputModality = next
	for (const listener of inputModalityListeners) {
		listener()
	}
}
const SHORTCUT_MODIFIERS =
	Gdk.ModifierType.CONTROL_MASK |
	Gdk.ModifierType.ALT_MASK |
	Gdk.ModifierType.SUPER_MASK |
	Gdk.ModifierType.META_MASK
// GTK reports the key-pressed `state` without the just-pressed key's own
// bit, so a bare Control/Alt/Meta press would read as an unmodified key —
// the web leaf excludes those through the event's own modifier flags.
// Shift is intentionally absent: the web leaf counts a bare Shift press.
const MODIFIER_KEYVALS = new Set([
	Gdk.KEY_Control_L,
	Gdk.KEY_Control_R,
	Gdk.KEY_Alt_L,
	Gdk.KEY_Alt_R,
	Gdk.KEY_Meta_L,
	Gdk.KEY_Meta_R,
	Gdk.KEY_Super_L,
	Gdk.KEY_Super_R,
])
let emittedScheme: string | null = null
function notifyAppearance() {
	const scheme = cssSchemeName()
	const flipped = scheme !== emittedScheme
	emittedScheme = scheme
	if (flipped) {
		for (const listener of colorSchemeListeners) {
			listener()
		}
	}
	for (const listener of mediaListeners) {
		listener()
	}
}

// ---- Media queries on resize -------------------------------------------------

let lastOrientation = ''
let resizeQueued = false
function onWindowResize() {
	if (resizeQueued) {
		return
	}
	resizeQueued = false
	Promise.resolve().then(() => {
		resizeQueued = false
		const orientation = cssOrientation()
		const flipped = orientation !== lastOrientation
		lastOrientation = orientation
		if (refreshMediaQueries() || flipped) {
			restyleAllContainers()
		}
		for (const listener of mediaListeners) {
			listener()
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
	// The window-level Escape sink for the shared layer stack. The window
	// root is always in the key propagation path — when modal suppression
	// leaves nothing inside the host focused, events target the root itself
	// and a host-level controller would never fire. Bound eagerly so the
	// controller is part of the root's baseline, not a per-layer add-on.
	if (!container.layerKeyController) {
		const keys = new Gtk.EventControllerKey()
		keys.connect('key-pressed', (_controller: any, keyval: number) => {
			if (keyval !== Gdk.KEY_Escape) { return false }
			const sink = container.layerKeySink
			if (!sink) { return false }
			let prevented = false
			sink({ key: 'Escape', isComposing: false, preventDefault: () => { prevented = true } })
			return prevented
		})
		root.add_controller(keys)
		container.layerKeyController = keys
	}
	const ids: number[] = []
	// Focus-visible input modality — capture-phase so the watch sees input
	// before the target widget. Chorded shortcuts do not count as keyboard
	// modality (same rule as the web leaf's meta/alt/ctrl exclusion — the
	// modifier mask carries the just-pressed key, so a bare Control/Alt/Meta
	// press is excluded while Shift alone still counts, exactly like web).
	// The pointer watch is an EventControllerLegacy: it observes without ever
	// claiming, where a capture-phase Gtk.GestureClick would steal presses
	// from every descendant's gesture.
	if (!container.modalityControllers) {
		const keys = new Gtk.EventControllerKey()
		keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
		keys.connect(
			'key-pressed',
			(_controller: any, keyval: number, _code: number, modifiers: number) => {
				if (!MODIFIER_KEYVALS.has(keyval) && (modifiers & SHORTCUT_MODIFIERS) === 0) {
					setInputModality('keyboard')
				}
				return false
			},
		)
		const pointer = new Gtk.EventControllerLegacy()
		pointer.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
		pointer.connect('event', (_controller: any, event: any) => {
			const type = event?.get_event_type?.()
			if (type === Gdk.EventType.BUTTON_PRESS || type === Gdk.EventType.TOUCH_BEGIN) {
				setInputModality('pointer')
			}
		})
		root.add_controller(keys)
		root.add_controller(pointer)
		container.modalityControllers = [keys, pointer]
		try {
			ids.push(
				root.connect('notify::is-active', () => {
					if (!root.is_active) {
						setInputModality('unknown')
					}
				}),
			)
		} catch {
			// pre-window roots — modality stays at its last observed value
		}
	}
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
	const wireSurface = () => {
		if (container.surfaceWired) {
			return
		}
		try {
			const surface = root.get_surface?.()
			if (!surface) {
				return
			}
			container.surfaceWired = true
			// GdkSurface::layout fires once the new size is live — after a
			// set_default_size request AND for WM-driven resizes that never
			// touch the default-width property — so the media env reads
			// fresh numbers.
			ids.push(surface.connect('layout', () => onWindowResize()))
		} catch {
			// no surface access — the default-size notifies above still cover it
		}
	}
	wireSurface()
	try {
		ids.push(root.connect('realize', wireSurface))
	} catch {
		// older GTK — covered by the default-size notifies above
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
			settings.connect(signal, () => {
				restyleAllContainers()
				notifyAppearance()
			})
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
	const view = physicalView(node)
	if (!view) {
		return
	}
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
		if (horizontal) {
			valign ??= cross
		} else {
			halign ??= cross
		}
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
	if (node.textView) {
		// GTK size requests are minima. Do not let natural content enlarge a
		// control with an authored dimension in a native layout container.
		node.textView.scroller.propagate_natural_width = width < 0
		node.textView.scroller.propagate_natural_height = height < 0
	}
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

/** Layout exclusion also needs native visibility: a zero-size Mason parent
 * can otherwise keep mapped descendants at their previous GTK allocation. */
function syncVisibility(node: ElementNode, force = false) {
	const layout = physicalView(node)
	if (!layout) {
		return
	}
	const source = node.appliedStyle ?? {}
	const managed =
		source.display === 'none' ||
		source.visibility != null ||
		node.props.visible != null ||
		node.props.visibility != null
	if (!managed && !node.styleVisibility && !force) {
		return
	}
	node.styleVisibility = managed
	const visibility = source.visibility ?? node.props.visibility
	const visible =
		source.display !== 'none' && node.props.visible !== false && visibility !== 'collapse'
	layout.set_visible(visible)
	layout.set_child_visible(visibility !== 'hidden')
}

/** CSS-driven widget writes that GTK CSS cannot express — direction,
 *  child-visibility, label wrapping/ellipsize/lines, and alignment outside
 *  Mason subtrees. Each key restores the prop value or widget default when
 *  it leaves the effective style. */
function applyStyleViewProps(node: ElementNode, view: GtkView, style: PropBag) {
	const source = style ?? {}
	const layout = physicalView(node)!

	if (source.direction != null) {
		const d =
			source.direction === 'rtl'
				? Gtk.TextDirection.RTL
				: source.direction === 'ltr'
					? Gtk.TextDirection.LTR
					: Gtk.TextDirection.NONE

		view.set_direction(d)
		if (layout !== view) {
			layout.set_direction(d)
		}
		node.styleDirection = true
	} else if (node.styleDirection) {
		node.styleDirection = false
		view.set_direction(Gtk.TextDirection.NONE)
		if (layout !== view) {
			layout.set_direction(Gtk.TextDirection.NONE)
		}
	}

	// Preserve hidden space, collapse/display:none remove it; also unmap widgets.
	syncVisibility(node)

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
				layout.set_halign(halign)
				node.styleHAlign = true
			}

			const valign = ALIGN[String(source.verticalAlign)]
			if (valign !== undefined) {
				layout.set_valign(valign)
				node.styleVAlign = true
			}
		}
	}
	if (source.horizontalAlign == null && node.styleHAlign) {
		node.styleHAlign = false
		const pv = ALIGN[String(node.props.horizontalAlignment ?? node.props.halign)]
		layout.set_halign(pv ?? Gtk.Align.FILL)
	}
	if (source.verticalAlign == null && node.styleVAlign) {
		node.styleVAlign = false
		const pv = ALIGN[String(node.props.verticalAlignment ?? node.props.valign)]
		layout.set_valign(pv ?? Gtk.Align.FILL)
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
	textview: {
		text: '',
		value: '',
		hint: '',
		placeholder: '',
		maxLength: Infinity,
		editable: true,
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
	default: Gtk.InputPurpose.FREE_FORM,
	decimal: Gtk.InputPurpose.NUMBER,
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
	group: Gtk.AccessibleRole.GROUP,
	button: Gtk.AccessibleRole.BUTTON,
	link: Gtk.AccessibleRole.LINK,
	image: Gtk.AccessibleRole.IMG,
	img: Gtk.AccessibleRole.IMG,
	text: Gtk.AccessibleRole.LABEL,
	label: Gtk.AccessibleRole.LABEL,
	slider: Gtk.AccessibleRole.SLIDER,
	adjustable: Gtk.AccessibleRole.SLIDER,
	progressbar: Gtk.AccessibleRole.PROGRESS_BAR,
	checkbox: Gtk.AccessibleRole.CHECKBOX,
	switch: Gtk.AccessibleRole.SWITCH,
	radio: Gtk.AccessibleRole.RADIO,
	radiogroup: Gtk.AccessibleRole.RADIO_GROUP,
	// Landmark roles for useLandmark — GTK4's AccessibleRole carries the ARIA
	// landmark set. The shared `Role` union omits them, so they only arrive
	// through free-string role props (landmarkProps, layer props).
	main: Gtk.AccessibleRole.MAIN,
	navigation: Gtk.AccessibleRole.NAVIGATION,
	search: Gtk.AccessibleRole.SEARCH,
	form: Gtk.AccessibleRole.FORM,
	region: Gtk.AccessibleRole.REGION,
	banner: Gtk.AccessibleRole.BANNER,
	contentinfo: Gtk.AccessibleRole.CONTENTINFO,
	complementary: Gtk.AccessibleRole.COMPLEMENTARY,
}

function setAccessibleRole(node: ElementNode, value: unknown) {
	const view = node.view
	if (!view) {
		return
	}
	node.defaultAccessibleRole ??= view.get_accessible_role()
	const role = value == null ? node.defaultAccessibleRole : A11Y_ROLES[String(value)]
	if (role === undefined) {
		return
	}
	// GTK rejects even an identical assignment after its AT context realizes.
	if (view.get_accessible_role() !== role) {
		view.accessible_role = role
	}
	if (node.type === 'masonview') {
		view.set_focusable(
			node.props.accessible !== false &&
				[
					Gtk.AccessibleRole.BUTTON,
					Gtk.AccessibleRole.LINK,
					Gtk.AccessibleRole.CHECKBOX,
					Gtk.AccessibleRole.SWITCH,
					Gtk.AccessibleRole.RADIO,
					Gtk.AccessibleRole.SLIDER,
				].includes(role),
		)
	}
	node.pressKeys?.refresh()
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
	const view = physicalView(node)
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

function entryCursor(view: GtkView): number {
	// GtkEntry's GtkEditable wrapper normalizes its delegate's selection
	// bounds, so get_position() returns the upper bound for a backward range.
	// Read the delegate's documented cursor-position property instead.
	return Number((view.get_delegate?.() ?? view).cursor_position ?? view.get_position())
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
	wantCursor: number,
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
		const intact =
			(wantSel ? has && s === wantS && e === wantE : !has) && entryCursor(view) === wantCursor
		if (!intact) {
			if (wantSel) {
				view.select_region(wantCursor === wantS ? wantE : wantS, wantCursor)
			} else {
				view.set_position(wantCursor)
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
		const pos = entryCursor(view)
		const [selStart, selEnd] = selectionBounds(view)
		view.set_text(text)
		const length = Array.from(text).length
		const wantS = selStart >= 0 ? Math.min(selStart, length) : Math.min(pos, length)
		const wantE = selStart >= 0 ? Math.min(selEnd, length) : wantS
		const wantSel = wantS !== wantE
		const wantCursor = wantSel ? Math.min(pos, length) : wantS
		if (wantSel) {
			view.select_region(wantCursor === wantS ? wantE : wantS, wantCursor)
		} else {
			view.set_position(wantS)
		}
		scheduleSelectionSettle(node, view, text, wantSel, wantS, wantE, wantCursor)
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
	if (name === 'src' && node.picture) {
		node.picture.setSource(value)
		return
	}
	if (name === 'accessibilityState') {
		return
	}
	if (name === 'accessibilityRole') {
		setAccessibleRole(node, value)
		return
	}
	if (name === 'accessibilityLabel' || name === 'accessibilityHint') {
		if (!view) {
			return
		}
		if (name === 'accessibilityLabel') {
			view.set_name(widgetName(node))
		}
		const property =
			name === 'accessibilityLabel'
				? Gtk.AccessibleProperty.LABEL
				: Gtk.AccessibleProperty.DESCRIPTION
		try {
			if (value == null) {
				view.reset_property(property)
			} else {
				view.update_property([property], [String(value)])
			}
		} catch (error) {
			warnOnce(
				name,
				'<' + node.type + '> could not set GTK accessible text: ' + (error as Error).message,
			)
		}
		return
	}
	if (
		value === undefined &&
		['textfield', 'textview'].includes(node.type) &&
		name in RESET_DEFAULTS[node.type]
	) {
		setProp(node, name, RESET_DEFAULTS[node.type][name])
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

	const layout = physicalView(node)!
	switch (name) {
		case 'visible':
		case 'visibility':
			syncVisibility(node, true)
			return
		case 'opacity':
			layout.set_opacity(Number(value))
			return
		case 'enabled':
		case 'isEnabled':
		case 'disabled':
			layout.set_sensitive(
				node.props.disabled !== true &&
					node.props.isEnabled !== false &&
					node.props.enabled !== false,
			)

			return
		case 'width':
		case 'height': {
			const [w, h] = layout.get_size_request()
			layout.set_size_request(
				name === 'width' ? dimension(value) : w,
				name === 'height' ? dimension(value) : h,
			)

			return
		}
		case 'horizontalAlignment':
		case 'halign': {
			const align = ALIGN[String(value)]
			if (align !== undefined) {
				layout.set_halign(align)
			}

			return
		}
		case 'verticalAlignment':
		case 'valign': {
			const align = ALIGN[String(value)]
			if (align !== undefined) {
				layout.set_valign(align)
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
				layout.set_valign(align)
			} else {
				layout.set_halign(align)
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
		case 'accessible':
			view.update_state([Gtk.AccessibleState.HIDDEN], [value === false])
			return
		case 'tooltip':
		case 'tooltipText':
			view.set_tooltip_text(String(value ?? ''))
			return
	}

	switch (node.type) {
		case 'image':
		case 'svgview':
			if (name === 'stretch') {
				node.picture!.setStretch(value)
			} else if (name === 'placeholder') {
				node.picture!.setPlaceholder(value)
			} else {
				warn('<' + node.type + '> ignored prop ' + name)
			}
			return
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
		case 'textview':
			if (name === 'secure') {
				if (value === true) {
					throw new Error(
						'linux-gtk: secure multiline input is unavailable; use TextInput with secure instead.',
					)
				}
			} else if (name === 'textAlignment' || name === 'xalign') {
				syncTextAlign(node, view, node.appliedStyle ?? {})
			} else if (name === 'value' || name === 'text') {
				writeEntryText(node, view, value)
			} else if (name === 'hint' || name === 'placeholder') {
				node.textView!.setPlaceholder(value)
			} else if (name === 'maxLength') {
				node.textView!.setMaxLength(value)
			} else if (name === 'editable') {
				view.set_editable(value !== false)
			} else if (name === 'keyboardType') {
				const purpose = INPUT_PURPOSES[String(value)]
				if (purpose !== undefined) {
					view.input_purpose = purpose
				}
			} else if (name === 'autocorrect') {
				const flags = Number(view.input_hints ?? 0)
				view.input_hints = value === false ? flags | 2 : flags & ~2
			} else if (name === 'returnKeyType') {
				warnOnce(
					'textview:return-key-caption',
					'<textview> returnKeyType captions are unavailable on GTK; done/send submit and other Return keys insert a newline.',
				)
			} else {
				warn(`<textview> ignored prop ${name}`)
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
				view.set_editable(value !== false)
			} else if (name === 'maxLength') {
				view.get_buffer?.().set_max_length?.(Number(value))
			} else if (name === 'keyboardType') {
				const purpose = INPUT_PURPOSES[String(value)]
				if (purpose !== undefined) {
					view.input_purpose = purpose
				}
			} else if (name === 'returnKeyType') {
				warnOnce(
					'textfield:return-key-caption',
					'<textfield> returnKeyType captions are unavailable on GTK; Return still emits returnPress.',
				)
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
	syncVisibility(node)
	if (node.view) {
		syncAccessibilityState(node.view, props)
	}
	syncAccessibleName(node)
}

/** Explicit reset for a dropped prop. setProp skips `undefined`, so resets
 *  need their own path — every widget state a prop can write gets its
 *  documented default back here. */
function resetProp(node: ElementNode, name: string) {
	if (name === 'id') {
		setNodeId(node, undefined)
	}
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
	const layout = physicalView(node)!
	switch (name) {
		case 'width':
		case 'height': {
			const [w, h] = layout.get_size_request()
			layout.set_size_request(name === 'width' ? -1 : w, name === 'height' ? -1 : h)
			return
		}
		case 'opacity':
			layout.set_opacity(1)
			return
		case 'visible':
			syncVisibility(node, true)
			return
		case 'enabled':
		case 'isEnabled':
		case 'disabled':
			layout.set_sensitive(
				node.props.disabled !== true &&
					node.props.isEnabled !== false &&
					node.props.enabled !== false,
			)
			return
		case 'visibility':
			syncVisibility(node, true)
			return
		case 'alignSelf':
			layout.set_halign(Gtk.Align.FILL)
			layout.set_valign(Gtk.Align.FILL)
			return
		case 'horizontalAlignment':
		case 'halign':
			layout.set_halign(Gtk.Align.FILL)
			return
		case 'verticalAlignment':
		case 'valign':
			layout.set_valign(Gtk.Align.FILL)
			return
		case 'flexGrow':
			node.flexGrowValue = undefined
			layout.set_hexpand(false)
			layout.set_vexpand(false)
			return
		case 'tooltip':
		case 'tooltipText':
			view.set_tooltip_text(null)
			return
		case 'accessible':
			view.reset_state(Gtk.AccessibleState.HIDDEN)
			return
		case 'src':
			node.picture?.setSource(undefined)
			return
		case 'stretch':
			node.picture?.setStretch('aspectFit')
			return
		case 'accessibilityRole':
			setAccessibleRole(node, undefined)
			return
		case 'accessibilityLabel':
		case 'accessibilityHint':
			if (name === 'accessibilityLabel') {
				view.set_name(widgetName(node))
			}
			try {
				view.reset_property(
					name === 'accessibilityLabel'
						? Gtk.AccessibleProperty.LABEL
						: Gtk.AccessibleProperty.DESCRIPTION,
				)
			} catch {
				// Unsupported GTK binding — the setter already reported the limitation.
			}

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
	// (progress' value/maxValue pair, enabled/disabled aliases) must
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
		out.push(physicalView(node)!)
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
	while (cur !== null && cur.view === null && !cur.portalHost) {
		cur = cur.parent
	}
	return cur?.portalHost ?? cur?.view ?? container.contentHost ?? container.host
}

/** Flattened view position of `node` within its effective parent: count of
 *  view-bearing descendants of preceding siblings. */
function viewIndexOf(
	container: GtkContainer,
	parent: ElementNode | null,
	node: ElementNode,
): number {
	let boundary = parent
	while (boundary && boundary.view === null && !boundary.portalHost) {
		boundary = boundary.parent
	}
	if (boundary?.portalHost) {
		const host = boundary.portalHost
		const first = viewDescendants(node)[0]
		const ordered = viewDescendants(boundary)
		const at = ordered.indexOf(first)
		for (let i = at + 1; at >= 0 && i < ordered.length; i++) {
			if (ordered[i].get_parent() !== host) {
				continue
			}
			let index = 0
			for (let child = host.get_first_child(); child; child = child.get_next_sibling(), index++) {
				if (child === ordered[i]) {
					return index
				}
			}
		}
		let length = 0
		for (let child = host.get_first_child(); child; child = child.get_next_sibling()) {
			length++
		}
		return length
	}
	const siblings = parent === null ? container.children : parent.children
	// A viewless parent occupies a slice of its own effective parent.
	let index =
		parent !== null && parent.view === null && !parent.portalHost
			? viewIndexOf(container, parent.parent, parent)
			: 0
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
	const view = physicalView(node)
	const parentView = hostViewOf(node.container, node.parent)
	if (!(parentView instanceof Gtk.Fixed) || view === null) {
		return
	}
	if (view.get_parent() === parentView) {
		parentView.move(view, node.fixedX, node.fixedY)
	}
}

function repositionGridChild(node: ElementNode) {
	const view = physicalView(node)
	const parentView = hostViewOf(node.container, node.parent)
	if (!(parentView instanceof Gtk.Grid) || view === null) {
		return
	}
	if (view.get_parent() === parentView) {
		parentView.remove(view)
	}
	parentView.attach(
		view,
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
		const scroller = parent.get_parent()
		if (
			scroller instanceof Gtk.ScrolledWindow &&
			scroller.get_child() === parent &&
			parent.get_child?.() === view
		) {
			// GTK inserts a Viewport for non-Scrollable children. Removing
			// only the widget leaves its child slot stale; set_child would
			// then treat a later reinsertion as an unchanged child.
			scroller.set_child(null)
		} else {
			view.unparent()
		}
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
	const nodes: ElementNode[] = []
	const collect = (child: ElementNode) => {
		if (child.view) {
			nodes.push(child)
		} else {
			child.children.forEach(collect)
		}
	}
	collect(node)
	const views = nodes.map((child) => physicalView(child)!)
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
	for (const child of nodes) {
		insertViewInto(parentView, child, physicalView(child)!, index++)
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
	const view = physicalView(node)!
	const parentView = hostViewOf(container, parent)
	if (parentView instanceof Gtk.ScrolledWindow) {
		const existing = parentView.get_child?.()
		if (existing !== null && existing !== undefined && existing !== view) {
			warn('<scrollview> hosts a single view — replacing its current child')
		}

		parentView.set_child(view)
		return
	}
	insertViewInto(parentView, node, view, viewIndexOf(container, parent, node))
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
	if (parent === null) {
		return null
	}
	const target = typeof parent.id === 'number' ? container.portalTargets.get(parent.id) : undefined
	if (
		!target ||
		parent.renderer !== GTK_RENDERER_ID ||
		parent.root !== target.handle.root ||
		parent.$$kind !== 'octane.universal.portal-target'
	) {
		throw new Error('linux-gtk driver: unknown or foreign portal target.')
	}
	if (target.parent?.destroyed) {
		throw new Error('linux-gtk driver: portal target was destroyed before its content.')
	}
	if (target.synthetic && target.parent) {
		markStyleDirty(target.parent, true)
	}
	return target.parent
}

// ---------------------------------------------------------------------------
// Events — universal `event` commands carry {id, type, listener}; dispatch
// goes through root.dispatchEvent so callbacks run under
// their owner record.
// ---------------------------------------------------------------------------

function payloadFor(node: ElementNode, type: string): unknown {
	const view = node.view
	switch (type) {
		case 'change':
			if (view instanceof Gtk.Entry || view instanceof Gtk.TextView) {
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
				value:
					view instanceof Gtk.Entry || view instanceof Gtk.TextView ? view.get_text() : undefined,
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
		case 'focus':
		case 'blur':
			// Merge the NativeEvent identity with the FocusEventPayload
			// contract so both host views of the same event hold. Focus is
			// not cancelable on GTK (same as DOM focus/blur), and GTK4
			// reports no relatedTarget on leave — null is the honest value.
			return {
				eventName: type,
				object: view,
				type,
				target: view,
				currentTarget: view,
				relatedTarget: null,
				preventDefault() {},
				stopPropagation() {},
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
	const eventVersion = node.eventVersions?.get(type)
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
			if (
				node.destroyed ||
				(typeof listener !== 'function' && node.eventVersions?.get(type) !== eventVersion)
			) {
				return
			}
			try {
				if (typeof listener === 'function') {
					if (root) {
						root.eventScope('continuous', () => listener(payload))
					} else {
						listener(payload)
					}
				} else {
					// dispatchEvent opens a scope when needed and inherits an active
					// scope's priority/handler snapshot for synchronous GTK follow-up events.
					root!.dispatchEvent(listener.id, payload)
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
	if (type === 'tap') {
		node.pressKeys?.set(type, handler)
	}
	if (type === 'touch') {
		node.pressKeys?.set(type, (action: string) =>
			dispatch({ eventName: 'touch', object: view, action, x: 0, y: 0 }),
		)
	}

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
							if (pressed) {
								send('up', x, y)
							}
						}),
					},
					{
						emitter: gesture,
						signalId: gesture.connect('cancel', () => {
							if (pressed) {
								send('cancel')
							}
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
							if (active) {
								send('moved', dx, dy)
							}
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
							if (vx === 0 && vy === 0) {
								return
							}
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
		case 'keydown':
		case 'keyup': {
			// Widget-scoped key events in CAPTURE phase — the controller sees
			// keys bound for the widget or any focused descendant before the
			// target handles them, so preventDefault/stopPropagation genuinely
			// suppress the default action (text insertion, focus moves).
			const controller = new Gtk.EventControllerKey()
			controller.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
			const signalId = controller.connect(
				type === 'keydown' ? 'key-pressed' : 'key-released',
				(_controller: any, keyval: number, _keycode: number, modifiers: number) => {
					// Attach onto the normalized event rather than spreading it —
					// preventDefault/stopPropagation close over that object, so a
					// spread copy would discard every claim the handler makes.
					const event = normalizeKeyEvent(keyval, modifiers) as Record<string, any>
					event.eventName = type
					event.object = view
					dispatch(event)
					return event.defaultPrevented === true || event.cancelBubble === true
				},
			)
			view.add_controller(controller)
			return { connections: [{ emitter: controller, signalId }], controllers: [controller] }
		}
		case 'change': {
			if (view instanceof Gtk.TextView) {
				const buffer = view.get_buffer()
				let actionDepth = 0
				let pending = false
				// GTK may delete a selection and insert its replacement within one
				// user action. Report the completed edit, so controlled owners never
				// reconcile the intermediate deletion while native insertion is active.
				return {
					connections: [
						{ emitter: buffer, signalId: buffer.connect('begin-user-action', () => actionDepth++) },
						{
							emitter: buffer,
							signalId: buffer.connect('changed', () => {
								if (node.muted.has('change')) {
									return
								}
								if (actionDepth > 0) {
									pending = true
									cancelSelectionSettle(node)
								} else {
									handler()
								}
							}),
						},
						{
							emitter: buffer,
							signalId: buffer.connect_after('end-user-action', () => {
								actionDepth = Math.max(0, actionDepth - 1)
								if (actionDepth === 0 && pending) {
									pending = false
									handler()
								}
							}),
						},
					],
					controllers: [],
				}
			}
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
			if (view instanceof Gtk.TextView) {
				const controller = new Gtk.EventControllerKey()
				controller.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
				const signalId = controller.connect(
					'key-pressed',
					(_: unknown, key: number, _code: number, modifiers: number) => {
						if (
							![Gdk.KEY_Return, Gdk.KEY_KP_Enter].includes(key) ||
							!['done', 'send'].includes(node.props.returnKeyType) ||
							!view.is_sensitive() ||
							!view.get_editable() ||
							modifiers &
								(Gdk.ModifierType.SHIFT_MASK |
									Gdk.ModifierType.CONTROL_MASK |
									Gdk.ModifierType.ALT_MASK |
									Gdk.ModifierType.SUPER_MASK |
									Gdk.ModifierType.META_MASK)
						) {
							return false
						}
						handler()
						return true
					},
				)
				view.add_controller(controller)
				return { connections: [{ emitter: controller, signalId }], controllers: [controller] }
			}
			return {
				connections: [{ emitter: view, signalId: view.connect('activate', handler) }],
				controllers: [],
			}
		case 'layoutChanged': {
			// Ref-level synthetic event — the public instance's tick-callback
			// bounds watch in public-instance.ts, not a Gtk signal. Wire through
			// view.on so the shared AppShell/resizable leaves see the same
			// { eventName, object } payload native layoutChanged carries.
			view.on('layoutChanged', handler)
			return {
				connections: [
					{
						emitter: { disconnect: () => view.off('layoutChanged', handler) },
						signalId: 0,
					},
				],
				controllers: [],
			}
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
	if (listener === null) {
		node.eventBindings?.delete(type)
	} else {
		;(node.eventBindings ??= new Map()).set(type, listener)
	}
	node.eventSerial = (node.eventSerial ?? 0) + 1
	;(node.eventVersions ??= new Map()).set(type, node.eventSerial)
	const view = node.view
	if (view === null) {
		return
	}
	if (listener === null) {
		node.pressKeys?.set(type, null)
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
	node.eventBindings?.clear()
	node.eventVersions?.clear()
	node.pressKeys?.clear()
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
	const disposeAccessibility = node.view
		? bindAccessibilityMapping(node.view, () => node.props)
		: null
	const textView = node.textView
	const pressKeys = node.view && node.type === 'masonview' ? bindPressKeys(node) : null
	node.pressKeys = pressKeys
	const disposePublic = bindPublicInstance(
		node,
		{
			watchFont: (notify) => {
				const observers = (node.fontObservers ??= new Set())
				observers.add(notify)
				return () => {
					observers.delete(notify)
				}
			},
			read: (key) => {
				const direct = node.localStyle?.[key] ?? node.computedStyle?.[key] ?? node.props[key]
				if (direct !== undefined) {
					return direct
				}
				return (resolveTransform({ ...node.computedStyle, ...node.localStyle }) as any)?.[key]
			},
			write: (key, value) => {
				if (value === undefined) {
					delete node.localStyle?.[key]
				} else {
					;(node.localStyle ??= {})[key] = value
				}
				markStyleDirty(node, false, false)
			},
		},
		(listener) => {
			const view = node.view!
			const wired = connectEvent(node.container, node, view, 'pan', listener)
			return () => {
				for (const connection of wired.connections) {
					connection.emitter.disconnect(connection.signalId)
				}
				for (const controller of wired.controllers) {
					view.remove_controller(controller)
				}
			}
		},
	)
	// Native UI's text-write helper assigns .text imperatively. Route that
	// channel through the same selection/echo contract as declarative writes.
	let textNode: ElementNode | null = ['textfield', 'textview'].includes(node.type) ? node : null
	let disposeEntryInput: (() => void) | undefined
	if (textNode) {
		const view = textNode.view!
		Object.defineProperty(view, 'text', {
			configurable: true,
			get: () => view.get_text(),
			set: (value: unknown) => {
				if (textNode) {
					writeEntryText(textNode, view, value)
				}
			},
		})
		// Cursor movement and selection clicks do not emit text changes. Stop
		// delayed repair on actual input too, before GTK handles that event.
		const input = new Gtk.EventControllerLegacy()
		input.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
		const signal = input.connect('event', (_controller: unknown, event: any) => {
			const type = event.get_event_type()
			if (
				textNode &&
				[Gdk.EventType.KEY_PRESS, Gdk.EventType.BUTTON_PRESS, Gdk.EventType.TOUCH_BEGIN].includes(
					type,
				)
			) {
				cancelSelectionSettle(textNode)
			}
			return false
		})
		view.add_controller(input)
		disposeEntryInput = () => {
			input.disconnect(signal)
			view.remove_controller(input)
		}
	}
	return () => {
		disposeAccessibility?.()
		textView?.dispose()
		pressKeys?.dispose()
		disposeEntryInput?.()
		if (textNode) {
			cancelSelectionSettle(textNode)
		}
		textNode = null
		disposePublic()
	}
}

function createNodeState(
	container: GtkContainer,
	id: number,
	type: string,
	props: PropBag,
	view: GtkView | null,
): ElementNode {
	const textView = takeTextViewControl(view)
	const node: ElementNode = {
		id,
		type,
		view,
		layoutView: textView?.layoutView,
		textView,
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
	return node
}

function createNode(
	container: GtkContainer,
	id: number,
	type: string,
	props: PropBag,
): ElementNode {
	const view = VIEWLESS.has(type) ? null : instantiate(type)
	const node = createNodeState(container, id, type, props, view)
	if (view !== null && isMasonView(view)) {
		// The layout manager's vfuncs resolve the logical node from the
		// widget — link them before props land so style writes find it.
		bindMasonView(view, node)
	}
	if (type === 'image' || type === 'svgview') {
		node.picture = bindPicture(node, import.meta.url)
	}
	node.disposePublicInstance = bindNodePublicInstance(node)
	wireStateFlags(node)
	applyProps(node, props)
	return node
}

function preparePortalTarget(context: UniversalPortalTargetContext<GtkContainer>) {
	if (context.transported) {
		throw new Error(
			'linux-gtk portals require a local GtkWidget target; transported targets are unsupported.',
		)
	}
	const { container, target } = context
	let record = container.portalTargetsByObject.get(target)
	if (!record) {
		let parent: ElementNode | null = null
		let synthetic = false
		if (target instanceof Gtk.Widget) {
			parent = [...container.nodes.values()].find((node) => node.view === target) ?? null
			if (target !== container.host && !parent) {
				if (isMasonHostView(target)) {
					throw new Error('linux-gtk portal: a Mason target must belong to this root.')
				}
				if (
					!(target instanceof Gtk.Box || target instanceof Gtk.Fixed || target instanceof Gtk.Grid)
				) {
					throw new Error('linux-gtk portal: target must be a multi-child GTK layout container.')
				}
				parent = createNodeState(
					container,
					-(container.nextPortalTarget + 1),
					'portal-target',
					{},
					null,
				)
				parent.portalHost = target
				synthetic = true
			} else if (
				parent &&
				!(
					isMasonHostView(target) ||
					target instanceof Gtk.Box ||
					target instanceof Gtk.Fixed ||
					target instanceof Gtk.Grid
				)
			) {
				throw new Error('linux-gtk portal: target must be a multi-child GTK layout container.')
			}
		} else {
			const logical = target as ElementNode | null
			if (
				!logical ||
				logical.container !== container ||
				container.nodes.get(logical.id) !== logical ||
				logical.view !== null ||
				CSS_INERT_TYPES.has(logical.type)
			) {
				throw new Error('linux-gtk portal: target is not a live GTK layout ref.')
			}
			parent = logical
		}
		const host = parent ? hostViewOf(container, parent) : container.host
		if (
			!(
				isMasonHostView(host) ||
				host instanceof Gtk.Box ||
				host instanceof Gtk.Fixed ||
				host instanceof Gtk.Grid
			)
		) {
			throw new Error(
				'linux-gtk portal: target must resolve to a multi-child GTK layout container.',
			)
		}
		const id = ++container.nextPortalTarget
		record = {
			id,
			handle: context.createPortalTargetHandle(id),
			target,
			parent,
			synthetic,
			references: 0,
		}
		container.portalTargets.set(id, record)
		container.portalTargetsByObject.set(target, record)
	}
	if (record.parent?.destroyed) {
		throw new Error('linux-gtk portal: target was destroyed before its content.')
	}
	const handle = context.createPortalTargetHandle(record.id)
	record.references++
	let released = false
	return {
		handle,
		release() {
			if (released) {
				return
			}
			released = true
			if (--record!.references !== 0) {
				return
			}
			container.portalTargets.delete(record!.id)
			container.portalTargetsByObject.delete(target)
			if (record!.synthetic && record!.parent) {
				record!.parent.destroyed = true
				container.cssDirty?.delete(record!.parent)
			}
		},
	}
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

			node.picture?.dispose()
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
			const bindings = [...(node.eventBindings ?? new Map()).entries()]
			const oldView = node.view
			const oldFocus = oldView?.get_root()?.get_focus() ?? null
			const hadFocus = oldFocus !== null && (oldFocus === oldView || oldFocus.is_ancestor(oldView))
			const childFocus =
				hadFocus &&
				node.children.some((child) =>
					viewDescendants(child).some((view) => oldFocus === view || oldFocus.is_ancestor(view)),
				)
					? oldFocus
					: null
			node.picture?.dispose()
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
			node.textView = takeTextViewControl(node.view)
			node.layoutView = node.textView?.layoutView
			wireStateFlags(node)
			node.type = command.type
			node.defaultAccessibleRole = undefined
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
			node.picture =
				command.type === 'image' || command.type === 'svgview'
					? bindPicture(node, import.meta.url)
					: undefined
			if (node.view !== null && isMasonHostView(node.view)) {
				bindMasonView(node.view, node)
			}

			node.disposePublicInstance = bindNodePublicInstance(node)
			applyProps(node, command.props)
			if (node.view !== null) {
				const parentView = hostViewOf(container, node.parent)
				if (parentView instanceof Gtk.ScrolledWindow) {
					parentView.set_child(physicalView(node)!)
				} else {
					insertViewInto(
						parentView,
						node,
						physicalView(node)!,
						viewIndexOf(container, node.parent, node),
					)
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

			// The core retains stable descriptors on ordinary recreated hosts;
			// reconnect them here. A later event command can replace or remove them.
			for (const [type, listener] of bindings) {
				setEvent(container, node, type, listener)
			}

			if (hadFocus) {
				// Retained children keep their native focus delegate; a replaced
				// widget establishes its own delegate when it is still focusable.
				;(childFocus ?? node.view)?.grab_focus()
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
	portals: { prepareTarget: preparePortalTarget },
	id: GTK_RENDERER_ID,
	capabilities: { text: 'host', visibility: true },
	updates: {
		classify(_type, previous, next) {
			// GTK cannot change the role of a realized accessibility context.
			// The core rebinds refs; recreate reconnects retained descriptors.
			const role = (props: Readonly<Record<string, unknown>>) =>
				props.accessibilityRole == null
					? null
					: (A11Y_ROLES[String(props.accessibilityRole)] ?? null)
			return role(previous) === role(next) ? 'update' : 'recreate'
		},
	},
	events: {
		classify(name: string) {
			const definition = EVENT_PROP_TYPE[name]
			return definition === undefined ? null : definition
		},
	},
	prepareBatch(container: GtkContainer, batch: UniversalHostBatch) {
		// Reject renderer/secure-entry mismatches before any command mutates — a
		// partially applied batch cannot be rolled back once apply() commits.
		if (batch.renderer !== GTK_RENDERER_ID) {
			throw new Error(
				`linux-gtk driver: batch renderer ${JSON.stringify(batch.renderer)} does not match.`,
			)
		}
		const types = new Map<number, string>()
		for (const command of batch.commands) {
			if (command.op === 'create' || command.op === 'recreate') {
				types.set(command.id, command.type)
			}
			const type =
				'id' in command
					? (types.get(command.id) ?? container.nodes.get(command.id)?.type)
					: undefined
			if (type === 'textview' && 'props' in command && command.props?.secure === true) {
				throw new Error(
					'linux-gtk: secure multiline input is unavailable; use TextInput with secure instead.',
				)
			}
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

export function createGtkContainer(host: GtkView, options: { service?: boolean } = {}): GtkContainer {
	// A renderer-owned Gtk.Overlay inside the host — the RootLayout
	// equivalent. The root content mounts into its main child; overlay layers
	// (dialogs, sheets, toasts) stack above it via `add_overlay`.
	const overlay = new Gtk.Overlay()
	overlay.set_hexpand(true)
	overlay.set_vexpand(true)
	const contentHost = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
	overlay.set_child(contentHost)
	// Attach the overlay to whatever widget the caller handed in — Box
	// `append`, Fixed `put`, Grid `attach`, or a content-view `set_child`.
	if (host instanceof Gtk.Box) { host.append(overlay) }
	else if (host instanceof Gtk.Fixed) { host.put(overlay, 0, 0) }
	else if (host instanceof Gtk.Grid) { host.attach(overlay, 0, 0, 1, 1) }
	else { host.set_child?.(overlay) }
	const container: GtkContainer = {
		host,
		overlay,
		contentHost,
		overlayLayers: new Set(),
		nodes: new Map(),
		children: [],
		root: null,
		portalTargets: new Map(),
		portalTargetsByObject: new Map(),
		nextPortalTarget: 0,
		popoverChromeUsers: () => popoverChromeUsers(host.get_display()),
	}
	if (options.service) {
		container.service = true
	}
	liveGtkContainers.add(container)
	// The imperative overlay bridge — `ui` resolves `globalThis.__octaneGtkHost`
	// instead of importing the renderer (mirrors macOS `appKitHost()`); it
	// targets the most recently presented live root.
	// `contentHost` is the raw Gtk.Box the bridge layers from — it is not a
	// public-instance view, so the overlay factory is bound on it directly.
	bindOverlayHost(contentHost, container)
	;(globalThis as any).__octaneGtkHost = {
		createOverlayLayer: (options: any) => {
			const last = [...liveGtkContainers].filter((c) => !c.service).at(-1)
			const layer = last?.contentHost?.createOverlayLayer?.(options)
			if (!layer) {
				throw new Error('linux-gtk overlay bridge: no live root with an overlay host.')
			}
			return layer
		},
		// Window-level Escape dispatch for the shared layer stack — ui's
		// `layer-keys.gtk` installs one monitor that routes key events through
		// `dispatchLayerKey` so the topmost overlay/dialog layer handles them
		// (popover sessions keep their own popup-events path).
		installKeyMonitor: (handler: (event: any) => void) => {
			// The eager window controller (wired per root) forwards Escape to
			// the registered sink; registering swaps the handler only.
			container.layerKeySink = handler
			return () => {
				if (container.layerKeySink === handler) { container.layerKeySink = null }
			}
		},
		// Environment + host services for ui's theme/environment leaves —
		// the scheme source is the same Gtk.Settings read the cascade uses
		// and media eval is the same engine instance, so JS answers cannot
		// diverge from styled behavior.
		getColorScheme: () => cssSchemeName(),
		onColorSchemeChange: (listener: () => void) => {
			colorSchemeListeners.add(listener)
			return () => {
				colorSchemeListeners.delete(listener)
			}
		},
		matchMedia: (query: string) => {
			try {
				return evalMediaQuery(String(query))
			} catch {
				return false
			}
		},
		onMediaChange: (listener: () => void) => {
			mediaListeners.add(listener)
			return () => {
				mediaListeners.delete(listener)
			}
		},
		// Focus-visible input modality — the last observed input kind on any
		// window root ('keyboard' | 'pointer' | 'unknown'). ui's
		// use-focus-visible.gtk subscribes here instead of inventing its own
		// GTK tracking.
		getInputModality: () => inputModality,
		onInputModalityChange: (listener: () => void) => {
			inputModalityListeners.add(listener)
			return () => {
				inputModalityListeners.delete(listener)
			}
		},
		// Named-theme token rules register with the shared css-engine — the
		// same registration a bundled stylesheet gets.
		registerStylesheet: (name: string, css: string) => {
			try {
				registerStylesheet(String(name), String(css))
				return true
			} catch {
				return false
			}
		},
		// AT announcement on the app root's host widget — GtkAccessible.announce
		// posts to the AT backend (AT-SPI) on GTK >= 4.14; absent there this
		// reports false so callers record the miss rather than throw.
		announce: (text: string, politeness?: string) => {
			try {
				const last =
					[...liveGtkContainers].filter((c) => !c.service).at(-1) ??
					[...liveGtkContainers].at(-1)
				const widget = last?.host
				// GtkAccessible.announce + priority enum are GTK >= 4.14; the
				// vendored GI types predate them, so read through `any` like the
				// gtk-interface-color-scheme watch above.
				const Priority = (Gtk as any).AccessibleAnnouncementPriority
				if (typeof widget?.announce !== 'function' || Priority === undefined) {
					return false
				}
				const priority =
					politeness === 'assertive' ? Priority.HIGH : Priority.MEDIUM
				widget.announce(String(text), priority)
				return true
			} catch {
				return false
			}
		},
		// Service surfaces with no declaring node (the toast fallback stack)
		// mount a dedicated universal root inside an overlay layer's target —
		// the macOS presentSurface equivalent. The root unmounts with the
		// layer.
		mountServiceRoot: (layer: any, component: any, props: any) => {
			if (!layer?.target) {
				throw new Error('linux-gtk overlay bridge: mountServiceRoot needs a layer handle.')
			}
			const mounted = createGtkRoot(layer.target, { service: true })
			mounted.root.render(component, props)
			const release = layer.dispose?.bind(layer)
			if (typeof release === 'function') {
				layer.dispose = () => {
					try { mounted.root.unmount() } catch { }
					release()
				}
			}
			return {
				root: mounted.root,
				unmount: () => {
					try { mounted.root.unmount() } catch { }
				},
			}
		},
		// `openWindow` from @octane-xplat/ui (windows.gtk) — a Gtk.Window per
		// call with its own universal root, the GTK counterpart of the macOS
		// __xplatAppKitOpenWindow + setWindowContentResolver seam.
		openWindow: (options: any) => windowService().openWindow(options ?? {}),
		setWindowContentResolver: (resolve: any) =>
			windowService().setWindowContentResolver(resolve),
		// External-URL open seam for ui's nav-href.gtk — Gtk.show_uri_full on
		// the app's main window (GTK >= 4.10). Returns false when the request
		// cannot be made so callers surface the failure instead of assuming
		// the OS took it.
		openUri: (uri: string) => {
			try {
				const show = (Gtk as any).show_uri_full
				if (typeof show !== 'function') {
					return false
				}
				show(mainGtkWindow(), String(uri), null, () => {})
				return true
			} catch {
				return false
			}
		},
		// Viewport basis for resizable regions without a containerRef — the
		// main window's content size, the screen-fallback analog.
		getWindowSize: () => {
			const win = mainGtkWindow()
			if (!win) {
				return null
			}
			const width = win.get_width?.() ?? 0
			const height = win.get_height?.() ?? 0
			return width > 0 && height > 0 ? { width, height } : null
		},
	}
	// Gtk.Settings exists only after Gtk.init — the first container is the
	// earliest point appearance watches can connect.
	observeGtkSettings()
	if (!options.service) {
		wireContainerWindow(container)
	}
	// Prime the media-query cache and the tracked orientation so the first
	// resize diff compares against a baseline, not an empty cache.
	refreshMediaQueries()
	lastOrientation = cssOrientation()
	emittedScheme = cssSchemeName()
	return container
}

export interface GtkRootOptions extends UniversalRootOptions<GtkContainer> {
	/** Service roots mount inside another root's overlay layer — they never
	 *  become the `__octaneGtkHost` bridge's layer target and skip the
	 *  duplicate window wiring the owning app root already provides. */
	service?: boolean
}

export function createGtkRoot(host: GtkView, options: GtkRootOptions = {}) {
	const container = createGtkContainer(host, { service: options.service === true })
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
	// Root teardown also releases the renderer-owned overlay host: live
	// layers are disposed, the Gtk.Overlay is detached so the caller's host
	// empties exactly as before, and the imperative bridge is cleared once
	// the last root goes away.
	const universalUnmount = root.unmount.bind(root)
	;(root as any).unmount = () => {
		universalUnmount()
		for (const layer of Array.from(container.overlayLayerHandles ?? [])) { layer.dispose() }
		const overlay = container.overlay
		if (overlay) {
			const parent = overlay.get_parent?.()
			if (parent === host && (host instanceof Gtk.Box || host instanceof Gtk.Fixed || host instanceof Gtk.Grid)) { host.remove(overlay) }
			else if (parent === host) { host.set_child?.(null) }
		}
		liveGtkContainers.delete(container)
		if (liveGtkContainers.size === 0) { delete (globalThis as any).__octaneGtkHost }
	}
	return { root, container }
}

export { registerStylesheet } from '@octane-xplat/css-engine'

export * from 'octane/universal/native'
