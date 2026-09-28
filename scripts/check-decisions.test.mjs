import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { checkDecisions, readDocDecisions } from './check-decisions.mjs'

const ledger = `# Decisions

| #   | Decision | Status | Rationale | Where |
| --- | --- | --- | --- | --- |
| 1   | One source tree | **Forced** | why | architecture |
| 2   | Suffix resolution (\`'a' \\| 'b'\`) | Decided | why | module-resolution |
| 3   | Lifted constraint | ~~forced~~ → lifted _(2026-09-24)_ | why | architecture |
`

const siloRow = (statement, status) => ({ statement, status })
const docRow = (statement, status) => ({ statement, status })

function docFixture(t, content = ledger) {
	const root = mkdtempSync(join(tmpdir(), 'decisions-check-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	mkdirSync(join(root, 'docs'))
	writeFileSync(join(root, 'docs/decisions.md'), content)
	return root
}

test('parses doc rows with escaped pipes and free-text statuses', (t) => {
	const decisions = readDocDecisions(docFixture(t))
	assert.equal(decisions.size, 3)
	assert.equal(decisions.get(2).statement, "Suffix resolution (`'a' | 'b'`)")
	assert.equal(decisions.get(3).status, '~~forced~~ → lifted _(2026-09-24)_')
})

test('clean mirror produces no errors or warnings', () => {
	const doc = new Map([[1, docRow('One source tree', 'forced')]])
	const silo = new Map([[1, siloRow('One source tree', 'forced')]])
	assert.deepEqual(checkDecisions(doc, silo), { errors: [], warnings: [] })
})

test('doc decision without a Silo row is an error', () => {
	const { errors } = checkDecisions(
		new Map([[1, docRow('One source tree', 'forced')]]),
		new Map(),
	)

	assert.equal(errors.length, 1)
	assert.match(errors[0], /#1: no Silo row/)
})

test('Silo-only decision is a warning (in-flight work in another worktree)', () => {
	const { errors, warnings } = checkDecisions(
		new Map([[1, docRow('One source tree', 'forced')]]),
		new Map([
			[1, siloRow('One source tree', 'forced')],
			[9, siloRow('Uncommitted decision', 'provisional')],
		]),
	)

	assert.deepEqual(errors, [])
	assert.match(warnings[0], /#9: Silo row with no local doc entry/)
})

test('status divergence on a shared num is an error', () => {
	const { errors } = checkDecisions(
		new Map([[1, docRow('One source tree', 'decided')]]),
		new Map([[1, siloRow('One source tree', 'provisional')]]),
	)

	assert.match(errors[0], /#1: status differs/)
})

test('free-text doc status warns and skips the status comparison', () => {
	const { errors, warnings } = checkDecisions(
		new Map([[3, docRow('Lifted constraint', '~~forced~~ → lifted')]]),
		new Map([[3, siloRow('Lifted constraint', 'decided')]]),
	)

	assert.deepEqual(errors, [])
	assert.match(warnings[0], /free-text status/)
})

test('statement divergence on a shared num warns without failing', () => {
	const { errors, warnings } = checkDecisions(
		new Map([[1, docRow('One source tree compiled per target', 'forced')]]),
		new Map([[1, siloRow('A completely different decision lives here', 'forced')]]),
	)

	assert.deepEqual(errors, [])
	assert.match(warnings[0], /#1: statements diverge/)
})
