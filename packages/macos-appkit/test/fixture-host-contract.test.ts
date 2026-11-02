import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'

// Every AppKit layout container is a Mason-laid NSView (d2cc9c5c8), so
// NSStackView-only members read undefined on a fixture host. Only the packed
// consumer executes these fixtures against AppKit, and it is not part of the
// PR gate — this guard catches assertions written against the removed host.
const STACK_VIEW_API =
	/\b(?:viewsInGravity|NSStackViewGravity|NSUserInterfaceLayoutOrientation|edgeInsets)\b|\.orientation\b/

test('renderer creates no NSStackView layout hosts', async () => {
	const source = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
	assert.doesNotMatch(source, /NSStackView\.alloc|extends NSStackView\b/)
})

test('packed AppKit fixtures assert Mason geometry, not NSStackView members', async () => {
	const fixtures = new URL('./fixtures/', import.meta.url)
	const offenders: string[] = []
	for (const file of await readdir(fixtures)) {
		if (!file.endsWith('.ts')) {
			continue
		}

		const lines = (await readFile(new URL(file, fixtures), 'utf8')).split('\n')
		lines.forEach((line, index) => {
			if (STACK_VIEW_API.test(line)) {
				offenders.push(`${file}:${index + 1}: ${line.trim()}`)
			}
		})
	}

	assert.deepEqual(offenders, [])
})
