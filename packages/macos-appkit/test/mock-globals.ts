import { createContainerAdapters } from '../src/container-adapters.ts'
import { createControlAdapters } from '../src/control-adapters.ts'
import { createPilotAdapters } from '../src/pilot-adapters.ts'
import { unconvertedElementTypes } from '../src/element-adapter.ts'
import { legacyActionBoundary } from './legacy-action-boundary.ts'
import { createAccessibilityState } from '../src/accessibility-state.ts'
import { FailureCollector } from '../src/failures.ts'
import { withLayoutBatch } from '../src/layout-batch.ts'
import { builtinFixtureHelpers } from './renderer-source.ts'
import { correctProjectionRadii, correctProjectionShadows } from '../src/projection-paint.ts'
import { normalizeHostStyleProps } from '../src/inline-style.ts'
import { borderStyleSides, hiddenBorderStyle, borderStrokeStyle } from '../src/border-styles.ts'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
// Object.assign can't touch globals installed by @nativescript/macos-node-api
// (imported transitively via @octane-xplat/platform/macos) — they land as
// configurable, get-only properties. defineProperty with a value descriptor
// replaces them; restore() puts the original descriptors back.
export function mockGlobals(entries: Record<string, unknown>) {
  const originals = Object.fromEntries(
    Object.keys(entries).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  )

  for (const [key, value] of Object.entries(entries)) {
    const descriptor = originals[key]
    if (descriptor && !descriptor.configurable && !descriptor.writable) {
      // A few bridge globals (NativeClass, objc) are locked by the runtime —
      // mocks can't replace them; the real values are usable anyway.
      continue
    }

    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true })
  }

  return function restore() {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) {
        if (!descriptor.configurable && !descriptor.writable) {
          continue
        }

        Object.defineProperty(globalThis, key, descriptor)
      } else {
        delete (globalThis as any)[key]
      }
    }
  }
}

// vm-eval tests splice source files into script contexts — the platform
// imports added for module-scoped native types aren't valid in script eval,
// and the sandbox injects those names as globals anyway. Strip them.
export function sourceWithoutImports(url: URL) {
  return stripTypeScriptTypes(readFileSync(url, 'utf8')).replace(
    /^import\b[\s\S]*?(?:from\s*)?['"][^'"]*['"];?\s*\n/gm,
    '',
  )
}

const SLICE_BASE = {
  createPilotAdapters,
  createControlAdapters,
  createContainerAdapters,
  unconvertedElementTypes,
  AccessibleHostView: class {},
  createAccessibilityState,
  setTimeout,
  clearTimeout,
  withLayoutBatch,
  FailureCollector,
  normalizeHostStyleProps,
  borderStyleSides,
  hiddenBorderStyle,
  borderStrokeStyle,
  correctProjectionRadii,
  correctProjectionShadows,
}

const RAW_SLICE_CONTEXT = Symbol('macos-appkit.raw-slice-context')

/** `runInNewContext` for src/index.ts slices: prepends CSS_SLICE_STUBS so
 *  slices that reference cascade helpers they don't include still run. */
export function runSlice(code: string, context?: Record<string, any>) {
  if (context?.deps) {
    if (context.deps.actions?.actionHandlers) {
      context.deps.actions = {
        ...legacyActionBoundary(context.deps.actions),
        ...context.deps.actions,
      }
    }
    context.deps.state ??= createAccessibilityState()
  }
  if (context && (context as any)[RAW_SLICE_CONTEXT]) {
    // A raw (spy) context is the sandbox itself. Seed the shared helpers as
    // own properties so `has`/`get` resolve them before falling to spies.
    for (const [key, value] of Object.entries(SLICE_BASE)) {
      if (!Object.getOwnPropertyDescriptor(context, key)) {
        Object.defineProperty(context, key, { value, writable: true, configurable: true })
      }
    }

    return runInNewContext(CSS_SLICE_STUBS + '\n' + builtinFixtureHelpers() + '\n' + code, context)
  }
  return runInNewContext(CSS_SLICE_STUBS + '\n' + builtinFixtureHelpers() + '\n' + code, {
    ...SLICE_BASE,
    ...context,
  })
}

/** Sandbox for slices that need recording spies: every referenced name not in
 *  the target, globalThis or CSS_SLICE_STUBS resolves to a `function` spy that
 *  records calls on `target[name].calls`. (A plain spread context cannot do
 *  this — undeclared globals need the sandbox's `has` trap to resolve.) */
export function spySliceContext(target: Record<string, any> = {}) {
  const sandbox = new Proxy(target, {
    has(t, key) {
      if (typeof key !== 'string') {
        return key in t
      }
      return key in t || key in globalThis || !SLICE_STUB_NAMES.has(key)
    },
    get(t, key) {
      if (key in t) {
        return (t as any)[key]
      }
      if (typeof key !== 'string') {
        return undefined
      }
      if (key in globalThis) {
        return (globalThis as any)[key]
      }
      const calls: any[][] = []
      // A `function` (not an arrow) stays a valid `instanceof` right side.
      const spy: any = function (...args: any[]) {
        calls.push(args)
      }
      spy.calls = calls
      return ((t as any)[key] = spy)
    },
  })
  Object.defineProperty(target, RAW_SLICE_CONTEXT, { value: true })
  return sandbox
}

// Slices eval fragments of src/index.ts without the CSS cascade module —
// these fallbacks fill names the slices reference but don't include. Real
// function declarations in the slice and sandbox-provided globals win.
const CSS_SLICE_STUBS = `
${sourceWithoutImports(new URL('../src/picker-adapters.ts', import.meta.url)).replace(/^export /gm, '')}
${sourceWithoutImports(new URL('../src/text-adapters.ts', import.meta.url)).replace(/^export /gm, '')}
// Legacy slices use the same pilot definitions with their existing native fakes.
// Production composition and ordering are exercised by adapter-protocol tests.
var contentGeometryLeases = new WeakMap()
var elementAdapters = { registerElementType: (...args) => registerElementType(...args) }
var adapters = { lookup(type) {
  const pilots = createPilotAdapters({
    controls: { makeButton: (...args) => makeButton(...args), applyBuiltinButtonProp: (...args) => applyBuiltinButtonProp(...args) },
    containers: { makeContentView: (...args) => makeContentView(...args), contentViewNodesByView: typeof contentViewNodesByView === 'undefined' ? new WeakMap() : contentViewNodesByView,
      observeContentGeometry: (...args) => observeContentGeometry(...args), applyBuiltinContentHostProp: (...args) => applyBuiltinContentHostProp(...args), disposeBuiltinContentHost: (...args) => disposeBuiltinContentHost(...args) },
    actions: { disposeActions: (...args) => disposeActions(...args) },
    layout: { queueLayoutReconcile: (...args) => queueLayoutReconcile(...args), layoutContentChild: (...args) => layoutContentChild(...args) },
  })
  const controls = createControlAdapters({ controls: new Proxy({}, { get: (_target, key) => (...args) => globalThis[key](...args) }), actions: { disposeActions: (...args) => disposeActions(...args) } })
  const text = createTextAdapters({ textElements: { applyBuiltinHtmlViewProp: (...args) => applyBuiltinHtmlViewProp(...args), applyBuiltinLabelProp: (...args) => applyBuiltinLabelProp(...args), disposeBuiltinFormattedText: (...args) => disposeBuiltinFormattedText(...args), disposeTextLinks: (...args) => disposeTextLinks(...args), makeLabel: (...args) => makeLabel(...args), syncHtmlView: (...args) => syncHtmlView(...args), syncLabelOverflow: (...args) => syncLabelOverflow(...args), syncText: (...args) => syncText(...args) }, inputElements: { applyBuiltinSearchBarProp: (...args) => applyBuiltinSearchBarProp(...args), applyBuiltinTextInputProp: (...args) => applyBuiltinTextInputProp(...args), disposeBuiltinTextInput: (...args) => disposeBuiltinTextInput(...args), disposeBuiltinTextViewLayout: (...args) => disposeBuiltinTextViewLayout(...args), fitTextView: (...args) => fitTextView(...args), initializeTextViewport: (...args) => initializeTextViewport(...args), makeSearchBar: (...args) => makeSearchBar(...args), makeTextField: (...args) => makeTextField(...args), setTextFieldPlaceholder: (...args) => setTextFieldPlaceholder(...args), syncSearchBar: (...args) => syncSearchBar(...args), syncSecureTextField: (...args) => syncSecureTextField(...args), textNodesByView: (...args) => textNodesByView(...args) }, actions: { acquireAction: (...args) => acquireAction(...args), buttonActionTarget: typeof buttonActionTarget === 'undefined' ? {} : buttonActionTarget, disposeActions: (...args) => disposeActions(...args) } })
  const pickers = createPickerAdapters({ pickerElements: { timeOfDay: (...args) => timeOfDay(...args), calendarDate: (...args) => calendarDate(...args), makeSegmentedBar: (...args) => makeSegmentedBar(...args), applyBuiltinSegmentedBarProp: (...args) => applyBuiltinSegmentedBarProp(...args), syncSegmentedBar: (...args) => syncSegmentedBar(...args), makeListPicker: (...args) => makeListPicker(...args), applyBuiltinListPickerProp: (...args) => applyBuiltinListPickerProp(...args), syncListPicker: (...args) => syncListPicker(...args), makeTimePicker: (...args) => makeTimePicker(...args), applyBuiltinTimePickerProp: (...args) => applyBuiltinTimePickerProp(...args), syncTimePicker: (...args) => syncTimePicker(...args), makeDatePicker: (...args) => makeDatePicker(...args), applyBuiltinDatePickerProp: (...args) => applyBuiltinDatePickerProp(...args), syncDatePicker: (...args) => syncDatePicker(...args), disposeBuiltinSegmentedItem: (...args) => disposeBuiltinSegmentedItem(...args), disposeBuiltinSegmentedChildren: (...args) => disposeBuiltinSegmentedChildren(...args), disposeBuiltinSegmentedControl: (...args) => disposeBuiltinSegmentedControl(...args), disposeBuiltinListPicker: (...args) => disposeBuiltinListPicker(...args), disposeBuiltinTimePicker: (...args) => disposeBuiltinTimePicker(...args), disposeBuiltinDatePicker: (...args) => disposeBuiltinDatePicker(...args) }, actions: { disposeActions: (...args) => disposeActions(...args) } })
  const containers = createContainerAdapters({
    containers: new Proxy({}, { get: (_target, key) => String(key).endsWith('ByView') ? globalThis[key] : (...args) => globalThis[key](...args) }),
    layout: { queueLayoutReconcile: (...args) => queueLayoutReconcile(...args), layoutRootChildren: (...args) => layoutRootChildren(...args) },
    actions: { disposeActions: (...args) => disposeActions(...args) },
    cssCascade: { setNodeInlineStyle: (...args) => setNodeInlineStyle(...args), applyClassName: (...args) => applyClassName(...args) },
    projection: { disposeBuiltinProxyChildren: (...args) => disposeBuiltinProxyChildren(...args) },
  })
  return pilots[type] ?? controls[type] ?? text[type] ?? pickers[type] ?? containers[type]
} }

// Legacy branch tests supply mutable maps as their fake event boundary. New
// ownership tests construct the real stores and feature factories directly.
if (typeof canDispatch === 'undefined') var canDispatch = (n) => n.lifecycle !== 'disposing' && n.lifecycle !== 'disposed' && !n.props?.disabled && n.props?.isEnabled !== false && n.props?.enabled !== false
globalThis.actionIdsByView ??= new WeakMap()
globalThis.linkOwners ??= new WeakMap()
globalThis.linkOwnersByView ??= new WeakMap()
if (typeof disposeTextLinks === 'undefined') var disposeTextLinks = () => {}
globalThis.nodeActions ??= new WeakMap()
globalThis.panViewsByNode ??= new WeakMap()
globalThis.panHandlersByView ??= new WeakMap()
globalThis.clickRecognizersByView ??= new WeakMap()
globalThis.panRecognizersByView ??= new WeakMap()
globalThis.legacyAxState ??= createAccessibilityState()
globalThis.leases ??= new WeakMap()
if (typeof getAccessibilityProps === 'undefined') var getAccessibilityProps = (view) => legacyAxState.get(view)
if (typeof accessibilityLease === 'undefined') var accessibilityLease = (node) => {
  let record = leases.get(node)
  if (!record || record.view !== node.view || !record.lease.current()) {
    record?.lease.release()
    record = {view: node.view, lease: legacyAxState.acquire(node.view)}
    leases.set(node, record)
  }
  return record.lease
}
if (typeof disposeAccessibility === 'undefined') var disposeAccessibility = (node) => {
  leases.get(node)?.lease.release(); leases.delete(node)
}
if (typeof idForView === 'undefined') var idForView = (view) => actionIdsByView.get(view)
if (typeof hasHandler === 'undefined') var hasHandler = (view) => typeof actionHandlers.get(actionIdsByView.get(view) ?? cssNodesByView.get(view)?.actionId) === 'function'
if (typeof allocate === 'undefined') var allocate = (view) => {
  const id = nextActionId++
  actionHandlers.set(id, null)
  if (view) actionIdsByView.set(view, id)
  let active = true
  return {id, setHandler(handler) { if(active) actionHandlers.set(id, handler ?? null) }, release() {
    active = false; actionHandlers.delete(id)
    if(view && actionIdsByView.get(view) === id) actionIdsByView.delete(view)
  }}
}
if (typeof adoptAction === 'undefined') var adoptAction = (node, action) => {
  nodeActions.get(node)?.release(); nodeActions.set(node, action); node.actionId = action.id; return action.id
}
if (typeof acquireAction === 'undefined') var acquireAction = (node, view) => adoptAction(node, allocate(view))
if (typeof setNodeHandler === 'undefined') var setNodeHandler = (node, handler) => {
  if(nodeActions.has(node)) nodeActions.get(node).setHandler(handler)
  else actionHandlers.set(node.actionId, handler ?? null)
}
if (typeof disposeActions === 'undefined') var disposeActions = (node) => {
  nodeActions.get(node)?.release(); nodeActions.delete(node)
  if(typeof actionHandlers !== 'undefined') actionHandlers.delete(node.actionId)
  node.submitHandler = null
  if(node.panGestureRecognizer) node.panGestureRecognizer.enabled = false
}

if (typeof notifyLayoutCommit === 'undefined') var notifyLayoutCommit = () => {}
globalThis.disabledFocusTargets ??= { allows: () => false }
if (typeof effectiveStyle === 'undefined') var effectiveStyle = (n) => n.computedStyle ?? n.props?.style ?? {}
if (typeof markStyleDirty === 'undefined') var markStyleDirty = () => {}
if (typeof flushStyleDirty === 'undefined') var flushStyleDirty = () => {}
if (typeof drainLayoutDirty === 'undefined') var drainLayoutDirty = (dirty) => {
	for (const p of dirty) {
		if ((p.projectedChildren || p.children.some((c) => c.type === 'proxyviewcontainer')) && typeof syncProxyProjection === 'function') syncProxyProjection(p)
	}
	for (const p of dirty) if (typeof reconcileLayoutParent === 'function') reconcileLayoutParent(p)
}
if (typeof setNodeInlineStyle === 'undefined') var setNodeInlineStyle = (n, v) => { n.props.style = v; if (typeof applyStyle === 'function') applyStyle(n, v) }
if (typeof setNodeClassName === 'undefined') var setNodeClassName = (n, v) => { n.cssClasses = new Set(String(v ?? '').split(/\\s+/).filter(Boolean)) }
if (typeof setNodeId === 'undefined') var setNodeId = (n, v) => { n.cssId = v == null ? undefined : String(v) }
if (typeof setPseudoClass === 'undefined') var setPseudoClass = () => {}
if (typeof stylesheetPseudoClasses === 'undefined') var stylesheetPseudoClasses = () => new Set()
if (typeof syncNormalState === 'undefined') var syncNormalState = () => {}
if (typeof syncContainerPseudoState === 'undefined') var syncContainerPseudoState = () => {}
if (typeof setVisualStateTracking === 'undefined') var setVisualStateTracking = () => {}
if (typeof syncPseudoTracking === 'undefined') var syncPseudoTracking = () => {}
globalThis.cssNodesByView ??= new WeakMap()
if (typeof sampleKeyframeAnimation === 'undefined') var sampleKeyframeAnimation = () => ({ values: {}, done: true })
if (typeof resolveTranslate === 'undefined') var resolveTranslate = (v) => (typeof v === 'number' ? v : 0)
if (typeof transformToParts === 'undefined') var transformToParts = () => undefined
if (typeof stopSubtreeAnimations === 'undefined') var stopSubtreeAnimations = () => {}
if (typeof cancelKeyframeAnimations === 'undefined') var cancelKeyframeAnimations = () => false
if (typeof syncInputChrome === 'undefined') var syncInputChrome = () => {}
if (typeof syncText === 'undefined') var syncText = () => {}
if (typeof syncHtmlView === 'undefined') var syncHtmlView = () => {}
if (typeof restyleNode === 'undefined') var restyleNode = () => {}
if (typeof cssChildren === 'undefined') var cssChildren = (n) => n.children.filter((c) => c.view != null || c.type === 'proxyviewcontainer')
if (typeof refreshCssClasses === 'undefined') var refreshCssClasses = (n) => { n.cssClasses = n.cssBaseClasses ?? new Set() }
if (typeof computeCascade === 'undefined') var computeCascade = (n) => ({ style: n.props?.style ?? {}, customProps: n.computedCustomProps ?? new Map(), cssKeys: new Set(), inheritedKeys: new Set() })
if (typeof stylesheetScope === 'undefined') var stylesheetScope = () => ({ query: () => null, hasAdjacentCombinatorSelectors: false, hasSiblingCombinatorSelectors: false })
if (typeof INHERITED_CSS_PROPERTIES === 'undefined') var INHERITED_CSS_PROPERTIES = new Set(['color','font-size','font-weight','font-family','font-style','line-height','letter-spacing','text-align','text-transform','white-space','direction'])
globalThis.appKitBridge ??= {}
globalThis.clearBackgrounds ??= () => {}
globalThis.disposeBoxPaint ??= () => {}
globalThis.isPaintStyle ??= () => false
globalThis.applyBoxStyle ??= () => {}
globalThis.placeholderSignatureByField ??= new WeakMap()
globalThis.BACKGROUND_STYLE_KEYS ??= new Set(['background','backgroundImage','backgroundRepeat','backgroundPosition','backgroundSize','backgroundOrigin','backgroundClip','backgroundAttachment','backgroundBlendMode'])
if (typeof nodeScheme === 'undefined') var nodeScheme = () => 'light'
// Mirrors src/index.ts — collapse folds the visibility prop and the style.
if (typeof isCollapsed === 'undefined') var isCollapsed = (n) => n?.props?.visibility === 'collapse' || n?.styleVisibility === 'collapse'
// Mirrors src/index.ts — outline/cursor writers live inside the applyStyle
// slice range; stubbed only where a narrower slice still calls them.
if (typeof syncOutline === 'undefined') var syncOutline = () => {}
if (typeof syncCursor === 'undefined') var syncCursor = () => {}
if (typeof syncUserSelect === 'undefined') var syncUserSelect = () => {}
// Mirrors src/index.ts — slices that exercise insert/validateBatch reject
// viewless children through this error but don't include the function.
if (typeof textOnlyChildError === 'undefined') var textOnlyChildError = (parent, childType, child) => {
	const text = child?.text ?? child?.props?.value
	const detail = childType === '#text' ? ' ("' + String(text ?? '').slice(0, 60) + '")' : ' (<' + childType + '>)'
	return new Error('AppKit <' + (parent?.type ?? '?') + '> cannot contain text-only children' + detail + (parent?.props?.id ? ' — parent id=' + parent.props.id : ''))
}
// Mirrors src/index.ts — animation frames dedupe style writes through it.
if (typeof shallowEqualStyle === 'undefined') var shallowEqualStyle = (a, b) => {
	const keys = Object.keys(a)
	return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}
// Mirrors src/index.ts — the shared primary-click boundary check recognizers
// are configured with; slices without the function keep its real behavior.
if (typeof primaryClickBoundary === 'undefined') var primaryClickBoundary = (_node) => (view) => {
	const target = cssNodesByView.get(view)
	return target != null && isPrimaryClickBoundary(target.type, target.props?.accessibilityRole, typeof actionHandlers.get(target.actionId ?? -1) === 'function')
}
// Mirrors src/index.ts — link-run recognizer + glyph hit-test for folded text.
if (typeof syncTextLinks === 'undefined') var syncTextLinks = () => {}
if (typeof textLinkCharacterIndex === 'undefined') var textLinkCharacterIndex = () => null
if (typeof NSAccessibilityCustomAction === 'undefined')
	var NSAccessibilityCustomAction = { alloc: () => ({ initWithNameHandler: (name, handler) => ({ name, handler }) }) }
`

/** Names CSS_SLICE_STUBS may install — a spy context leaves them alone so the
 *  `typeof X === 'undefined'` guards still produce functional fallbacks. */
const SLICE_STUB_NAMES = new Set(
  [...CSS_SLICE_STUBS.matchAll(/typeof (\w+) === 'undefined'/g)].map((m) => m[1]),
)
