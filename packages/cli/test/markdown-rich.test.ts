import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mdToDoc } from '../src/markdown.ts'
import { parseMdDoc } from '../../ui/src/markdown-parse.ts'

for (const source of [
	'[note] Read the [guide](https://example.com/guide).',
	'| Feature | React | Vue |\n| :--- | :---: | ---: |\n| **DOM** | Yes | Yes |',
	'- [x] Done\n- [ ] Pending\n\n- ordinary\n\n- [x] Complete',
	'# Title\n\n~~replaced~~ and **current**',
]) {
	test(`rich Markdown baked/runtime parity: ${source.split('\n')[0]}`, () => {
		const doc = parseMdDoc(source)
		assert.deepEqual(mdToDoc(source), doc)
	})
}
