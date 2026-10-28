import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { checkDocumentation, markdownParts } from './check-docs.ts'
import { exampleErrors } from './check-doc-examples.ts'

function fixture(t, files) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-docs-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	for (const [name, contents] of Object.entries(files)) {
		mkdirSync(dirname(join(root, name)), { recursive: true })
		writeFileSync(join(root, name), contents)
	}
	return root
}

test('valid guides, duplicate heading suffixes, and README links resolve', (t) => {
	const root = fixture(t, {
		'docs/README.md': '# Project\n\n> Build an app.\n\n[Next](app/navigation.md#start-1)\n',
		'docs/app/navigation.md': '# Navigation\n\n> Open a screen.\n\n## Start\n\n## Start\n',
		'packages/widget/package.json': '{"name":"widget"}',
		'packages/widget/README.md':
			'# Widget\n\n[Guide](https://octane-xplat.goddardai.org/navigation#start)\n',
	})
	assert.deepEqual(checkDocumentation(root).errors, [])
})

test('missing READMEs, public summaries, and uncurated pages are actionable', (t) => {
	const root = fixture(t, {
		'docs/app/unlisted.md': '# Unlisted\n',
		'packages/widget/package.json': '{"name":"widget"}',
		'packages/private/package.json': '{"name":"private","private":true}',
	})
	const errors = checkDocumentation(root).errors.join('\n')
	assert.match(errors, /widget\/package.json: published package needs README/)
	assert.doesNotMatch(errors, /private\/package.json/)
	assert.match(errors, /reading order/)
	assert.match(errors, /purpose blockquote/)
})

test('repository links in published READMEs resolve locally without network access', (t) => {
	const root = fixture(t, {
		'docs/README.md': '# Project\n\n> Build an app.\n',
		'packages/widget/package.json': '{"name":"widget"}',
		'packages/widget/README.md':
			'# Widget\n\n[Source](https://github.com/octane-xplat/octane-xplat/blob/main/packages/widget/index.ts)\n[Missing](https://github.com/octane-xplat/octane-xplat/tree/main/packages/missing)\n[External](https://example.com/not-checked)\n',
		'packages/widget/index.ts': 'export const widget = 1\n',
	})
	const errors = checkDocumentation(root).errors
	assert.equal(errors.length, 1)
	assert.match(errors[0], /missing local target: .*packages\/missing/)
})

test('broken files, fragments, public URLs, and repository escapes fail', (t) => {
	const root = fixture(t, {
		'docs/README.md':
			'# Project\n\n> Build an app.\n\n[Missing](gone.md)\n[Heading](#gone)\n[Escape](../../outside.md)\n[Stale](https://octane-xplat.goddardai.org/notes/old)\n',
	})
	const errors = checkDocumentation(root).errors.join('\n')
	for (const message of [
		'missing local target',
		'missing heading',
		'link escapes repository',
		'unknown public guide',
	]) {
		assert.ok(errors.includes(message), errors)
	}
})

test('code and comments do not create links or headings; reference destinations do', (t) => {
	const root = fixture(t, {
		'docs/README.md':
			'# Project\n\n> Build an app.\n\n```md\n# Example\n[not a link](missing.md)\n```\n<!-- [not a link](absent.md) -->\n`[literal](not-a-file.md)`\n[Guide][guide]\n[guide]: missing.md\n',
	})
	const errors = checkDocumentation(root).errors
	assert.equal(errors.length, 1)
	assert.match(errors[0], /missing local target: missing.md/)
})

test('duplicate slugs and malformed fences fail', (t) => {
	const root = fixture(t, {
		'docs/app/navigation.md':
			'# Navigation\n\n> Open a screen.\n\n```\noutput\n```\n```ts\nconst value = 1\n',
		'docs/start/navigation.md': '# Navigation\n\n> Open a screen.\n',
	})
	const errors = checkDocumentation(root).errors.join('\n')
	assert.match(errors, /duplicate public slug/)
	assert.match(errors, /unclosed code fence/)
	assert.match(errors, /code fence needs a language/)
})

test('fences inside lists retain locations and normalize code indentation', () => {
	const parts = markdownParts(
		'1. Example:\n\n   ```yaml\n   appId: example\n   ---\n   - launchApp\n   ```\n',
	)
	assert.equal(parts.fences[0].line, 3)
	assert.equal(parts.fences[0].code, 'appId: example\n---\n- launchApp')
	assert.deepEqual(exampleErrors(parts.fences[0]), [])
})

test('syntax checks reject malformed TS, JSX, and JSON, while recognizing TSRX', () => {
	const check = (language, code) => exampleErrors({ line: 1, language, code })
	assert.ok(check('ts', 'const x =').length)
	assert.ok(check('tsx', '<Text>One</Text>\n<Text>Two</Text>').length)
	assert.ok(check('json', '{ "key": }').length)
	assert.ok(check('tsx', 'function Card() @{ <Text /> }').length)
	assert.deepEqual(check('tsrx', 'function Card() @{ <Text /> }'), [])
	assert.deepEqual(check('jsonc', '{ /* comment */ "key": 1 }'), [])
})
