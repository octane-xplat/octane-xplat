import assert from 'node:assert/strict'
import { test } from 'node:test'
import { anchorFor, buildChangelogMd, parseLog } from './src/changelog-format.ts'
import { parseMd } from './src/md.ts'

const CHANGELOG = `# Changelog

Selected features and breaking changes, newest release first.

## [Octane Xplat 0.19.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.19.0) - 2026-11-05

### Big feature

Description.

## [tsrx-typegen 0.5.0](https://github.com/octane-xplat/octane-xplat/releases/tag/tsrx-typegen-v0.5.0) - 2026-10-31

### Typegen feature

Description.

## [0.17.1] - 2026-10-23

### Bug Fixes

- *(native)* Preserve tab content

## [Unreleased]

### Features

- pending work
`

const FIXLOG = `# Fixlog

Selected bug fixes, newest release first.

## [Octane Xplat 0.19.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.19.0) - 2026-11-05

### Repair one

Fixed a thing.

## [Octane Xplat 0.18.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.18.0) - 2026-10-28

### Repair two

A fixes-only release.
`

test('release headings carry stable tag-derived anchors', () => {
	assert.equal(anchorFor('v0.19.0'), 'v0-19-0')
	assert.equal(anchorFor('tsrx-typegen-v0.5.0'), 'tsrx-typegen-v0-5-0')

	const md = buildChangelogMd(CHANGELOG, FIXLOG)
	assert.match(md, /^## Octane Xplat 0\.19\.0 \{#v0-19-0\}$/m)
	assert.match(md, /^## tsrx-typegen 0\.5\.0 \{#tsrx-typegen-v0-5-0\}$/m)
	assert.match(md, /^## 0\.17\.1 \{#v0-17-1\}$/m)
	assert.match(md, /^## Unreleased \{#unreleased\}$/m)
})

test('parseLog reads every heading shape in the root logs', () => {
	const [linked, typegen, bare, unreleased] = parseLog(CHANGELOG)
	assert.deepEqual(
		{ title: linked.title, tag: linked.tag, date: linked.date },
		{ title: 'Octane Xplat 0.19.0', tag: 'v0.19.0', date: '2026-11-05' },
	)
	assert.equal(typegen.tag, 'tsrx-typegen-v0.5.0')
	assert.equal(bare.tag, 'v0.17.1')
	assert.equal(unreleased.tag, undefined)
})

test('fixlog entries merge into their release under a demoted Fixes section', () => {
	const md = buildChangelogMd(CHANGELOG, FIXLOG)
	const v19 = md.indexOf('## Octane Xplat 0.19.0')
	const fixes = md.indexOf('### Fixes', v19)
	const demoted = md.indexOf('#### Repair one', v19)
	const next = md.indexOf('## tsrx-typegen 0.5.0')
	assert.ok(v19 < fixes && fixes < demoted && demoted < next)

	// The fixes-only 0.18.0 release slots in by date — after the 10-31
	// tsrx-typegen release, before 0.17.1 (10-23).
	const typegen = md.indexOf('## tsrx-typegen 0.5.0')
	const v18 = md.indexOf('## Octane Xplat 0.18.0 {#v0-18-0}')
	const v171 = md.indexOf('## 0.17.1 {#v0-17-1}')
	assert.ok(typegen < v18 && v18 < v171)
})

test('the generated page renders headings at their pinned anchors', () => {
	const headings = parseMd(buildChangelogMd(CHANGELOG, FIXLOG)).filter((b) => b.kind === 'h')
	const v19 = headings.find((h) => h.id === 'v0-19-0')
	assert.ok(v19)
	assert.equal(v19.level, 2)
	assert.equal(v19.text, 'Octane Xplat 0.19.0')
})

test('explicit {#anchor} headings parse without the marker in the text', () => {
	const [h] = parseMd('## Some release {#custom-anchor}')
	assert.equal(h.id, 'custom-anchor')
	assert.equal(h.text, 'Some release')
})
