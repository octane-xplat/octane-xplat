/** Lazy lexical document-model bridge for native runtimes. The DOM-free
 *  slices (lexical core + the Aztec-shaped node packages, @lexical/html,
 *  zeed-dom as the parser host) load on demand — on a runtime that can't
 *  host them the bridge settles to unavailable and callers get null/no-op.
 *
 *  Conversions run on a single headless `createEditor` (no `setRootElement`,
 *  no @lexical/headless — that package pulls happy-dom). Each call swaps the
 *  editor state wholesale, so the shared instance is a pure converter.
 *
 *  Import behavior was proven by the demos probe (see packages/demos
 *  LexicalProbe): all slices load on both NS engines and the round-trip
 *  preserves links/alignment on 14/14 steps; the failure mode left is a
 *  future version or bundler regression, which the catch below degrades
 *  instead of crashing. */

import type { LexicalJSON } from './types'

interface Bridge {
	editor: any
	lexical: any
	html: any
	zeed: any
}

let bridge: Bridge | null | undefined

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())

function chainDesc(proto: object, key: string): PropertyDescriptor | undefined {
	let o: object | null = proto
	while (o && o !== Object.prototype) {
		const d = Object.getOwnPropertyDescriptor(o, key)
		if (d) {
			return d
		}

		o = Object.getPrototypeOf(o)
	}

	return undefined
}

function cssText(el: any): string {
	return el.getAttribute('style') ?? ''
}

function writeStyleProp(el: any, key: string, value: string): void {
	const rules = cssText(el)
		.split(';')
		.map((s: string) => s.trim())
		.filter(Boolean)
		.filter((r: string) => !r.startsWith(kebab(key) + ':'))

	if (value !== '' && value != null) {
		rules.push(`${kebab(key)}: ${value}`)
	}

	el.setAttribute('style', rules.join('; '))
}

/** zeed-dom is a vdom, not a DOM — lexical's walkers and exportDOM need four
 *  categories of patches beyond the classList/DOMParser install the tiptap
 *  bridge carries:
 *
 *  1. `parentElement` (absent pre-0.18 zeed-dom; guarded either way).
 *  2. `firstChild`/`lastChild`/sibling accessors return `undefined` where the
 *     DOM spec says `null`, and the getters live on an ancestor proto —
 *     chainDesc finds them so the coercion wraps the real getter.
 *  3. `style`: DOM reads of unset props return `''`, and lexical's exportDOM
 *     writes via property assignment and `setProperty` — neither serializes
 *     in zeed. The proxy defaults missing props to `''` and writes through
 *     to the element's `style` attribute.
 *  4. Attribute-valued property assignments (`element.href = …`) must land
 *     as attributes — LinkNode.exportDOM sets `anchor.href`, dropping the
 *     link target entirely without this.
 *
 *  Plus the `Node` constants global (lexical's helpers read
 *  `Node.TEXT_NODE`). */
function installLexicalDomShim(zeed: any): void {
	const bootDoc = zeed.createHTMLDocument()
	bootDoc.body.innerHTML = '<p>x</p>'
	const elProto = Object.getPrototypeOf(bootDoc.body.childNodes[0])
	const textProto = Object.getPrototypeOf(bootDoc.body.childNodes[0].childNodes[0])

	for (const p of [elProto, textProto]) {
		if (!chainDesc(p, 'parentElement')) {
			Object.defineProperty(p, 'parentElement', {
				configurable: true,
				get(this: any) {
					const par = this.parentNode
					return par && par.nodeType === 1 ? par : null
				},
			})
		}

		for (const k of ['firstChild', 'lastChild', 'nextSibling', 'previousSibling']) {
			const d = chainDesc(p, k)
			Object.defineProperty(p, k, {
				configurable: true,
				get(this: any) {
					const v = d?.get ? d.get.call(this) : undefined
					return v ?? null
				},
				set: d?.set,
			})
		}
	}

	const styleCache = new WeakMap()
	Object.defineProperty(elProto, 'style', {
		configurable: true,
		get(this: any) {
			let proxy = styleCache.get(this)
			if (!proxy) {
				const el = this
				proxy = new Proxy(
					{},
					{
						get: (_t, k) => {
							if (k === 'setProperty') {
								return (prop: string, value: string) => writeStyleProp(el, prop, value)
							}

							if (k === 'removeProperty') {
								return (prop: string) => {
									writeStyleProp(el, prop, '')
									return ''
								}
							}

							if (k === 'cssText') {
								return cssText(el)
							}

							if (k === 'getPropertyValue') {
								return (prop: string) => {
									const raw = cssText(el)
										.split(';')
										.map((s: string) => s.trim())
										.find((r: string) => r.startsWith(prop + ':'))

									return raw ? raw.slice(raw.indexOf(':') + 1).trim() : ''
								}
							}

							if (typeof k === 'string') {
								const raw = cssText(el)
									.split(';')
									.map((s: string) => s.trim())
									.find((r: string) => r.startsWith(kebab(k) + ':'))

								return raw ? raw.slice(raw.indexOf(':') + 1).trim() : ''
							}

							return undefined
						},
						set: (_t, k, v) => {
							if (typeof k === 'string') {
								writeStyleProp(el, k, v)
							}

							return true
						},
					},
				)

				styleCache.set(this, proxy)
			}

			return proxy
		},
	})

	for (const attr of ['href', 'target', 'rel', 'title']) {
		const d = chainDesc(elProto, attr)
		if (!d?.get && !d?.set) {
			Object.defineProperty(elProto, attr, {
				configurable: true,
				get(this: any) {
					return this.getAttribute(attr) ?? ''
				},
				set(this: any, v: string) {
					this.setAttribute(attr, v)
				},
			})
		}
	}

	const clDesc = chainDesc(elProto, 'classList')
	if (clDesc?.get) {
		Object.defineProperty(elProto, 'classList', {
			configurable: true,
			get(this: any) {
				const cl = clDesc.get!.call(this)
				if (cl && typeof cl[Symbol.iterator] !== 'function') {
					const tokens = String(this.getAttribute('class') ?? '')
						.split(/\s+/)
						.filter(Boolean)

					return Object.assign(tokens, cl)
				}

				return cl
			},
			set: clDesc.set,
		})
	}

	const g = globalThis as any
	if (!g.window?.DOMParser) {
		class ZeedDOMParser {
			parseFromString(html: string) {
				const doc = zeed.createHTMLDocument()
				doc.body.innerHTML = html
				return doc
			}
		}

		g.window = { DOMParser: ZeedDOMParser }
		g.document = zeed.createHTMLDocument()
	}

	g.Node = g.Node ?? {
		ELEMENT_NODE: 1,
		ATTRIBUTE_NODE: 2,
		TEXT_NODE: 3,
		CDATA_SECTION_NODE: 4,
		PROCESSING_INSTRUCTION_NODE: 7,
		COMMENT_NODE: 8,
		DOCUMENT_NODE: 9,
		DOCUMENT_TYPE_NODE: 10,
		DOCUMENT_FRAGMENT_NODE: 11,
	}
}

export async function ensureJSONBridge(): Promise<boolean> {
	if (bridge !== undefined) {
		return bridge !== null
	}

	try {
		const [lexical, html, rt, list, link, code, ext, zeed] = await Promise.all([
			import('lexical'),
			import('@lexical/html'),
			import('@lexical/rich-text'),
			import('@lexical/list'),
			import('@lexical/link'),
			import('@lexical/code'),
			import('@lexical/extension'),
			import('zeed-dom'),
		])

		installLexicalDomShim(zeed)

		// The leaf's native node set — Aztec's capability surface in lexical
		// form. taskList/highlight/sub/sup formats have no lexical node here
		// and stay no-ops on the facade.
		const editor = lexical.createEditor({
			namespace: 'octane-xplat/lexical',
			nodes: [
				rt.HeadingNode,
				rt.QuoteNode,
				list.ListNode,
				list.ListItemNode,
				link.LinkNode,
				code.CodeNode,
				ext.HorizontalRuleNode,
			],
			onError: () => undefined,
		})

		bridge = { editor, lexical, html, zeed }

		return true
	} catch {
		bridge = null
		return false
	}
}

export function jsonBridgeReady(): boolean {
	return bridge != null
}

function parseHTML(htmlText: string): any {
	const doc = bridge!.zeed.createHTMLDocument()
	doc.body.innerHTML = htmlText
	return doc
}

/** HTML → serialized editor state through lexical's own DOM import rules.
 *  Null when the bridge hasn't loaded (call ensureJSONBridge first / check
 *  `jsonBridgeReady`). */
export function htmlToJSON(htmlText: string): LexicalJSON | null {
	if (!bridge) {
		return null
	}

	try {
		bridge.editor.update(
			() => {
				const nodes = bridge!.html.$generateNodesFromDOM(bridge!.editor, parseHTML(htmlText))
				bridge!.lexical
					.$getRoot()
					.clear()
					.append(...nodes)
			},
			{ discrete: true },
		)

		return bridge.editor.getEditorState().toJSON() as LexicalJSON
	} catch {
		return null
	}
}

/** Serialized editor state → HTML via lexical's own exportDOM rules (no
 *  browser DOM — the zeed-dom shim stands in). */
export function jsonToHTML(doc: LexicalJSON): string | null {
	if (!bridge) {
		return null
	}

	try {
		bridge.editor.setEditorState(bridge.editor.parseEditorState(JSON.stringify(doc)))
		let out = ''
		bridge.editor.read(() => {
			out = bridge!.html.$generateHtmlFromNodes(bridge!.editor)
		})

		return out
	} catch {
		return null
	}
}
