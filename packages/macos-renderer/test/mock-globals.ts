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

/** `runInNewContext` for src/index.ts slices: prepends CSS_SLICE_STUBS so
 *  slices that reference cascade helpers they don't include still run. */
export function runSlice(code: string, context?: Record<string, any>) {
	return runInNewContext(CSS_SLICE_STUBS + code, context)
}

// Slices eval fragments of src/index.ts without the CSS cascade module —
// these fallbacks fill names the slices reference but don't include. Real
// function declarations in the slice and sandbox-provided globals win.
const CSS_SLICE_STUBS = `
if (typeof notifyLayoutCommit === 'undefined') var notifyLayoutCommit = () => {}
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
if (typeof cssNodesByView === 'undefined') var cssNodesByView = new WeakMap()
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
if (typeof appKitBridge === 'undefined') var appKitBridge = {}
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
`
