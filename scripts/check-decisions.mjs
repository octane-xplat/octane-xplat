import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STATUSES = new Set(['forced', 'decided', 'provisional', 'rejected'])

function cells(line) {
	return line
		.trim()
		.replace(/^\||\|$/g, '')
		.split(/(?<!\\)\|/)
		.map((cell) => cell.replace(/\\\|/g, '|').trim())
}

function normalize(statement) {
	return statement
		.toLowerCase()
		.replace(/[\\`*]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

export function readDocDecisions(root) {
	const source = readFileSync(resolve(root, 'docs/decisions.md'), 'utf8')
	const decisions = new Map()
	for (const line of source.split('\n')) {
		if (!/^\|\s*\d+\s*\|/.test(line)) {
			continue
		}

		const [num, statement, status] = cells(line)
		decisions.set(Number(num), {
			statement,
			status: status.replace(/\*/g, '').toLowerCase(),
		})
	}

	return decisions
}

export function readSiloDecisions(sql = defaultSql) {
	const output = sql('SELECT num, statement, status FROM decisions ORDER BY num')
	const decisions = new Map()
	for (const line of output.split('\n')) {
		if (!/^\|\s*\d+\s*\|/.test(line)) {
			continue
		}

		const [num, statement, status] = cells(line)
		decisions.set(Number(num), { statement, status: status.toLowerCase() })
	}

	return decisions
}

function defaultSql(query) {
	return execFileSync('silo', ['sql', query], { encoding: 'utf8' })
}

// Silo rows without a doc row are in-flight work in other worktrees sharing
// this database — warnings, not errors.
export function checkDecisions(docDecisions, siloDecisions) {
	const errors = []
	const warnings = []

	if (!docDecisions.size) {
		errors.push('docs/decisions.md: no decision rows parsed')
	}

	for (const [num, doc] of docDecisions) {
		const silo = siloDecisions.get(num)
		if (!silo) {
			errors.push(`decisions.md #${num}: no Silo row — mirror the ledger entry`)
			continue
		}

		if (!STATUSES.has(doc.status)) {
			warnings.push(
				`decisions.md #${num}: free-text status "${doc.status}" — Silo vocabulary is forced/decided/provisional/rejected; skipping status check`,
			)
		} else if (silo.status !== doc.status) {
			errors.push(`decision #${num}: status differs (doc ${doc.status}, silo ${silo.status})`)
		}

		if (normalize(silo.statement).slice(0, 40) !== normalize(doc.statement).slice(0, 40)) {
			warnings.push(
				`decision #${num}: statements diverge — verify doc and Silo record the same decision`,
			)
		}
	}

	for (const num of siloDecisions.keys()) {
		if (!docDecisions.has(num)) {
			warnings.push(
				`decision #${num}: Silo row with no local doc entry — likely in-flight work from another worktree`,
			)
		}
	}

	return { errors, warnings }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL('../', import.meta.url))
	const docDecisions = readDocDecisions(root)
	const { errors, warnings } = checkDecisions(docDecisions, readSiloDecisions())
	for (const warning of warnings) {
		console.warn(`warning: ${warning}`)
	}

	if (errors.length) {
		console.error(errors.join('\n'))
		process.exitCode = 1
	} else {
		console.log(`Decision ledger mirrors Silo across ${docDecisions.size} rows.`)
	}
}
