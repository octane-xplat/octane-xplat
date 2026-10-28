// Babel pass that compiles \p{…}/\P{…} Unicode property escapes away for
// NativeScript's ICU-less V8 (see .agents/docs/notes/nativescript-no-icu.md).
// Registered by xplatNative so every transformed module is covered. Upstream
// @nativescript/vite runs the equivalent ns-vendor-unicode-regex esbuild
// plugin over node_modules *.[mc]js in its dev-server esbuild passes (core,
// deps and vendor bundles); this plugin fills the gaps upstream leaves —
// production rolldown builds, per-module /ns/m dev serving, non-.js modules,
// and sources outside node_modules.
import { transformAsync, transformSync, types } from '@babel/core'
import unicodeSets from '@babel/plugin-transform-unicode-sets-regex'
import unicodeProperties from '@babel/plugin-transform-unicode-property-regex'

const HAS_PROPERTY_ESCAPE = /\\[pP]\{/
const JS_MODULE_ID = /\.[cm]?[jt]sx?(?:[?#]|$)/
const REGEX_ESCAPE_PLUGINS = () => [
	unicodeSets.default ?? unicodeSets,
	unicodeProperties.default ?? unicodeProperties,
]

/** Compile `\p{NAME}` to its equivalent character-class ranges for splicing
 *  into template-literal RegExp patterns. Returns the class inner text and
 *  whether the property is negated. */
const expansionCache = new Map<string, { inner: string; negated: boolean }>()
function expandEscape(letter: string, body: string) {
	const key = `${letter}{${body}}`
	let entry = expansionCache.get(key)
	if (entry === undefined) {
		const res = transformSync(`/${'\\' + key}/u`, {
			filename: 'xplat-escape.js',
			configFile: false,
			babelrc: false,
			sourceMaps: false,
			ast: false,
			plugins: REGEX_ESCAPE_PLUGINS(),
		})

		const src = String(res.code).trim().replace(/;+$/, '')
		const negated = src.startsWith('/[^')
		entry = { inner: src.slice(negated ? 3 : 2, src.lastIndexOf(']')), negated }
		expansionCache.set(key, entry)
	}
	return entry
}

const TEMPLATE_PROPERTY_ESCAPE = /\\([pP])\{([^}]+)\}/g

/** True when `offset` in the regex source sits inside a `[…]` class
 *  (`u`-mode classes don't nest; `\` escapes the next character). */
function inClass(source: string, offset: number) {
	let open = false
	for (let i = 0; i < offset; i++) {
		const ch = source[i]
		if (ch === '\\') {
			i++
		} else if (ch === '[') {
			open = true
		} else if (ch === ']') {
			open = false
		}
	}
	return open
}

/** Rewrite `\p{…}` escapes inside a template-literal `u`-flag pattern into
 *  explicit ranges so computed `new RegExp(\`…\`, 'u')` calls survive on
 *  ICU-less runtimes. Works on the cooked (regex-source) text and re-escapes
 *  it for the template. Leaves the pattern untouched when a `\P{…}` sits
 *  inside a class, which cannot be expressed without set operations. */
function expandTemplateEscapes(pattern: types.TemplateLiteral) {
	const next = pattern.quasis.map(({ value: { cooked } }) => {
		if (cooked == null || !HAS_PROPERTY_ESCAPE.test(cooked)) {
			return null
		}
		for (const m of cooked.matchAll(TEMPLATE_PROPERTY_ESCAPE)) {
			if (m[1] === 'P' && inClass(cooked, m.index)) {
				return undefined
			}
		}
		return cooked.replace(TEMPLATE_PROPERTY_ESCAPE, (_m, letter, body, offset) => {
			const exp = expandEscape(letter, body)
			if (inClass(cooked, offset)) {
				return exp.inner
			}
			return exp.negated ? `[^${exp.inner}]` : `[${exp.inner}]`
		})
	})
	if (next.includes(undefined)) {
		return
	}
	next.forEach((cooked, i) => {
		if (cooked == null) {
			return
		}
		const raw = cooked.replace(/[\\`]|\$(?=\{)/g, '\\$&')
		pattern.quasis[i].value = { raw, cooked }
	})
}

/** Compile Unicode properties for the pinned ICU-less runtimes without changing globals. */
export function transformNativeRegex(code: string, filename = 'xplat-native.ts') {
	return transformAsync(code, {
		filename,
		configFile: false,
		babelrc: false,
		sourceMaps: true,
		plugins: [
			// Deps also embed constant RegExp constructors. Turn only unshadowed
			// built-in constructors into literals for Babel's standard regex transforms.
			() => ({
				visitor: {
					'NewExpression|CallExpression'(path) {
						const node = path.node
						if (
							!types.isIdentifier(node.callee, { name: 'RegExp' }) ||
							path.scope.getBinding('RegExp') ||
							node.arguments.length !== 2
						) {
							return
						}

						const [pattern, flags] = node.arguments
						if (!types.isStringLiteral(flags) || !/[uv]/.test(flags.value)) {
							return
						}
						if (types.isStringLiteral(pattern) && HAS_PROPERTY_ESCAPE.test(pattern.value)) {
							path.replaceWith(types.regExpLiteral(pattern.value, flags.value))
							return
						}
						// Computed patterns (e.g. `new RegExp(\`…${x.source}…\`, 'ug')`)
						// can't become literals; expand the static \p{…} escapes inside
						// the template into explicit ranges instead.
						if (types.isTemplateLiteral(pattern) && !flags.value.includes('v')) {
							expandTemplateEscapes(pattern)
						}
					},
				},
			}),
			// `v`-flag sets can carry \p{…} too; the sets transform must run first.
			unicodeSets.default ?? unicodeSets,
			unicodeProperties.default ?? unicodeProperties,
		],
	})
}

export function nativeUnicodeRegex() {
	return {
		name: 'xplat-native-unicode-regex',
		config() {
			return {
				optimizeDeps: {
					// Dep pre-bundling never runs the plugin `transform` hook, and
					// upstream's unicode pass only lives in the NS esbuild passes.
					rolldownOptions: { plugins: [nativeUnicodeRegexOptimizeDeps()] },
				},
			}
		},
		async transform(code, id) {
			if (!HAS_PROPERTY_ESCAPE.test(code) || !JS_MODULE_ID.test(id)) {
				return null
			}

			const result = await transformNativeRegex(code, id.split('?')[0])
			return result ? { code: result.code, map: result.map } : null
		},
	}
}

function nativeUnicodeRegexOptimizeDeps() {
	return {
		name: 'xplat-native-unicode-regex-optimize-deps',
		async transform(code, id) {
			if (!HAS_PROPERTY_ESCAPE.test(code) || !JS_MODULE_ID.test(id)) {
				return null
			}

			const result = await transformNativeRegex(code, id.split('?')[0])
			return result ? { code: result.code, map: result.map } : null
		},
	}
}
