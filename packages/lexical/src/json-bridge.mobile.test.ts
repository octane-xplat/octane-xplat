import { expect, it } from 'vitest'
import { ensureJSONBridge, htmlToJSON, jsonToHTML } from './json-bridge'
import { ensureJSONBridge as ensureTiptap, htmlToJSON as tiptapHTMLToJSON } from '../../tiptap/src/json-bridge'
import type { LexicalJSON } from './types'

it('keeps both native bridges working when Tiptap installs its parser first', async () => {
	expect(await ensureTiptap()).toBe(true)
	expect(await ensureJSONBridge()).toBe(true)
	const doc = { root: { type: 'root', version: 1, format: '', indent: 0, direction: null, children: [{ type: 'paragraph', version: 1, format: '', indent: 0, direction: null, textFormat: 0, textStyle: '', children: [{ type: 'text', version: 1, text: 'JSON seed', format: 0, detail: 0, mode: 'normal', style: '' }] }] } } as LexicalJSON
	const html = jsonToHTML(doc)
	expect(typeof html === 'string' && html.includes('JSON seed')).toBe(true)
	const reopened = htmlToJSON(html!)
	expect(JSON.stringify(reopened)?.includes('JSON seed')).toBe(true)
	expect(JSON.stringify(tiptapHTMLToJSON('<p>Tiptap still parses</p>'))).toContain('Tiptap still parses')
})

it('imports inline HTML emitted by Aztec Android', async () => {
	expect(await ensureJSONBridge()).toBe(true)
	const doc = htmlToJSON('JSON seed<strong> bold</strong><br>next line')
	expect(JSON.stringify(doc)).toContain('JSON seed')
	expect(JSON.stringify(doc)).toContain('next line')
	expect(jsonToHTML(doc!)).toContain('JSON seed')
})
