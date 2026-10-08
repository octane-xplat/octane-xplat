import { expect, it } from 'vitest'
import { ensureJSONBridge, htmlToJSON, jsonToHTML } from './json-bridge'
import type { TiptapJSON } from './types'

it('converts ordinary JSON to HTML and reopens it through the real native bridge', async () => {
	expect(await ensureJSONBridge()).toBe(true)
	const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON seed' }] }] } as TiptapJSON
	const html = jsonToHTML(doc)
	expect(html).toContain('JSON seed')
	expect(JSON.stringify(htmlToJSON(html!))).toContain('JSON seed')
})
