import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { test } from 'node:test'
import { GROUPS, docPath, docSlugFor, repoPathFor, slugFor } from './src/doc-meta.ts'

test('guide pages use flat public URLs', () => {
	assert.equal(docPath(slugFor('', 'README')), '/')
	assert.equal(docPath('navigation'), '/navigation')
})

test('Markdown links resolve from the page directory and preserve repository boundaries', () => {
	assert.equal(docSlugFor('../app/styling.md#fonts', 'platform'), 'styling')
	assert.equal(docSlugFor('../README.md', 'app'), 'README')
	assert.equal(docSlugFor('../../.agents/design/README.md', 'app'), null)
	assert.equal(repoPathFor('../../packages/ui/src/props.ts#L10', 'app'), 'packages/ui/src/props.ts')
	assert.equal(
		repoPathFor('../../.agents/docs/evidence/list.json', 'app'),
		'.agents/docs/evidence/list.json',
	)
	assert.equal(repoPathFor('../../.agents/', 'app'), '.agents/')
})

test('every docs-site page belongs to a public sidebar section', () => {
	const slugs = new Set()
	function walk(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name)
			if (entry.isDirectory() && entry.name !== 'evidence') {
				walk(path)
			} else if (entry.isFile() && entry.name.endsWith('.md')) {
				const rel = relative('../../docs', path)
				const folder = dirname(rel) === '.' ? '' : dirname(rel)
				const slug = slugFor(folder, basename(rel, '.md'))
				assert.ok(!slugs.has(slug), `duplicate slug: ${slug}`)
				slugs.add(slug)
				assert.ok(
					GROUPS.some((g) => g.dir === (folder || 'start')),
					`missing sidebar section: ${path}`,
				)
			}
		}
	}

	walk('../../docs')
})
