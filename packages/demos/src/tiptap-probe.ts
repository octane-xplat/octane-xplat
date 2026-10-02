/** Import-hygiene probe for the DOM-free tiptap/ProseMirror slices on the
 *  NativeScript runtime. Everything arrives via dynamic import with literal
 *  specifiers so each module's load is an independently reportable step and
 *  the bundler can still resolve the graph statically.
 *
 *  Observation channel: `[probe]` console lines + the step list rendered by
 *  TiptapProbe (XCTest asserts the `tiptap-probe-summary` label). */

export interface ProbeStep {
	id: string
	label: string
	status: 'pass' | 'fail'
	detail?: string
}

const DOC_JSON = {
	type: 'doc',
	content: [
		{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hello' }] },
		{
			type: 'paragraph',
			content: [
				{ type: 'text', text: 'bold ', marks: [{ type: 'bold' }] },
				{ type: 'text', text: 'plain ' },
				{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://x.dev' } }] },
			],
		},
		{
			type: 'bulletList',
			content: [
				{
					type: 'listItem',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }],
				},
			],
		},
		{
			type: 'orderedList',
			content: [
				{
					type: 'listItem',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
				},
			],
		},
		{
			type: 'blockquote',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }],
		},
		{ type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1' }] },
		{ type: 'horizontalRule' },
	],
}

const short = (e: unknown) => String(e).replace(/\s+/g, ' ').slice(0, 140)

/** zeed-dom's classList is a plain {contains,add,remove} object; tiptap's
 *  codeBlock parseHTML spreads it. Wrap the VElement getter so it hands back
 *  an iterable array that keeps the mutation methods. */
function patchClassList(VElement: any): void {
	const proto = VElement?.prototype
	if (!proto) {
		throw new Error('VElement.prototype unavailable')
	}

	const desc = Object.getOwnPropertyDescriptor(proto, 'classList')
	if (!desc?.get) {
		throw new Error('classList is not a prototype getter')
	}

	if ((desc.get as any).__xplatPatched) {
		return
	}

	const patched = function (this: any) {
		const cl = desc.get!.call(this)
		if (cl && typeof cl[Symbol.iterator] !== 'function') {
			const tokens = String(this.getAttribute('class') ?? '')
				.split(/\s+/)
				.filter(Boolean)

			return Object.assign(tokens, cl)
		}

		return cl
	}

	;(patched as any).__xplatPatched = true
	Object.defineProperty(proto, 'classList', {
		configurable: true,
		get: patched,
		set: desc.set,
	})
}

/** Install the minimal `window`/`document` globals generateJSON's
 *  elementFromString reads. Only installs when the host lacks them, so a
 *  real DOM (web target) is never clobbered. */
function installDomShim(zeed: any): void {
	const g = globalThis as any
	if (g.window?.DOMParser) {
		return
	}

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

export async function runTiptapProbe(): Promise<ProbeStep[]> {
	const steps: ProbeStep[] = []
	const step = (id: string, label: string, ok: boolean, detail?: string) => {
		steps.push({ id, label, status: ok ? 'pass' : 'fail', detail })
		console.log(`[probe] ${id} ${ok ? 'PASS' : 'FAIL'}${detail ? ' — ' + detail : ''}`)
	}

	const tryImport = async (id: string, label: string, load: () => Promise<any>) => {
		try {
			const m = await load()
			step(id, `import ${label}`, true)
			return m
		} catch (e) {
			step(id, `import ${label}`, false, short(e))
			return null
		}
	}

	const model = await tryImport('pm-model', '@tiptap/pm/model', () => import('@tiptap/pm/model'))
	const state = await tryImport('pm-state', '@tiptap/pm/state', () => import('@tiptap/pm/state'))
	await tryImport('pm-transform', '@tiptap/pm/transform', () => import('@tiptap/pm/transform'))
	// The DOM-bound slice: observed, not gated — it deciding the leaf's import
	// boundary is the point of the probe.
	await tryImport(
		'pm-view',
		'@tiptap/pm/view (DOM-bound, expected-fail ok)',
		() => import('@tiptap/pm/view'),
	)

	const core = await tryImport('tiptap-core', '@tiptap/core', () => import('@tiptap/core'))
	const sk = await tryImport(
		'starter-kit',
		'@tiptap/starter-kit',
		() => import('@tiptap/starter-kit'),
	)

	const sr = await tryImport(
		'static-renderer',
		'@tiptap/static-renderer',
		() => import('@tiptap/static-renderer'),
	)

	const zeed = await tryImport('zeed-dom', 'zeed-dom', () => import('zeed-dom'))

	if (!model || !state || !core || !sk || !sr || !zeed) {
		step('gate', 'all required slices loaded', false, 'required module missing')
		return steps
	}

	step('gate', 'all required slices loaded', true)

	const StarterKit = (sk as any).default ?? (sk as any).StarterKit
	let schema: any
	try {
		schema = core.getSchema([StarterKit])
		step(
			'schema',
			'getSchema(StarterKit)',
			true,
			`${Object.keys(schema.nodes).length} nodes/${Object.keys(schema.marks).length} marks`,
		)
	} catch (e) {
		step('schema', 'getSchema(StarterKit)', false, short(e))
		return steps
	}

	let doc: any
	try {
		doc = model.Node.fromJSON(schema, DOC_JSON)
		step('from-json', 'Node.fromJSON', doc?.type?.name === 'doc', `nodeSize ${doc?.nodeSize}`)
	} catch (e) {
		step('from-json', 'Node.fromJSON', false, short(e))
	}

	let html: string | undefined
	try {
		const render = sr.renderToHTMLString
		html = render({ extensions: [StarterKit], content: DOC_JSON })
		step(
			'to-html',
			'renderToHTMLString',
			typeof html === 'string' && html.length > 0,
			`${html?.length} chars`,
		)
	} catch (e) {
		step('to-html', 'renderToHTMLString', false, short(e))
	}

	try {
		patchClassList(zeed.VElement)
		installDomShim(zeed)
		step('shim', 'window/DOMParser + classList shim', true)
	} catch (e) {
		step('shim', 'window/DOMParser + classList shim', false, short(e))
	}

	if (html) {
		try {
			const back = core.generateJSON(html, [StarterKit])
			const types = (back?.content ?? []).map((n: any) => n.type).join(',')
			step(
				'to-json',
				'generateJSON(HTML)',
				Array.isArray(back?.content) && back.content.length > 0,
				types,
			)

			const html2 = sr.renderToHTMLString({ extensions: [StarterKit], content: back })
			step(
				'round-trip',
				'JSON→HTML→JSON→HTML stable',
				html2 === html,
				html2 === html ? undefined : 'drift',
			)
		} catch (e) {
			step('to-json', 'generateJSON(HTML)', false, short(e))
		}
	}

	return steps
}
