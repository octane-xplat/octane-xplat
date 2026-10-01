/** Import-hygiene probe for the DOM-free lexical slices on the NativeScript
 *  runtime. Everything arrives via dynamic import with literal specifiers so
 *  each module's load is an independently reportable step and the bundler can
 *  still resolve the graph statically.
 *
 *  Exercises the path the @octane-xplat/lexical leaf's native bridge will use:
 *  a headless `createEditor` (no `setRootElement`, no @lexical/headless — that
 *  package pulls happy-dom) doing HTML ↔ SerializedEditorState round-trips
 *  through @lexical/html on top of a zeed-dom shim.
 *
 *  Observation channel: `[probe]` console lines + the step list rendered by
 *  LexicalProbe (the sweep asserts the `lexical-probe-summary` label). */

export interface ProbeStep {
	id: string;
	label: string;
	status: 'pass' | 'fail';
	detail?: string;
}

const short = (e: unknown) => String(e).replace(/\s+/g, ' ').slice(0, 140);

// Aztec-shaped input: headings, inline marks, link, nested list, quote, code
// block, rule, and an inline-style alignment — the formats the facade shares.
const HTML_IN =
	'<h1>Title</h1>' +
	'<p>Hello <b>bold</b> <i>it</i> <a href="https://x.test">link</a></p>' +
	'<ul><li>one<ul><li>nested</li></ul></li></ul>' +
	'<blockquote>q</blockquote><pre>code blk</pre><hr>' +
	'<p style="text-align: center">centered</p>';

function chainDesc(proto: object, key: string): PropertyDescriptor | undefined {
	let o: object | null = proto;
	while (o && o !== Object.prototype) {
		const d = Object.getOwnPropertyDescriptor(o, key);
		if (d) {
			return d;
		}
		o = Object.getPrototypeOf(o);
	}
	return undefined;
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

function cssText(el: any): string {
	return el.getAttribute('style') ?? '';
}

function writeStyleProp(el: any, key: string, value: string): void {
	const rules = cssText(el)
		.split(';')
		.map((s: string) => s.trim())
		.filter(Boolean)
		.filter((r: string) => !r.startsWith(kebab(key) + ':'));
	if (value !== '' && value != null) {
		rules.push(`${kebab(key)}: ${value}`);
	}
	el.setAttribute('style', rules.join('; '));
}

/** zeed-dom is a vdom, not a DOM — lexical's walkers and exportDOM need four
 *  categories of patches beyond the tiptap bridge's classList fix:
 *
 *  1. `parentElement` (absent pre-0.18 zeed-dom; guarded either way).
 *  2. `firstChild`/`lastChild`/`sibling` accessors return `undefined` where the
 *     DOM spec says `null`, and the getters live on an ancestor proto —
 *     chainDesc finds them so the coercion wraps the real getter.
 *  3. `style`: DOM reads of unset props return `''`, and lexical's exportDOM
 *     writes via property assignment and `setProperty` — neither serializes in
 *     zeed. The proxy defaults missing props to `''` and writes through to the
 *     element's `style` attribute.
 *  4. Attribute-valued property assignments (`element.href = …`) must land as
 *     attributes — LinkNode.exportDOM sets `anchor.href`, dropping the link
 *     target entirely without this.
 *
 *  Plus the tiptap bridge's classList/DOMParser install and the `Node`
 *  constants global ($setTextContent reads `Node.TEXT_NODE`). */
function installLexicalDomShim(zeed: any): void {
	const bootDoc = zeed.createHTMLDocument();
	bootDoc.body.innerHTML = '<p>x</p>';
	const elProto = Object.getPrototypeOf(bootDoc.body.childNodes[0]);
	const textProto = Object.getPrototypeOf(bootDoc.body.childNodes[0].childNodes[0]);

	for (const p of [elProto, textProto]) {
		if (!chainDesc(p, 'parentElement')) {
			Object.defineProperty(p, 'parentElement', {
				configurable: true,
				get(this: any) {
					const par = this.parentNode;
					return par && par.nodeType === 1 ? par : null;
				},
			});
		}
		for (const k of ['firstChild', 'lastChild', 'nextSibling', 'previousSibling']) {
			const d = chainDesc(p, k);
			Object.defineProperty(p, k, {
				configurable: true,
				get(this: any) {
					const v = d?.get ? d.get.call(this) : undefined;
					return v ?? null;
				},
				set: d?.set,
			});
		}
	}

	const styleCache = new WeakMap();
	Object.defineProperty(elProto, 'style', {
		configurable: true,
		get(this: any) {
			let proxy = styleCache.get(this);
			if (!proxy) {
				const el = this;
				proxy = new Proxy(
					{},
					{
						get: (_t, k) => {
							if (k === 'setProperty') {
								return (prop: string, value: string) => writeStyleProp(el, prop, value);
							}
							if (k === 'removeProperty') {
								return (prop: string) => {
									writeStyleProp(el, prop, '');
									return '';
								};
							}
							if (k === 'cssText') {
								return cssText(el);
							}
							if (k === 'getPropertyValue') {
								return (prop: string) => {
									const raw = cssText(el)
										.split(';')
										.map((s: string) => s.trim())
										.find((r: string) => r.startsWith(prop + ':'));
									return raw ? raw.slice(raw.indexOf(':') + 1).trim() : '';
								};
							}
							if (typeof k === 'string') {
								const raw = cssText(el)
									.split(';')
									.map((s: string) => s.trim())
									.find((r: string) => r.startsWith(kebab(k) + ':'));
								return raw ? raw.slice(raw.indexOf(':') + 1).trim() : '';
							}
							return undefined;
						},
						set: (_t, k, v) => {
							writeStyleProp(el, k, v);
							return true;
						},
					},
				);
				styleCache.set(this, proxy);
			}
			return proxy;
		},
	});

	for (const attr of ['href', 'target', 'rel', 'title']) {
		const d = chainDesc(elProto, attr);
		if (!d?.get && !d?.set) {
			Object.defineProperty(elProto, attr, {
				configurable: true,
				get(this: any) {
					return this.getAttribute(attr) ?? '';
				},
				set(this: any, v: string) {
					this.setAttribute(attr, v);
				},
			});
		}
	}

	const clDesc = chainDesc(elProto, 'classList');
	if (clDesc?.get) {
		Object.defineProperty(elProto, 'classList', {
			configurable: true,
			get(this: any) {
				const cl = clDesc.get!.call(this);
				if (cl && typeof cl[Symbol.iterator] !== 'function') {
					const tokens = String(this.getAttribute('class') ?? '')
						.split(/\s+/)
						.filter(Boolean);
					return Object.assign(tokens, cl);
				}
				return cl;
			},
			set: clDesc.set,
		});
	}

	const g = globalThis as any;
	if (!g.window?.DOMParser) {
		class ZeedDOMParser {
			parseFromString(html: string) {
				const doc = zeed.createHTMLDocument();
				doc.body.innerHTML = html;
				return doc;
			}
		}
		g.window = { DOMParser: ZeedDOMParser };
		g.document = zeed.createHTMLDocument();
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
	};
}

export async function runLexicalProbe(): Promise<ProbeStep[]> {
	const steps: ProbeStep[] = [];
	const step = (id: string, label: string, ok: boolean, detail?: string) => {
		steps.push({ id, label, status: ok ? 'pass' : 'fail', detail });
		console.log(`[probe] ${id} ${ok ? 'PASS' : 'FAIL'}${detail ? ' — ' + detail : ''}`);
	};

	const tryImport = async (id: string, label: string, load: () => Promise<any>) => {
		try {
			const m = await load();
			step(id, `import ${label}`, true);
			return m;
		} catch (e) {
			step(id, `import ${label}`, false, short(e));
			return null;
		}
	};

	const lexical = await tryImport('lexical', 'lexical', () => import('lexical'));
	const html = await tryImport('lex-html', '@lexical/html', () => import('@lexical/html'));
	const rt = await tryImport('lex-richtext', '@lexical/rich-text', () => import('@lexical/rich-text'));
	const list = await tryImport('lex-list', '@lexical/list', () => import('@lexical/list'));
	const link = await tryImport('lex-link', '@lexical/link', () => import('@lexical/link'));
	const code = await tryImport('lex-code', '@lexical/code', () => import('@lexical/code'));
	const ext = await tryImport('lex-extension', '@lexical/extension', () => import('@lexical/extension'));
	const zeed = await tryImport('zeed-dom', 'zeed-dom', () => import('zeed-dom'));

	if (!lexical || !html || !rt || !list || !link || !code || !ext || !zeed) {
		step('gate', 'all required slices loaded', false, 'required module missing');
		return steps;
	}
	step('gate', 'all required slices loaded', true);

	try {
		installLexicalDomShim(zeed);
		step('shim', 'zeed-dom DOM shim', true);
	} catch (e) {
		step('shim', 'zeed-dom DOM shim', false, short(e));
		return steps;
	}

	// The leaf's native node set — Aztec's capability surface in lexical form.
	const NODES = [
		rt.HeadingNode,
		rt.QuoteNode,
		list.ListNode,
		list.ListItemNode,
		link.LinkNode,
		code.CodeNode,
		ext.HorizontalRuleNode,
	];

	let editor: any;
	try {
		// createEditor without setRootElement is the headless path — no
		// @lexical/headless (it pulls happy-dom onto the runtime).
		editor = lexical.createEditor({
			namespace: 'lexical-probe',
			nodes: NODES,
			onError: (e: Error) => console.log('[probe] editor error: ' + e.message),
		});
		step('editor', 'headless createEditor', true);
	} catch (e) {
		step('editor', 'headless createEditor', false, short(e));
		return steps;
	}

	let docJSON: string | undefined;
	try {
		editor.update(
			() => {
				const dom = new (globalThis as any).window.DOMParser().parseFromString(HTML_IN);
				lexical.$getRoot().clear().append(...html.$generateNodesFromDOM(editor, dom));
			},
			{ discrete: true },
		);
		const st = editor.getEditorState().toJSON();
		docJSON = JSON.stringify(st);
		const types = st.root.children.map((c: any) => c.type).join(',');
		const linkNode = st.root.children
			.flatMap((c: any) => c.children ?? [])
			.find((c: any) => c.type === 'link');
		step(
			'to-json',
			'HTML→SerializedEditorState',
			st.root.children.length >= 6 && linkNode?.url === 'https://x.test',
			types + (linkNode ? ' link=' + linkNode.url : ' link=missing'),
		);
	} catch (e) {
		step('to-json', 'HTML→SerializedEditorState', false, short(e));
		return steps;
	}

	let outHtml = '';
	try {
		editor.read(() => {
			outHtml = html.$generateHtmlFromNodes(editor);
		});
		step(
			'to-html',
			'$generateHtmlFromNodes',
			outHtml.includes('href="https://x.test"') && outHtml.includes('text-align: center'),
			`href ${outHtml.includes('href="https://x.test"') ? 'kept' : 'LOST'}, ` +
				`align ${outHtml.includes('text-align') ? 'kept' : 'LOST'}, ${outHtml.length} chars`,
		);
	} catch (e) {
		step('to-html', '$generateHtmlFromNodes', false, short(e));
	}

	if (docJSON) {
		try {
			const editor2 = lexical.createEditor({
				namespace: 'lexical-probe-2',
				nodes: NODES,
				onError: () => undefined,
			});
			editor2.setEditorState(editor2.parseEditorState(docJSON));
			let html2 = '';
			editor2.read(() => {
				html2 = html.$generateHtmlFromNodes(editor2);
			});
			step(
				'round-trip',
				'JSON→state→HTML stable',
				html2 === outHtml,
				html2 === outHtml ? undefined : 'drift',
			);
		} catch (e) {
			step('round-trip', 'JSON→state→HTML stable', false, short(e));
		}
	}

	return steps;
}
