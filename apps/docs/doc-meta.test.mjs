import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { test } from 'node:test'
import { GROUPS, docPath, docSlugFor, repoPathFor, slugFor } from './src/doc-meta.ts'

test('guide and notes indexes keep their short public URLs', () => {
	assert.equal(docPath(slugFor('', 'README'), 'guides'), '/')
	assert.equal(docPath(slugFor('notes', 'README'), 'notes'), '/notes')
	assert.equal(docPath('navigation', 'guides'), '/navigation')
	assert.equal(docPath('navigation-notes', 'notes'), '/notes/navigation-notes')
})

test('Markdown links resolve from the page directory and preserve repo boundaries', () => {
	assert.equal(docSlugFor('../app/styling.md#fonts', 'platform'), 'styling')
	assert.equal(docSlugFor('notes/README.md', ''), 'notes')
	assert.equal(docSlugFor('../README.md', 'notes'), 'README')
	assert.equal(docSlugFor('../../README.md', 'notes'), null)
	assert.equal(repoPathFor('../../packages/ui/src/props.ts#L10', 'app'), 'packages/ui/src/props.ts')
	assert.equal(repoPathFor('../evidence/list.json', 'notes'), 'docs/evidence/list.json')
	assert.equal(repoPathFor('../../.agents/', 'app'), '.agents/')
})

test('every guide has a sidebar section and every note has an index link', () => {
	const index = readFileSync('../../docs/notes/README.md', 'utf8')
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
				if (folder === 'notes' && slug !== 'notes') {
					assert.ok(index.includes(`](${entry.name})`), `unlinked note: ${entry.name}`)
				} else if (folder !== 'notes') {
					assert.ok(
						GROUPS.some((g) => g.dir === (folder || 'start')),
						`missing sidebar section: ${path}`,
					)
				}
			}
		}
	}

	walk('../../docs')
})
