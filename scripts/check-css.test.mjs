import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

function audit(files) {
	const root = mkdtempSync(join(process.cwd(), 'packages/create/template/src/css-audit-'))
	try {
		for (const [name, css] of Object.entries(files)) {
			writeFileSync(join(root, name), css)
		}

		return spawnSync(process.execPath, ['scripts/check-css.ts'], { encoding: 'utf8' })
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
}

test('CSS audit excludes web-only files and blocks', () => {
	const result = audit({
		'card.web.css': '.card { definitely-not-native: yes }',
		'card.css': '@platform web { .card { definitely-not-native: yes } }\n.card { color: red }',
	})
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.doesNotMatch(result.stdout, /definitely-not-native/)
})

test('CSS audit validates native blocks with authored line positions', () => {
	const result = audit({
		'card.css':
			'@platform web {\n .card { cursor: pointer }\n}\n@platform web, ios {\n .card { definitely-not-native: yes }\n}',
	})
	assert.equal(result.status, 1, result.stdout + result.stderr)
	assert.match(result.stdout, /card\.css:5\s+definitely-not-native/)
	assert.doesNotMatch(result.stdout, /cursor: pointer/)
})
