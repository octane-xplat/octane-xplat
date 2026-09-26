// Shared checks for the xplat lint rules. Every check takes an ESTree
// Program plus source text and returns {node, message} violations — oxlint
// produces this AST for .ts/.tsx, and @tsrx/core's parseModule produces the
// same estree-jsx nodes for .tsrx — so each rule runs in both passes
// (scripts/oxlint-plugin.mjs and scripts/lint-tsrx.mjs).
//
// Rule scope follows the platform-suffix convention: `.web.*` files own the
// DOM, `.native/.ios/.android.*` own NativeScript, unsuffixed files compile
// for both. The `exclude` option is a list of filename substrings for trees
// that break that assumption (web-only apps, the native shell).

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ---------- file scope ----------

const norm = (f) => f.split('\\').join('/')
// `.web.`/`.native.` anywhere in the name — `foo.web.test.tsrx` is a web
// file as much as `foo.web.tsrx` is.
export const isWebFile = (f) => /\.web\./.test(norm(f))
export const isNativeFile = (f) => /\.(native|ios|android)\./.test(norm(f))
export const isSharedFile = (f) => !isWebFile(f) && !isNativeFile(f)
const isTestFile = (f) => /\.(test|spec)\.[^.]+$/.test(norm(f))
export const fileExcluded = (f, options) =>
	(options?.exclude ?? []).some((s) => norm(f).includes(s))

// ---------- AST walk ----------

export function* walk(node, parent = null, seen = new Set()) {
	if (!node || typeof node !== 'object' || typeof node.type !== 'string' || seen.has(node)) {
		return
	}

	seen.add(node)
	yield [node, parent]
	for (const [key, value] of Object.entries(node)) {
		if (key === 'parent' || key === 'loc' || key === 'metadata' || key === 'range') {
			continue
		}

		if (Array.isArray(value)) {
			for (const child of value) {
				yield* walk(child, node, seen)
			}
		} else if (value && typeof value === 'object') {
			yield* walk(value, node, seen)
		}
	}
}

const jsxName = (name) =>
	name?.type === 'JSXIdentifier'
		? name.name
		: name?.type === 'JSXMemberExpression'
			? `${jsxName(name.object)}.${jsxName(name.property)}`
			: undefined

const propName = (key) =>
	key?.type === 'Identifier' || key?.type === 'JSXIdentifier'
		? key.name
		: key?.type === 'Literal'
			? String(key.value)
			: undefined

function* jsxAttributeNodes(program) {
	for (const [node] of walk(program)) {
		if (node.type === 'JSXOpeningElement') {
			for (const attr of node.attributes ?? []) {
				yield [attr, jsxName(node.name)]
			}
		}
	}
}

// String literals inside a className-ish expression: 'a', `a`, ['a','b'],
// {a: cond}, cond && 'a', cond ? 'a' : 'b'.
const literalStrings = (expr, out = []) => {
	if (!expr) {
		return out
	}

	if (expr.type === 'Literal' && typeof expr.value === 'string') {
		out.push(expr)
	}

	if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
		for (const q of expr.quasis) {
			out.push({
				type: 'Literal',
				value: q.value.cooked ?? q.value.raw,
				start: q.start,
				end: q.end,
			})
		}
	}

	if (expr.type === 'ArrayExpression') {
		for (const el of expr.elements) {
			literalStrings(el, out)
		}
	}

	if (expr.type === 'ObjectExpression') {
		for (const p of expr.properties ?? []) {
			literalStrings(p.key, out)
		}
	}

	if (expr.type === 'ConditionalExpression') {
		literalStrings(expr.consequent, out)
		literalStrings(expr.alternate, out)
	}

	if (expr.type === 'LogicalExpression') {
		literalStrings(expr.left, out)
		literalStrings(expr.right, out)
	}

	return out
}

// ---------- no-dom-globals (invariant #4; absorbs check-no-dom.mjs) ----------

const DOM_GLOBALS = new Set([
	'document',
	'window',
	'navigator',
	'location',
	'history',
	'localStorage',
	'sessionStorage',
	'getComputedStyle',
	'DOMParser',
	'XMLSerializer',
	'createElementNS',
	'querySelector',
	'querySelectorAll',
	'innerHTML',
	'outerHTML',
	'classList',
	'alert',
	'confirm',
	'prompt',
	'MutationObserver',
	'IntersectionObserver',
	'ResizeObserver',
	'DocumentFragment',
	'ShadowRoot',
	'Node',
	'Element',
	'NodeList',
])

// SVGView (ui-svg plugin) is NOT a DOM name — only *Element classes and the
// legacy DOM SVG interface set are.
const DOM_SVG_NAMES = new Set([
	'SVGMatrix',
	'SVGPoint',
	'SVGRect',
	'SVGAngle',
	'SVGLength',
	'SVGNumber',
	'SVGTransform',
	'SVGPreserveAspectRatio',
])

const isDomGlobalName = (name) =>
	DOM_GLOBALS.has(name) ||
	/^HTML[A-Z]/.test(name) ||
	(/^SVG[A-Z].*Element$/.test(name) && name !== 'SVGElement') ||
	DOM_SVG_NAMES.has(name) ||
	name === 'SVGElement'

// Declarations, keys, and member names are not reads of the global.
const isReference = (node, parent) => {
	if (!parent) {
		return true
	}

	switch (parent.type) {
		case 'MemberExpression':
		case 'OptionalMemberExpression':
			return parent.object === node || parent.computed
		case 'Property':
		case 'MethodDefinition':
		case 'PropertyDefinition':
		case 'TSPropertySignature':
		case 'TSMethodSignature':
		case 'TSIndexSignature':
			return parent.value === node || parent.computed
		case 'VariableDeclarator':
			return parent.id !== node
		case 'FunctionDeclaration':
		case 'FunctionExpression':
		case 'ClassDeclaration':
		case 'ClassExpression':
		case 'TSInterfaceDeclaration':
		case 'TSTypeAliasDeclaration':
		case 'TSEnumDeclaration':
		case 'TSModuleDeclaration':
			return parent.id !== node && !parent.params?.includes(node)
		case 'ArrowFunctionExpression':
			return !parent.params?.includes(node)
		case 'ImportSpecifier':
		case 'ImportDefaultSpecifier':
		case 'ImportNamespaceSpecifier':
		case 'ExportSpecifier':
		case 'LabeledStatement':
		case 'BreakStatement':
		case 'ContinueStatement':
		case 'TSImportEqualsDeclaration':
		case 'TSQualifiedName':
		case 'TSTypeParameterDeclaration':
		case 'TSTypeParameter':
			return false
		default:
			return true
	}
}

export function checkNoDomGlobals(program, _src, filename, options) {
	if (isWebFile(filename) || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node, parent] of walk(program)) {
		if (node.type === 'Identifier' && isDomGlobalName(node.name) && isReference(node, parent)) {
			out.push({
				node,
				message: `'${node.name}' is a DOM global — it does not exist on native. Move platform code behind a .web.* leaf or packages/platform.`,
			})
		}
	}

	return out
}

// ---------- no-web-only-api (invariant #5) ----------

const WEB_ONLY_OCTANE = new Set([
	'createPortal',
	'Suspense',
	'Hydrate',
	'ErrorBoundary',
	'createRoot',
	'hydrate',
	'hydrateRoot',
	'renderToString',
	'renderToStream',
])

export function checkNoWebOnlyApi(program, _src, filename, options) {
	if (isWebFile(filename) || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node, parent] of walk(program)) {
		if (node.type === 'ImportDeclaration' && /^octane(\/|$)/.test(node.source.value ?? '')) {
			for (const spec of node.specifiers) {
				const imported = spec.imported?.name ?? spec.local?.name
				if (imported && WEB_ONLY_OCTANE.has(imported)) {
					out.push({
						node: spec,
						message: `'${imported}' is DOM-only — on native it is a silent no-op. Use @try/@pending/@catch, Overlay/Modal services, or a .web.* leaf.`,
					})
				}
			}

			continue
		}

		if (
			node.type === 'JSXIdentifier' &&
			WEB_ONLY_OCTANE.has(node.name) &&
			parent?.type === 'JSXOpeningElement'
		) {
			out.push({
				node,
				message: `<${node.name}> is DOM-only — use @try/@pending/@catch for async boundaries.`,
			})
		}
	}

	return out
}

// ---------- element-vocabulary (invariant #1) ----------

// HTML tags with no NativeScript counterpart — dead in .native/.ios/.android.
// `label`, `span` (formatted text), `button`, `image`, `switch`, `slider`,
// `progress` exist in both vocabularies and are not flagged either way.
const HTML_ONLY_TAGS = new Set([
	'div',
	'p',
	'a',
	'img',
	'input',
	'form',
	'fieldset',
	'legend',
	'ul',
	'ol',
	'li',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'table',
	'thead',
	'tbody',
	'tfoot',
	'tr',
	'td',
	'th',
	'caption',
	'colgroup',
	'col',
	'select',
	'option',
	'optgroup',
	'datalist',
	'textarea',
	'video',
	'audio',
	'canvas',
	'svg',
	'path',
	'iframe',
	'nav',
	'section',
	'article',
	'header',
	'footer',
	'main',
	'aside',
	'strong',
	'em',
	'code',
	'pre',
	'blockquote',
	'hr',
	'br',
	'wbr',
	'dialog',
	'style',
	'link',
	'script',
	'title',
	'head',
	'body',
	'html',
	'figure',
	'figcaption',
	'dl',
	'dt',
	'dd',
	'mark',
	'small',
	'sub',
	'sup',
	'time',
	'abbr',
	'address',
	'b',
	'i',
	'u',
	's',
	'cite',
	'q',
	'kbd',
	'samp',
	'var',
	'output',
	'details',
	'summary',
	'menu',
	'picture',
	'source',
	'track',
	'map',
	'area',
	'object',
	'embed',
	'param',
	'meter',
	'noscript',
	'template',
	'slot',
])

// NativeScript views with no HTML counterpart — dead in .web.*.
const NS_ONLY_TAGS = new Set([
	'gridlayout',
	'flexboxlayout',
	'stacklayout',
	'absolutelayout',
	'docklayout',
	'wraplayout',
	'page',
	'contentview',
	'scrollview',
	'actionbar',
	'actionitem',
	'navigationbutton',
	'tabview',
	'tabviewitem',
	'listview',
	'textfield',
	'textview',
	'segmentedbar',
	'segmentedbaritem',
	'datepicker',
	'timepicker',
	'listpicker',
	'activityindicator',
	'frame',
	'searchbar',
	'formattedstring',
	'webview',
	'htmlview',
	'canvasview',
	'svgview',
	'drawer',
	'liquidglass',
	'liquidglasscontainer',
	'placeholder',
])

export function checkElementVocabulary(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const web = isWebFile(filename)
	const native = isNativeFile(filename)
	const out = []
	for (const [node] of walk(program)) {
		if (node.type !== 'JSXOpeningElement') {
			continue
		}

		const name = jsxName(node.name)
		if (!name || name[0] !== name[0].toLowerCase() || name.includes('.')) {
			continue
		}

		if (!web && !native) {
			out.push({
				node: node.name,
				message: `Shared files must use xplat primitives, not raw '<${name}>' elements — platform tags belong in .web.* / .native.* leaves.`,
			})
		} else if (web && NS_ONLY_TAGS.has(name)) {
			out.push({
				node: node.name,
				message: `'<${name}>' is a NativeScript view — it renders nothing on web. Use a primitive or move to a .native.* leaf.`,
			})
		} else if (native && HTML_ONLY_TAGS.has(name)) {
			out.push({
				node: node.name,
				message: `'<${name}>' is a DOM element — it does not exist on native. Use a primitive or move to a .web.* leaf.`,
			})
		}
	}

	return out
}

// ---------- import boundary rules ----------

const isConfigFile = (f) =>
	/(^|\/)[\w.-]*config\.(m|c)?(ts|js)$/.test(norm(f)) || norm(f).endsWith('.d.ts')

export function checkNoNativescriptImport(program, _src, filename, options) {
	if (isNativeFile(filename) || isConfigFile(filename) || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (
			node.type !== 'ImportDeclaration' &&
			node.type !== 'ExportNamedDeclaration' &&
			node.type !== 'ExportAllDeclaration'
		) {
			continue
		}

		const source = node.source?.value
		if (typeof source === 'string' && /^@(nativescript|nativescript-community)\//.test(source)) {
			out.push({
				node: node.source,
				message: `Shared files can't import '${source}' — it only exists on native. Put it behind a .native.* leaf.`,
			})
		}
	}

	return out
}

// Deep @nativescript/core internals bundle as separate module instances —
// shared state (e.g. rootLayoutStack) silently diverges. Applies everywhere.
export function checkNoNsDeepImport(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (node.type !== 'ImportDeclaration') {
			continue
		}

		const source = node.source?.value
		if (typeof source === 'string' && source.startsWith('@nativescript/core/ui/')) {
			out.push({
				node: node.source,
				message: `Deep import '${source}' creates a second bundled module instance — internal view state diverges. Import from '@nativescript/core' instead.`,
			})
		}
	}

	return out
}

// @octane-xplat/ui subpaths gate platform-authentic components: /ios and
// /android resolve only under the `native` export condition, /web only
// under `web`. Importing one from a shared (or wrong-platform) file fails
// the other platform's build on purpose — the import must live in a
// suffixed leaf. `.native` files may import ui/ios + ui/android, but only
// for specifiers that load safely on both platforms; module-top
// platform-only APIs belong in .ios/.android leaves.
const PLATFORM_SUBPATHS = [
	{
		spec: '@octane-xplat/ui/ios',
		ok: (f) => /\.(ios|native)\./.test(f),
		leaf: '.ios.* or .native.*',
	},
	{
		spec: '@octane-xplat/ui/android',
		ok: (f) => /\.(android|native)\./.test(f),
		leaf: '.android.* or .native.*',
	},
	{
		spec: '@octane-xplat/ui/web',
		ok: (f) => isWebFile(f),
		leaf: '.web.*',
	},
]

export function checkPlatformSubpathImport(program, _src, filename, options) {
	if (isConfigFile(filename) || fileExcluded(filename, options)) {
		return []
	}

	const f = norm(filename)
	const out = []
	for (const [node] of walk(program)) {
		if (
			node.type !== 'ImportDeclaration' &&
			node.type !== 'ExportNamedDeclaration' &&
			node.type !== 'ExportAllDeclaration'
		) {
			continue
		}

		const source = node.source?.value
		if (typeof source !== 'string') {
			continue
		}

		const base = source.split('?')[0].replace(/\/+$/, '')
		for (const rule of PLATFORM_SUBPATHS) {
			if (base === rule.spec && !rule.ok(f)) {
				out.push({
					node: node.source,
					message: `'${source}' resolves only on its own platform — importing it here fails the other platform's build. Move the import into a ${rule.leaf} leaf.`,
				})
			}
		}
	}

	return out
}

// Only shared .ts files are flagged: platform leaves (.native.ts/.web.ts)
// importing .tsrx is the normal leaf pattern — the bundler owns both.
export function checkNoTsImportsTsrx(program, _src, filename, options) {
	const f = norm(filename)
	if (
		!/\.(m|c)?ts$/.test(f) ||
		f.endsWith('.d.ts') ||
		!isSharedFile(f) ||
		isTestFile(f) ||
		fileExcluded(f, options)
	) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (node.type !== 'ImportDeclaration') {
			continue
		}

		if (typeof node.source?.value === 'string' && node.source.value.endsWith('.tsrx')) {
			out.push({
				node: node.source,
				message: `'.ts' modules can't import '.tsrx' — the consumer gets an untransformed module. JSX-free leaves must stay .ts.`,
			})
		}
	}

	return out
}

// ---------- style object rules (invariant #6 + NS silent drops) ----------

function* styleObjects(program) {
	for (const [attr] of jsxAttributeNodes(program)) {
		if (propName(attr.name) !== 'style') {
			continue
		}

		const expr = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value
		if (expr?.type === 'ObjectExpression') {
			yield expr
		}
	}
}

const DEAD_STYLE_PROPS = {
	float: `float is unsupported on native — use flex rows`,
	boxShadow: `boxShadow is inert on native — use the shadow-{n} utility class`,
	transition: `CSS transitions don't exist on native — use the animation facade or @keyframes classes`,
	animationPlayState: `animation-play-state is unsupported on native`,
	cursor: `cursor has no meaning on native — there is no pointer to style`,
	flexBasis: `flexBasis is unreliable on native — use width:0 + the min-w-0 utility`,
}

export function checkNoNativeDeadStyle(program, _src, filename, options) {
	if (isWebFile(filename) || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const obj of styleObjects(program)) {
		for (const prop of obj.properties ?? []) {
			if (prop.type !== 'Property') {
				continue
			}

			const key = propName(prop.key)
			const val = prop.value
			const strVal =
				val?.type === 'Literal' && typeof val.value === 'string' ? val.value : undefined

			if (key === 'position' && /^(absolute|fixed|sticky)$/.test(strVal ?? '')) {
				const alt =
					strVal === 'absolute'
						? 'use the <Absolute> primitive'
						: 'overlays go through Overlay/Modal services, not positioning'

				out.push({ node: prop, message: `position: '${strVal}' does not exist on native — ${alt}` })
			} else if (
				/^margin(Left|Right|Top|Bottom)?$/.test(key ?? '') &&
				/\bauto\b/.test(strVal ?? '')
			) {
				out.push({
					node: prop,
					message: `auto margins are ignored on native — use justifyContent, alignSelf, or <Spacer/>`,
				})
			} else if (key === 'display' && strVal === 'none') {
				out.push({
					node: prop,
					message: `display: 'none' is not supported on native — use visibility: 'collapse' or an @if block`,
				})
			} else if (key === 'whiteSpace' && strVal === 'pre-wrap') {
				out.push({
					node: prop,
					message: `Label rejects whiteSpace: 'pre-wrap' — 'normal' is the native wrap value (no space/newline preservation)`,
				})
			} else if (key && DEAD_STYLE_PROPS[key]) {
				out.push({ node: prop, message: DEAD_STYLE_PROPS[key] })
			}

			if (strVal && /conic-gradient\(/.test(strVal)) {
				out.push({
					node: prop,
					message: `conic-gradient is unsupported on native — draw it with the canvas/svg primitives`,
				})
			}
		}
	}

	return out
}

export function checkNoLineHeightUnitless(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const obj of styleObjects(program)) {
		for (const prop of obj.properties ?? []) {
			if (prop.type !== 'Property' || propName(prop.key) !== 'lineHeight') {
				continue
			}

			const val = prop.value
			const num =
				val?.type === 'Literal' && typeof val.value === 'number'
					? val.value
					: val?.type === 'UnaryExpression' && val.argument?.type === 'Literal'
						? val.argument.value
						: undefined

			if (num !== undefined) {
				out.push({
					node: prop,
					message: `lineHeight: ${num} is normalized to ${num}px — xplat does not use RN's unitless-multiplier semantics.`,
				})
			}
		}
	}

	return out
}

export function checkNoStyleString(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [attr] of jsxAttributeNodes(program)) {
		if (
			propName(attr.name) === 'style' &&
			attr.value?.type === 'Literal' &&
			typeof attr.value.value === 'string'
		) {
			out.push({
				node: attr,
				message: `style="..." strings aren't supported — static styles use className, dynamic values use a style object.`,
			})
		}
	}

	for (const [node] of walk(program)) {
		if (node.type === 'JSXOpeningElement' && jsxName(node.name) === 'style') {
			out.push({
				node: node.name,
				message: `<style> elements aren't supported — styles live in the shared stylesheet.`,
			})
		}
	}

	return out
}

// ---------- no-unknown-class ----------

// Class selectors declared in the repo's stylesheets. Over-collecting is
// safe (weakens the check); missing a real class is a false positive.
let classCache
function knownClasses(cwd) {
	if (classCache) {
		return classCache
	}

	const names = new Set()
	const scan = (dir) => {
		let entries
		try {
			entries = readdirSync(dir, { withFileTypes: true })
		} catch {
			return
		}

		for (const e of entries) {
			const p = join(dir, e.name)
			if (e.isDirectory()) {
				if (
					![
						'node_modules',
						'dist',
						'.git',
						'.ns-vite-build',
						'graft',
						'prior-art',
						'research',
					].includes(e.name)
				) {
					scan(p)
				}
			} else if (e.name.endsWith('.css')) {
				for (const m of readFileSync(p, 'utf8').matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
					names.add(m[1])
				}
			}
		}
	}

	for (const root of ['packages', 'apps']) {
		const dir = join(cwd, root)
		if (existsSync(dir)) {
			scan(dir)
		}
	}

	classCache = names
	return names
}

// Bounded edit distance — bail once past `max`. Unstyled hook classes are a
// normal pattern; the goof worth flagging is a near-miss of a real class.
const distance = (a, b, max = 2) => {
	if (Math.abs(a.length - b.length) > max) {
		return max + 1
	}

	let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
	for (let i = 1; i <= a.length; i++) {
		const cur = [i]
		let rowMin = i
		for (let j = 1; j <= b.length; j++) {
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
			if (cur[j] < rowMin) {
				rowMin = cur[j]
			}
		}

		if (rowMin > max) {
			return max + 1
		}

		prev = cur
	}

	return prev[b.length]
}

export function checkNoUnknownClass(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const known = knownClasses(options?.cssRoot ?? process.cwd())
	const extra = new Set(options?.allow ?? [])
	const out = []
	const checkValue = (lit) => {
		for (const token of String(lit.value).split(/\s+/)) {
			// Only longer tokens: short ones produce junk near-misses
			// ('sel'/'shell', 'list'/'li').
			if (token.length < 4 || known.has(token) || extra.has(token)) {
				continue
			}

			let best
			for (const k of known) {
				// Require a shared 3-char prefix so unrelated tokens don't
				// report junk suggestions.
				if (k.length < 4 || token.slice(0, 3) !== k.slice(0, 3)) {
					continue
				}

				const d = distance(token, k)
				if (d < (best?.d ?? 3)) {
					best = { k, d }
				}
			}

			if (best && best.d <= 2) {
				out.push({
					node: lit,
					message: `'${token}' looks like a typo of '${best.k}' — unknown classes silently no-op on native.`,
				})
			}
		}
	}

	for (const [attr] of jsxAttributeNodes(program)) {
		const name = propName(attr.name)
		if (name !== 'className' && name !== 'activeClassName' && name !== 'class') {
			continue
		}

		const expr = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value
		for (const lit of literalStrings(expr)) {
			checkValue(lit)
		}
	}

	for (const [node] of walk(program)) {
		if (node.type !== 'CallExpression') {
			continue
		}

		const callee = node.callee?.type === 'Identifier' ? node.callee.name : undefined
		if (callee === 'cx') {
			for (const arg of node.arguments) {
				for (const lit of literalStrings(arg)) {
					checkValue(lit)
				}
			}
		}

		if (callee === 'styled') {
			const def = node.arguments[1]
			if (def?.type === 'ObjectExpression') {
				// base: 'cls', variants: { name: 'cls' } — classes are the
				// values; keys are variant prop names.
				for (const p of def.properties ?? []) {
					const v = p.value
					if (v?.type === 'ObjectExpression') {
						for (const q of v.properties ?? []) {
							for (const lit of literalStrings(q.value)) {
								checkValue(lit)
							}
						}
					} else {
						for (const lit of literalStrings(v)) {
							checkValue(lit)
						}
					}
				}
			}
		}
	}

	return out
}

// ---------- signal rules ----------

const SIGNAL_FACTORIES = new Set(['signal$', 'query$', 'derived$'])

export function checkSignalDollarSuffix(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (node.type !== 'VariableDeclarator') {
			continue
		}

		const init = node.init
		if (
			init?.type === 'CallExpression' &&
			init.callee?.type === 'Identifier' &&
			SIGNAL_FACTORIES.has(init.callee.name) &&
			node.id?.type === 'Identifier' &&
			!node.id.name.endsWith('$')
		) {
			out.push({
				node: node.id,
				message: `'${node.id.name}' should end with '$' — the compiler preserves native signal reads only for $-suffixed names.`,
			})
		}
	}

	return out
}

const SIGNAL_READ_METHODS = new Set(['get', 'set', 'snapshot', 'subscribe', 'update'])

export function checkRequireSignalsRuntime(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	let hasSignalsImport = false
	const reads = []
	for (const [node] of walk(program)) {
		if (node.type === 'ImportDeclaration') {
			const src = node.source?.value
			if (
				(src === 'octane/signals' || src === 'octane/signals/client') &&
				node.importKind !== 'type'
			) {
				hasSignalsImport = true
			}

			continue
		}

		if (
			(node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') &&
			!node.computed &&
			node.object?.type === 'Identifier' &&
			node.object.name.endsWith('$') &&
			SIGNAL_READ_METHODS.has(node.property?.name)
		) {
			reads.push(node)
		}
	}

	if (hasSignalsImport || reads.length === 0) {
		return []
	}

	return [
		{
			node: reads[0],
			message: `Signal reads here need a runtime import of 'octane/signals' in this module — without it native .get() reads never subscribe.`,
		},
	]
}

// ---------- misc goofs ----------

const PRESSABLE_ONLY_PROPS = new Set([
	'onPress',
	'onPressIn',
	'onPressOut',
	'onLongPress',
	'onDoublePress',
])

// onLongPress and onDoubleTap are real NS view events — only the Octane-side
// names are dead on raw native tags.
const DEAD_ON_NATIVE_TAGS = new Set(['onPress', 'onPressIn', 'onPressOut', 'onDoublePress'])
const NON_PRESSABLE_PRIMITIVES = new Set([
	'View',
	'Row',
	'Text',
	'Heading',
	'Stack',
	'Grid',
	'Absolute',
	'Spacer',
	'Image',
	'ScrollView',
	'List',
	'Screen',
	'SafeArea',
	'KeyboardAvoiding',
	'Switch',
	'Slider',
	'Meter',
	'ActivityIndicator',
	'Icon',
	'PlatformBadge',
	'Overlay',
	'Popover',
	'Modal',
	'Tabs',
	'TextInput',
	'TextArea',
	'Drawer',
	'Link',
	'NavLink',
])

export function checkNoViewOnPress(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [attr, tag] of jsxAttributeNodes(program)) {
		if (!tag || tag === 'Pressable') {
			continue
		}

		const name = propName(attr.name) ?? ''
		if (NON_PRESSABLE_PRIMITIVES.has(tag) && PRESSABLE_ONLY_PROPS.has(name)) {
			out.push({
				node: attr,
				message: `<${tag}> has no ${name} — it will never fire. Wrap in <Pressable>.`,
			})
		} else if (tag[0] === tag[0].toLowerCase() && DEAD_ON_NATIVE_TAGS.has(name)) {
			out.push({
				node: attr,
				message: `'<${tag}>' views take NS event names (onTap/onTouch/onLongPress), not ${name} — wrap in <Pressable>.`,
			})
		}
	}

	return out
}

export function checkNoConsoleDebug(program, _src, filename, options) {
	if (fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (
			node.type === 'CallExpression' &&
			node.callee?.type === 'MemberExpression' &&
			node.callee.object?.name === 'console' &&
			node.callee.property?.name === 'debug'
		) {
			out.push({
				node: node.callee,
				message: `console.debug does not exist on device — use console.log.`,
			})
		}
	}

	return out
}

// Custom-hook modules may live in .ts (useSyncExternalStore wrappers like
// theme-scheme.ts). Any other use* call in a .ts file is suspect: if the
// file falls outside the renderer include glob it binds a dead dispatcher.
export function checkHooksInPlainTs(program, _src, filename, options) {
	const f = norm(filename)
	if (!/\.(m|c)?ts$/.test(f) || f.endsWith('.d.ts') || isTestFile(f) || fileExcluded(f, options)) {
		return []
	}

	const out = []
	const visit = (node, inHook, seen) => {
		if (!node || typeof node !== 'object' || seen.has(node)) {
			return
		}

		seen.add(node)
		if (Array.isArray(node)) {
			for (const child of node) {
				visit(child, inHook, seen)
			}

			return
		}

		if (typeof node.type !== 'string') {
			return
		}

		let now = inHook
		if (
			(node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
			/^use[A-Z$]/.test(node.id?.name ?? '')
		) {
			now = true
		}

		if (node.type === 'VariableDeclarator' && /^use[A-Z$]/.test(node.id?.name ?? '')) {
			now = true
		}

		if (
			!inHook &&
			node.type === 'CallExpression' &&
			node.callee?.type === 'Identifier' &&
			/^use[A-Z$]/.test(node.callee.name)
		) {
			out.push({
				node: node.callee,
				message: `'${node.callee.name}()' in a .ts file outside a use*-named function — hook calls belong in .tsx/.tsrx (or a custom-hook module).`,
			})
		}

		for (const [key, value] of Object.entries(node)) {
			if (key === 'parent' || key === 'loc' || key === 'metadata' || key === 'range') {
				continue
			}

			visit(value, now, seen)
		}
	}

	visit(program, false, new Set())
	return out
}

// ---------- .tsrx-only checks (run by lint-tsrx.mjs) ----------

export const NATIVE_PRAGMA = '/** @jsxImportSource @nativescript-community/octane */'

// The pragma sets the JSX import source — only files that contain JSX need
// it. JSX-free native leaves (styled.native, use-store.native) omit it by
// design.
export function checkNativePragmaFirstLine(program, source, filename, options) {
	if (!/\.(native|ios|android)\.tsrx$/.test(norm(filename)) || fileExcluded(filename, options)) {
		return []
	}

	if (source.startsWith(NATIVE_PRAGMA)) {
		return []
	}

	for (const [node] of walk(program)) {
		if (node.type === 'JSXOpeningElement') {
			return [
				{
					node: program,
					message: `Native leaves with JSX must start with '${NATIVE_PRAGMA}' on line 1 — nothing may precede it.`,
				},
			]
		}
	}

	return []
}

const TSRX_TEXT_BREAKERS = /•/

export function checkNoJsxTextBreakers(program, _src, filename, options) {
	if (!filename.endsWith('.tsrx') || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (node.type === 'JSXText' && TSRX_TEXT_BREAKERS.test(node.value ?? '')) {
			const text = (node.value ?? '').trim().slice(0, 40)
			out.push({
				node,
				message: `Literal '${text}' in JSX text breaks tsrx-tsc — wrap it in braces: {'…'}`,
			})
		}
	}

	return out
}

// Bare `cond && <jsx>` and ternaries at the implicit-render root are outside
// the TSRX grammar — they parse as a dead ExpressionStatement in the block
// body (evaluated, discarded) instead of becoming the render output. Use
// @if/@else.
const containsJsx = (node) => {
	for (const [n] of walk(node)) {
		if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
			return true
		}
	}

	return false
}

export function checkNoRootLogicalRender(program, _src, filename, options) {
	if (!filename.endsWith('.tsrx') || fileExcluded(filename, options)) {
		return []
	}

	const out = []
	for (const [node] of walk(program)) {
		if (node.type !== 'JSXCodeBlock') {
			continue
		}

		const render = node.render
		if (render?.type === 'LogicalExpression' || render?.type === 'ConditionalExpression') {
			out.push({
				node: render,
				message: `'${render.type === 'ConditionalExpression' ? 'ternary' : render.operator}' at the render root is outside the implicit-render grammar — use @if/@else blocks.`,
			})

			continue
		}

		const last = node.body?.[node.body.length - 1]
		if (!render && last?.type === 'ExpressionStatement' && containsJsx(last.expression)) {
			out.push({
				node: last,
				message: `JSX here is evaluated and discarded — nothing renders. Only a JSX value at the block end renders; use @if/@else for conditions.`,
			})
		}
	}

	return out
}

// ---------- rule table ----------

export const XPLAT_CHECKS = {
	'no-dom-globals': checkNoDomGlobals,
	'no-web-only-api': checkNoWebOnlyApi,
	'element-vocabulary': checkElementVocabulary,
	'no-nativescript-import': checkNoNativescriptImport,
	'no-ns-deep-import': checkNoNsDeepImport,
	'platform-subpath-import': checkPlatformSubpathImport,
	'no-native-dead-style': checkNoNativeDeadStyle,
	'no-line-height-unitless': checkNoLineHeightUnitless,
	'no-style-string': checkNoStyleString,
	'no-unknown-class': checkNoUnknownClass,
	'no-ts-imports-tsrx': checkNoTsImportsTsrx,
	'signal-dollar-suffix': checkSignalDollarSuffix,
	'require-signals-runtime': checkRequireSignalsRuntime,
	'no-view-onpress': checkNoViewOnPress,
	'no-console-debug': checkNoConsoleDebug,
	'hooks-in-plain-ts': checkHooksInPlainTs,
	'native-pragma-first-line': checkNativePragmaFirstLine,
	'no-jsx-text-breakers': checkNoJsxTextBreakers,
	'no-root-logical-render': checkNoRootLogicalRender,
}
