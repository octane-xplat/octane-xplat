/**
 * Per-node effective-style computation over the vendored NS selector engine —
 * platform-free so Node tests and the GTK renderer (via
 * `@octane-xplat/css-engine`) can reuse it.
 *
 * Mirrors NS 9.1.3 StyleScope/Style semantics:
 * - matched rulesets arrive sorted ascending by (layerPath, specificity, tier,
 *   pos); declarations apply in that order, so later wins (NS `CascadeLayer`
 *   ordering comes from the patched compareSelectors in vendor/css).
 * - NS has no `!important` priority — `cleanupImportantFlags` strips the flag
 *   at parse time and that's the whole story upstream.
 * - `--*` custom properties inherit from the parent's computed map; `var()`
 *   resolves at compute time per `_evaluateCssVariableExpression`; `calc()`
 *   per `_evaluateCssCalcExpression` (via @csstools/css-calc, same package
 *   upstream uses).
 * - shorthand pending substitution (`var()`/`calc()` inside a shorthand) is
 *   re-expanded after var resolution, exactly like upstream's deferred path.
 * - inherited properties take the parent's computed value when the node has
 *   none — including inline (Local) values, matching upstream's
 *   `propagateInheritableCssProperties` which propagates any source.
 */
import { calc } from '@csstools/css-calc'
import type { Node as CssNode } from './vendor/css-selector.ts'
import type { StyleSheetSelectorScope } from './vendor/css-selector.ts'
import {
	_expandCssShorthand,
	_pendingCssShorthandSubstitution,
	isCssPendingSubstitution,
	isCssVariable,
	type CssPendingSubstitution,
} from './vendor/shorthands.ts'

import { evalMediaQuery, stylesheetKeyframes, stylesheetScope } from './stylesheets.ts'
import {
	isAnimationDeclaration,
	keyframeAnimationsFromCSSDeclarations,
	keyframesArrayFromCSS,
	type KeyframeAnimationInfo,
} from './keyframes.ts'

export type PropBag = Record<string, any>

/**
 * The node shape cascade needs. Renderer `ElementNode` satisfies this via the
 * selector adapter fields (cssType/cssClasses/cssPseudoClasses) plus
 * `parent`/`props.style` and the computed fields this module writes.
 */
export interface CssHostNode extends CssNode {
	props: { style?: PropBag; [key: string]: any }
	computedStyle?: PropBag
	computedCustomProps?: Map<string, string>
	__cssParent?: CssHostNode | null
}

function cssParent(node: CssHostNode): CssHostNode | null {
	return node.__cssParent ?? (node.parent as CssHostNode) ?? null
}

/**
 * NS 9.1.3 `InheritedCssProperty` registrations (cssName → renderer key).
 * `font` is a shorthand upstream — its longhands are inherited individually.
 * `_fontScaleInternal` is a registration-internal name; included for parity.
 */
export const INHERITED_CSS_PROPERTIES: ReadonlySet<string> = new Set([
	'color',
	'direction',
	'font-family',
	'font-size',
	'font-style',
	'font-weight',
	'font-variation-settings',
	'letter-spacing',
	'line-height',
	'text-align',
	'text-transform',
	'text-shadow',
	'text-stroke',
	'white-space',
	'tint-color',
	'selected-background-color',
	'selected-text-color',
	'_fontScaleInternal',
])

// CSS wide/unset keywords — upstream `property-shared` isCssWideKeyword etc.
const CSS_INHERIT = 'inherit'
const CSS_INITIAL_RE = /^(initial|default)$/
const CSS_UNSET_RE = /^unset$/
const CSS_REVERT_RE = /^revert$/

function kebabToCamel(name: string): string {
	return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

const LENGTH_RE = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|dip|pt)?$/

/**
 * Convert a resolved CSS value to the renderer vocabulary: `N`, `Npx`,
 * `Ndip`, `Npt` → number of points (px = dip = pt on macOS, matching the
 * px→dip native rewrite); `%`, `auto`, keywords and colors stay strings.
 */
export function cssValueToStyle(value: any): any {
	if (typeof value !== 'string') {
		return value
	}
	const trimmed = value.trim()
	const m = LENGTH_RE.exec(trimmed)
	if (m) {
		return Number(m[1])
	}
	return trimmed
}

const cssVarGetter =
	(node: CssHostNode) =>
	(name: string): string | null => {
		for (let current: CssHostNode | null = node; current; current = cssParent(current)) {
			const v = current.computedCustomProps?.get(name)
			if (v !== undefined) {
				return v
			}
		}
		return null
	}

/** Port of upstream `_evaluateCssVariableExpression` against our custom-prop
 *  map instead of `view.style.getCssVariable`. Nested var() resolve by the
 *  same lastIndexOf('var(') innermost-first loop. */
export function evaluateCssVariables(node: CssHostNode, value: string): string {
	if (typeof value !== 'string' || !value.includes('var(--')) {
		return value
	}

	const getVar = cssVarGetter(node)
	let output = value.trim()
	let lastValue: string | undefined
	while (lastValue !== output) {
		lastValue = output
		const idx = output.lastIndexOf('var(')
		if (idx === -1) {
			continue
		}

		const endIdx = output.indexOf(')', idx)
		if (endIdx === -1) {
			continue
		}

		const matched = output
			.substring(idx + 4, endIdx)
			.split(',')
			.map((v) => v.trim())
			.filter((v) => !!v)

		const name = matched.shift()!
		let resolved = getVar(name)
		if (resolved === null && matched.length) {
			// Fallback list may itself contain var() — resolve against the node.
			resolved = evaluateCssVariables(node, matched.join(', ')).split(',')[0]
		}

		if (!resolved) {
			resolved = 'unset'
		}

		output = `${output.substring(0, idx)}${resolved}${output.substring(endIdx + 1)}`
	}
	return output
}

const DIP_RE = /([0-9]+(\.[0-9]+)?)dip\b/g
const UNSET_RE = /unset/g
const INFINITY_RE = /infinity/g

/** Port of upstream `_evaluateCssCalcExpression` — `calc()` returns a number
 *  (dips) when it resolves, else the string stays for downstream handling. */
export function evaluateCssCalc(value: any): any {
	if (typeof value !== 'string' || !value.includes('calc(')) {
		return value
	}
	let cssValue = value.replace(DIP_RE, '$1')
	if (cssValue.includes('unset')) {
		cssValue = cssValue.replace(UNSET_RE, '0')
	}
	if (cssValue.includes('infinity')) {
		cssValue = cssValue.replace(INFINITY_RE, `${Number.MAX_SAFE_INTEGER}`)
	}
	try {
		return calc(cssValue)
	} catch {
		return value
	}
}

/**
 * Resolve one declaration into `[camelName, styleValue]` pairs.
 * var() → custom-prop substitution → calc() → pending shorthand re-expand.
 */
function resolveDeclaration(
	node: CssHostNode,
	property: string,
	value: any,
	out: [string, any][],
	borderLonghands = false,
) {
	if (isCssPendingSubstitution(value)) {
		const sub = value as CssPendingSubstitution
		let resolved = evaluateCssVariables(node, sub.value)
		resolved =
			typeof evaluateCssCalc(resolved) === 'number' ? String(evaluateCssCalc(resolved)) : resolved

		const expanded = _expandCssShorthand(sub.shorthand, resolved)
		if (expanded) {
			for (const [longhand, v] of expanded) {
				pushStyleDecl(node, kebabToCamel(longhand), v, out, borderLonghands)
			}
		} else {
			// Still unresolvable — upstream leaves the pending marker; it
			// surfaces as the unresolved shorthand value downstream.
			pushStyleDecl(node, kebabToCamel(sub.shorthand), resolved, out, borderLonghands)
		}

		return
	}

	if (typeof value === 'string') {
		if (value.includes('var(--')) {
			value = evaluateCssVariables(node, value)
		}

		if (value.includes('calc(')) {
			const c = evaluateCssCalc(value)
			value = typeof c === 'number' ? c : value
		}
	}

	pushStyleDecl(node, kebabToCamel(property), value, out, borderLonghands)
}

/**
 * NS expands border shorthands to per-corner/edge longhands; the AppKit
 * renderer has a single borderRadius/borderWidth/borderColor slot. Uniform
 * values collapse to the unified key — non-uniform borders keep the last
 * edge's value (same precedence as any other duplicate key).
 */
// Per-ruleset parsed-animation cache — NS `animationsSymbol`, keyed weakly.
const rulesetAnimations = new WeakMap<object, { infos: KeyframeAnimationInfo[] | undefined; reset: boolean }>()

const LONGHAND_TO_RENDERER: Record<string, string> = {
	borderTopLeftRadius: 'borderRadius',
	borderTopRightRadius: 'borderRadius',
	borderBottomLeftRadius: 'borderRadius',
	borderBottomRightRadius: 'borderRadius',
	borderTopWidth: 'borderWidth',
	borderRightWidth: 'borderWidth',
	borderBottomWidth: 'borderWidth',
	borderLeftWidth: 'borderWidth',
	borderTopColor: 'borderColor',
	borderRightColor: 'borderColor',
	borderBottomColor: 'borderColor',
	borderLeftColor: 'borderColor',
}

function pushStyleDecl(
	node: CssHostNode,
	name: string,
	value: any,
	out: [string, any][],
	borderLonghands: boolean,
) {
	if (!borderLonghands) {
		name = LONGHAND_TO_RENDERER[name] ?? name
	}
	// CSS wide keywords: unset → inherited-prop inherits, else initial (drop);
	// inherit → parent computed; initial/default → drop (back to default).
	if (typeof value === 'string') {
		const kw = value.trim()
		if (kw === CSS_INHERIT) {
			const parent = cssParent(node)
			const pv = parent?.computedStyle?.[name]
			if (pv !== undefined) {
				out.push([name, pv])
			}

			return
		}

		if (CSS_UNSET_RE.test(kw)) {
			if (INHERITED_CSS_PROPERTIES.has(camelToKebabName(name))) {
				const parent = cssParent(node)
				const pv = parent?.computedStyle?.[name]
				if (pv !== undefined) {
					out.push([name, pv])
				}
			}

			return
		}

		if (CSS_INITIAL_RE.test(kw) || CSS_REVERT_RE.test(kw)) {
			return
		}
	}
	out.push([name, cssValueToStyle(value)])
}

function camelToKebabName(name: string): string {
	return name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
}

export interface ComputedCascade {
	style: PropBag
	customProps: Map<string, string>
	/** camelCase keys set by CSS declarations matched on this node. */
	cssKeys: Set<string>
	/** Keys present only via parent inheritance — never warn on these. */
	inheritedKeys: Set<string>
	/** Keyframe animations from matched rulesets (NS `playKeyframeAnimations`
	 *  collects them from rulesets, not the computed bag). */
	animations: KeyframeAnimationInfo[]
}

export interface CascadeOptions {
	/** Keep per-side/per-corner border longhands instead of collapsing them
	 *  into the single borderRadius/borderWidth/borderColor slot. */
	borderLonghands?: boolean
}

/** NS `findKeyframeRule`: name match; media-gated keyframes apply when the
 *  media query currently matches (evaluated against the live env). */
function attachKeyframes(info: KeyframeAnimationInfo) {
	if (!info.name || info.keyframes) {
		return
	}
	for (const kf of stylesheetKeyframes()) {
		if (kf.name !== info.name) {
			continue
		}

		if (kf.mediaQueryString) {
			const list = Array.isArray(kf.mediaQueryString) ? kf.mediaQueryString : [kf.mediaQueryString]
			if (!list.every((q) => evalMediaQuery(q))) {
				continue
			}
		}

		info.keyframes = keyframesArrayFromCSS(kf.keyframes as any)
		return
	}
}

/**
 * Compute the node's effective style: parent-inherited props and custom props,
 * then matched CSS declarations in cascade order, then inline `props.style`
 * (NS Default < Inherited < Css < Local).
 *
 * Two passes over matched declarations: custom properties first (so a `--x`
 * declared on this node resolves `var(--x)` in its own declarations), then
 * value declarations — matching upstream, where getCssVariable reads the
 * view's already-updated variable map.
 */
export function computeCascade(
	node: CssHostNode,
	scope?: StyleSheetSelectorScope<any>,
	options: CascadeOptions = {},
): ComputedCascade {
	const borderLonghands = options.borderLonghands === true
	const parent = cssParent(node)
	const parentStyle = parent?.computedStyle ?? {}
	const parentCustom = parent?.computedCustomProps

	const customProps = new Map<string, string>(parentCustom)
	const cssOut: [string, any][] = []
	const cssKeys = new Set<string>()
	const inline = node.props?.style ?? {}

	const s = scope ?? stylesheetScope()
	const match = s?.query(node)
	const decls: [string, any][] = []
	const matchedRulesets: any[] = []
	if (match) {
		for (const sel of match.selectors) {
			// Dynamic selectors collected by mayMatch are re-checked at apply
			// time — upstream CssState applies only `!sel.dynamic || sel.match`.
			if (sel.dynamic && !sel.match(node)) {
				continue
			}

			const ruleset = sel.ruleset
			if (!ruleset) {
				continue
			}

			matchedRulesets.push(ruleset)

			for (const decl of ruleset.declarations) {
				decls.push([decl.property, decl.value])
			}
		}
	}

	// Keyframe animations come from the matched rulesets (not the computed
	// style — animation-* never lands in the bag), cached per ruleset like
	// NS animationsSymbol. Keyframes attach lazily from the registry.
	const animations: KeyframeAnimationInfo[] = []
	for (const ruleset of matchedRulesets) {
		let parsed = rulesetAnimations.get(ruleset)
		if (parsed === undefined) {
			// NativeScript-style per-ruleset accumulation needs an explicit
			// cancellation boundary for reduced-motion/disabled animations.
			const declarations = ruleset.declarations ?? []
			let resetAt = -1
			for (let index = 0; index < declarations.length; index++) {
				const declaration = declarations[index]
				if ((declaration.property === 'animation' || declaration.property === 'animation-name') &&
					String(declaration.value).trim().toLowerCase() === 'none') resetAt = index
			}
			parsed = { infos: keyframeAnimationsFromCSSDeclarations(declarations.slice(resetAt + 1)), reset: resetAt >= 0 }
			rulesetAnimations.set(ruleset, parsed)
		}
		if (parsed.reset) animations.length = 0
		for (const info of parsed.infos ?? []) {
			attachKeyframes(info)
			animations.push(info)
		}
	}

	// Pass 1: custom properties — own map shadows inherited, inline --* wins.
	for (const [property, value] of decls) {
		if (isCssVariable(property)) {
			customProps.set(property, typeof value === 'string' ? value : String(value))
		}
	}
	for (const key of Object.keys(inline)) {
		if (key.startsWith('--') && inline[key] != null) {
			customProps.set(key, String(inline[key]))
		}
	}

	// var()/calc() resolve against the node's NEW custom-prop map (fallback to
	// ancestors happens inside the getter chain — node first, then parents).
	const varScope: CssHostNode = {
		...node,
		computedCustomProps: customProps,
		parent: node.parent,
		props: node.props,
	}

	// Pass 2: value declarations. Animation declarations steer the
	// keyframe channel, not the style bag.
	for (const [property, value] of decls) {
		if (isCssVariable(property) || isAnimationDeclaration(property)) {
			continue
		}

		const before = cssOut.length
		resolveDeclaration(varScope, property, value, cssOut, borderLonghands)
		for (let i = before; i < cssOut.length; i++) {
			cssKeys.add(cssOut[i][0])
		}
	}

	const style: PropBag = {}
	const inheritedKeys = new Set<string>()
	for (const prop of INHERITED_CSS_PROPERTIES) {
		const camel = kebabToCamel(prop)
		if (parentStyle[camel] !== undefined && !cssKeys.has(camel)) {
			style[camel] = parentStyle[camel]
			inheritedKeys.add(camel)
		}
	}
	for (const [name, value] of cssOut) {
		style[name] = value
	}
	// An element prop named like a style property (a label's `fontSize`, a
	// layout host's `width`) is a Local value, as in NativeScript: it outranks
	// CSS and inheritance, so the cascade leaves that key to the prop path.
	for (const name of Object.keys(style)) {
		if (node.props?.[name] !== undefined && !(name in inline)) {
			delete style[name]
			cssKeys.delete(name)
			inheritedKeys.delete(name)
		}
	}

	for (const [name, value] of Object.entries(inline)) {
		if (name.startsWith('--')) {
			continue
		}

		if (value != null) {
			style[name] = value
			inheritedKeys.delete(name)
		}
	}

	return { style, customProps, cssKeys, inheritedKeys, animations }
}

/** Convenience: which incoming keys a pending-substitution declaration may
 *  expand to (for dirty-propagation checks). */
export function pendingLonghands(value: CssPendingSubstitution): string[] | undefined {
	return _pendingCssShorthandSubstitution(value.shorthand, value.value)?.map(([n]) =>
		kebabToCamel(n),
	)
}
