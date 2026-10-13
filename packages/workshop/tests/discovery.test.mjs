import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applicableTargets, discoverStories, scanStoryFile } from '../src/discover.mjs'

const STORY = `
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
	id: 'counter/basic',
	title: 'Examples / Counter',
	targets: 'all',
	component: Counter,
	args: { step: 1 },
})
`

describe('scanStoryFile', () => {
	it('extracts literal metadata from named exports', () => {
		const { stories, diagnostics } = scanStoryFile(STORY, 'x.stories.tsrx')
		expect(diagnostics).toEqual([])
		expect(stories[0]).toMatchObject({
			id: 'counter/basic',
			title: 'Examples / Counter',
			targets: 'all',
			exportName: 'Basic',
			exported: true,
		})
	})

	it('handles generic instantiation and re-exported bindings', () => {
		const { stories, diagnostics } = scanStoryFile(
			`import { defineStory } from '@octane-xplat/workshop'
const A = defineStory({ id: 'a', title: 'A', targets: ['web', 'ios'], component: C, args: {} })
const B = defineStory({ id: 'b', title: 'B', targets: 'all', capabilities: ['camera'], component: C, args: {} })
export { A, B }
export default defineStory({ id: 'd', title: 'D', targets: 'all', component: C, args: {} })`,
			'x.stories.tsrx',
		)

		expect(diagnostics).toEqual([])
		expect(stories.map((s) => s.id)).toEqual(['a', 'b', 'd'])
		expect(stories[1].capabilities).toEqual(['camera'])
		expect(stories[2].exportName).toBe('default')
	})

	it('rejects computed metadata with an actionable diagnostic', () => {
		const { stories, diagnostics } = scanStoryFile(
			`import { defineStory } from '@octane-xplat/workshop'
const slug = 'x'
export const A = defineStory({ id: slug, title: 'A', targets: 'all', component: C, args: {} })`,
			'x.stories.tsrx',
		)

		expect(stories).toEqual([])
		expect(diagnostics[0].message).toMatch(/literal.*"id"|"id".*literal/i)
	})

	it('marks unexported definitions for the discovery diagnostic', () => {
		const { stories } = scanStoryFile(
			`import { defineStory } from '@octane-xplat/workshop'
const A = defineStory({ id: 'a', title: 'A', targets: 'all', component: C, args: {} })`,
			'x.stories.tsrx',
		)

		expect(stories[0].exported).toBe(false)
	})

	it('ignores mentions of defineStory that are not calls', () => {
		const { stories, diagnostics } = scanStoryFile(STORY, 'x.stories.tsrx')
		expect(diagnostics).toEqual([])
		expect(stories).toHaveLength(1)
	})
})

describe('applicableTargets', () => {
	it('intersects declared targets with the file suffix', () => {
		expect(applicableTargets(['web', 'ios'], '/a/b.stories.ios.tsrx')).toEqual(['ios'])
		expect(applicableTargets(['web'], '/a/b.stories.ios.tsrx')).toEqual([])
		expect(applicableTargets(['web', 'ios', 'android'], '/a/b.stories.mobile.tsrx')).toEqual([
			'ios',
			'android',
		])

		expect(applicableTargets(['macos'], '/a/b.stories.tsrx')).toEqual(['macos'])
	})
})

describe('discoverStories', () => {
	const fixture = (files) => {
		const root = mkdtempSync(join(tmpdir(), 'ws-disc-'))
		for (const [name, contents] of Object.entries(files)) {
			const file = join(root, name)
			mkdirSync(join(file, '..'), { recursive: true })
			writeFileSync(file, contents)
		}

		return root
	}

	it('discovers sorted entries with applicability for the build target', () => {
		const root = fixture({
			'src/a.stories.tsrx': STORY,
			'src/leaf.stories.ios.tsrx': STORY.replace("'counter/basic'", "'leaf/ios'"),
		})

		const { entries, diagnostics } = discoverStories(root, { target: 'web' })
		expect(diagnostics).toEqual([])
		expect(entries).toHaveLength(2)
		const web = entries.find((e) => e.id === 'counter/basic')
		const ios = entries.find((e) => e.id === 'leaf/ios')
		expect(web.applicable).toBe(true)
		expect(ios.applicable).toBe(false)
		expect(ios.reason).toMatch(/not web/)
	})

	it('reports duplicate ids with both locations', () => {
		const root = fixture({
			'src/a.stories.tsrx': STORY,
			'src/b.stories.tsrx': STORY.replace('export const Basic', 'export const Other'),
		})

		const { entries, diagnostics } = discoverStories(root, { target: 'web' })
		expect(entries).toHaveLength(1)
		expect(diagnostics[0].message).toMatch(/duplicate story id "counter\/basic"/)
		expect(diagnostics[0].message).toMatch(/a\.stories\.tsrx/)
	})

	it('reports unexported stories during discovery', () => {
		const root = fixture({
			'src/a.stories.tsrx': `import { defineStory } from '@octane-xplat/workshop'
const A = defineStory({ id: 'a', title: 'A', targets: 'all', component: C, args: {} })`,
		})

		const { entries, diagnostics } = discoverStories(root, { target: 'web' })
		expect(entries).toHaveLength(0)
		expect(diagnostics[0].message).toMatch(/must be exported/)
	})

	it('target filtering: web leaf inapplicable for ios target', () => {
		const root = fixture({ 'src/w.stories.web.tsrx': STORY })
		const { entries } = discoverStories(root, { target: 'ios' })
		expect(entries[0].applicable).toBe(false)
	})
})


describe('metadata integrity', () => {
	it('rejects computed arrays and unquoted identifiers without evaluation', () => {
		for (const targets of ["['web'].concat(other)", 'all', '[]', "'web'"]) {
			const { stories, diagnostics } = scanStoryFile(STORY.replace("targets: 'all'", `targets: ${targets}`), 'invalid.stories.tsrx')
			expect(stories).toHaveLength(0)
			expect(diagnostics).not.toHaveLength(0)
		}
	})

	it('does not qualify required capabilities merely from target applicability', () => {
		const root = mkdtempSync(join(tmpdir(), 'ws-caps-'))
		writeFileSync(join(root, 'caps.stories.tsrx'), STORY.replace("targets: 'all'", "targets: 'all', capabilities: ['camera']"))
		const { entries, diagnostics } = discoverStories(root)
		expect(diagnostics).toEqual([])
		expect(entries[0].applicable).toBe(false)
		expect(entries[0].reason).toMatch(/unknown\/unqualified.*camera/)
	})
})
