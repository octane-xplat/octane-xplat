import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const repo = resolve(import.meta.dirname, '../../..')
await mkdir(join(repo, 'research'), { recursive: true })
const scratch = await mkdtemp(join(repo, 'research/editor-wk-'))
const executable = join(scratch, 'EditorFixture')
execFileSync(
	'xcrun',
	[
		'swiftc',
		'-target',
		'arm64-apple-macos13.5',
		'-o',
		executable,
		join(repo, 'packages/richtext/platforms/macos/src/XplatEditorHost.swift'),
		join(import.meta.dirname, 'wk-fixture.swift'),
	],
	{ stdio: 'inherit' },
)
for (const name of ['richtext', 'tiptap', 'lexical']) {
	const { default: html } = await import(
		pathToFileURL(join(repo, `packages/${name}/dist/macos/browser.js`))
	)
	const page = join(scratch, `${name}.html`)
	await writeFile(page, html)
	const result = spawnSync(executable, [page], { encoding: 'utf8', timeout: 25_000 })
	assert.equal(result.status, 0, `${name}: ${result.stdout}\n${result.stderr}`)
	assert.match(result.stdout, /WK_EDITOR_OK/)
	console.log(`${name}: ${result.stdout.trim()}`)
}
