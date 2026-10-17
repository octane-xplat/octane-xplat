import { lexer } from 'marked'

// Markdown → the MdDoc AST that `@octane-xplat/ui`'s <Markdown> renders.
// Runs inside `xplat routes`/dev/build codegen — the parser is a CLI dep,
// never part of a runtime bundle. Output must stay JSON-serializable: it
// is embedded verbatim in routes.gen.data.ts.

const inline = (tokens) =>
	(tokens ?? []).flatMap((tok) => {
		switch (tok.type) {
			case 'codespan':
				return { t: 'code', text: tok.text }
			case 'strong':
				return { t: 'bold', children: inline(tok.tokens) }
			case 'em':
				return { t: 'em', children: inline(tok.tokens) }
			case 'link':
				return { t: 'link', text: inlineText(tok.tokens), href: tok.href }
			case 'image':
				return { t: 'text', text: tok.text ?? '' } // alt text only, v1
			case 'br':
				return { t: 'text', text: '\n' }
			case 'escape':
			case 'text':
				return { t: 'text', text: tok.tokens ? inlineText(tok.tokens) : tok.text }
			default:
				return tok.text ? { t: 'text', text: tok.text } : []
		}
	})

const inlineText = (tokens) =>
	(tokens ?? []).map((tok) => tok.text ?? (tok.tokens ? inlineText(tok.tokens) : '')).join('')

/** List items are block tokens; the first is a `text` block carrying the
 *  inline run. Nested blocks flatten into its text for v1. */
const itemInline = (tokens) => {
	const first = (tokens ?? []).find((t) => t.tokens)
	return first ? inline(first.tokens) : []
}

const block = (tokens) =>
	(tokens ?? []).flatMap((tok) => {
		switch (tok.type) {
			case 'heading':
				return { t: 'h', depth: tok.depth, children: inline(tok.tokens) }
			case 'paragraph':
				return { t: 'p', children: inline(tok.tokens) }
			case 'code':
				return { t: 'code', lang: tok.lang || undefined, text: tok.text }
			case 'list':
				return {
					t: 'list',
					ordered: !!tok.ordered,
					items: (tok.items ?? []).map((item) => itemInline(item.tokens)),
				}
			case 'blockquote':
				return { t: 'quote', children: blockText(tok.tokens) }
			case 'hr':
				return { t: 'hr' }
			case 'space':
				return []
			default:
				return tok.tokens ? { t: 'p', children: inline(tok.tokens) } : []
		}
	})

const blockText = (tokens) =>
	(tokens ?? []).flatMap((tok) => (tok.tokens ? inline(tok.tokens) : []))

export function mdToDoc(src) {
	return { kind: 'octane-xplat/md', v: 1, children: block(lexer(src)) }
}
