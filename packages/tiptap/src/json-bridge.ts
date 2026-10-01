/** Lazy tiptap document-model bridge for native runtimes. The DOM-free
 *  slices (@tiptap/core schema + generateJSON, @tiptap/static-renderer,
 *  zeed-dom as the parser host) load on demand — on a runtime that can't
 *  host them the bridge settles to unavailable and callers get null/no-op.
 *
 *  Import behavior was proven by the demos probe (see packages/demos
 *  TiptapProbe): all four modules load cleanly on both NS engines; the
 *  failure mode left is a future version or bundler regression, which the
 *  catch below degrades instead of crashing. */

import type { TiptapJSON } from './types'

interface Bridge {
	generateJSON: (html: string, extensions: any[]) => any
	renderToHTMLString: (options: { extensions: any[]; content: any }) => string
	extensions: any[]
}

let bridge: Bridge | null | undefined

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

/** Install the minimal parse globals generateJSON's elementFromString
 *  reads. Only installs when the host lacks them, so a real DOM (web
 *  target) is never clobbered. */
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

export async function ensureJSONBridge(): Promise<boolean> {
	if (bridge !== undefined) {
		return bridge !== null
	}

	try {
		const [core, sk, sr, zeed] = await Promise.all([
			import('@tiptap/core'),
			import('@tiptap/starter-kit'),
			import('@tiptap/static-renderer'),
			import('zeed-dom'),
		])

		patchClassList(zeed.VElement)
		installDomShim(zeed)
		const StarterKit = (sk as any).default ?? (sk as any).StarterKit

		bridge = {
			generateJSON: core.generateJSON,
			renderToHTMLString: sr.renderToHTMLString,
			extensions: [StarterKit],
		}

		return true
	} catch {
		bridge = null
		return false
	}
}

/** HTML → doc JSON through tiptap's own parseHTML rules. Null when the
 *  bridge hasn't loaded (call ensureJSONBridge first / check `ready`). */
export function htmlToJSON(html: string): TiptapJSON | null {
	return (bridge?.generateJSON(html, bridge.extensions) as TiptapJSON | undefined) ?? null
}

/** Doc JSON → HTML via tiptap's own renderHTML rules (no DOM). */
export function jsonToHTML(doc: TiptapJSON): string | null {
	return bridge?.renderToHTMLString({ extensions: bridge.extensions, content: doc }) ?? null
}

export function jsonBridgeReady(): boolean {
	return bridge != null
}
