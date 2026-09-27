import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { checkRecipes } from './check-recipes.mjs'

const recipe = `# Example task

ID: example
Targets: web, ios, android
Related APIs: Example

## Starting point
A working app.

## Requirements
- Complete the task.

## Acceptance criteria
- AC1: The result is observable.

## Documentation
- AC1: [Instructions](../guide.md#instructions).
`

function fixture(t, content = recipe) {
	const root = mkdtempSync(join(tmpdir(), 'recipe-check-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	mkdirSync(join(root, 'recipes'))
	writeFileSync(join(root, 'recipes/task.md'), content)
	writeFileSync(join(root, 'guide.md'), '# Guide\n\n## Instructions\nSteps.\n')
	return root
}

test('accepts mapped criteria and explicit gaps', (t) => {
	assert.deepEqual(checkRecipes(fixture(t)), [])
	assert.deepEqual(
		checkRecipes(
			fixture(
				t,
				recipe.replace('[Instructions](../guide.md#instructions).', 'Gap: instructions missing.'),
			),
		),
		[],
	)
})

test('rejects missing files and missing heading anchors', (t) => {
	assert.match(
		checkRecipes(fixture(t, recipe.replace('guide.md', 'absent.md'))).join('\n'),
		/unreadable local link/,
	)

	assert.match(
		checkRecipes(fixture(t, recipe.replace('#instructions', '#absent'))).join('\n'),
		/missing heading/,
	)
})

test('rejects unmapped criteria and stale mappings', (t) => {
	const errors = checkRecipes(
		fixture(t, recipe.replace('- AC1: [Instructions]', '- AC2: [Instructions]')),
	).join('\n')

	assert.match(errors, /AC1 needs a documentation link/)
	assert.match(errors, /unknown AC2/)
})

test('rejects duplicate recipe and criterion IDs', (t) => {
	const root = fixture(
		t,
		recipe.replace('- AC1: The result is observable.', '- AC1: First.\n- AC1: Second.'),
	)

	writeFileSync(join(root, 'recipes/duplicate.md'), recipe)
	const errors = checkRecipes(root).join('\n')
	assert.match(errors, /duplicate recipe ID/)
	assert.match(errors, /duplicate AC1/)
})
