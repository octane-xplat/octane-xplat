// Run from the repository root after collect.mjs. This does not execute platform code.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
const directory = 'tools/desktop-support'
const data = JSON.parse(
	readFileSync(process.argv[2] ?? 'research/desktop-audit/inventory.json', 'utf8'),
)

const findings = JSON.parse(readFileSync(`${directory}/findings.json`, 'utf8'))
for (const f of findings) {
	for (const path of f.evidence) {
		if (!existsSync(path)) {
			throw new Error(`Missing evidence: ${f.id}: ${path}`)
		}
	}
}

const cell = (value) =>
	String(value ?? '')
		.replaceAll('\t', ' ')
		.replaceAll('\n', ' ')
		.trim() || '—'

const toolPackages = new Set([
	'bamboo',
	'cli',
	'create-octane-xplat',
	'desktop-webview',
	'jsx',
	'lint',
	'mcp',
	'web-host',
	'workshop',
])

const scope = (row) => {
	const name = row.package.replace('@octane-xplat/', '')
	if (toolPackages.has(name)) {
		return 'tooling/types/other-host; not native app parity'
	}
	if (['./ios', './android', './web', './linux', './windows', './macos'].includes(row.subpath)) {
		return 'platform-authentic entry; applicable only to its documented host'
	}
	if (row.symbol === '* (OS SDK bindings)') {
		return 'upstream OS SDK aggregate; individual SDK members excluded'
	}
	if (!row.symbol) {
		return 'type/asset entry; no runtime value identified'
	}
	return 'runtime export'
}

const summary = {
	revision: data.revision,
	runtimeExecuted: [],
	packages: data.packages,
	excluded: data.excluded,
	conditions: data.conditions,
	parseErrors: data.parseErrors,
	parserFallbacks: data.parserFallbacks,
	files: Object.fromEntries(
		Object.keys(data.files).map((p) => [
			p,
			createHash('sha256').update(readFileSync(p)).digest('hex'),
		]),
	),
	counts: {},
}

for (const target of ['windows', 'macos', 'gtk']) {
	const lines = [
		[
			'package',
			'subpath',
			'export',
			'scope',
			'resolution',
			'entry',
			'implementation',
			'signature',
			'supported_subset_or_evidence_limit',
			'remaining_gap',
			'finding_ids',
			'candidate_signals',
		].join('\t'),
	]

	for (const row of data.rows) {
		const v = row.targets[target]
		const matches = findings.filter(
			(f) =>
				f.targets.includes(target) &&
				f.packages.includes(row.package.replace('@octane-xplat/', '')) &&
				(!f.symbols.length || f.symbols.includes(row.symbol)),
		)

		const subset = matches.length
			? matches.map((f) => `${f.id}: ${f.subset}`).join(' | ')
			: v.status === 'source-present'
				? 'Source declaration resolved; no target behavior inferred from presence.'
				: v.status === 'external-forward'
					? 'Forwarded external implementation; dependency behavior unqualified.'
					: 'No runtime implementation established by this row.'

		const gap = matches.length
			? matches.map((f) => `${f.id}: ${f.gap}`).join(' | ')
			: v.status === 'source-present'
				? 'Target behavior, supported prop/event subset and dependencies require runtime qualification; see dependency-candidates.json.'
				: v.status === 'not-exported'
					? 'Not exported on this target; determine intended scope before implementing.'
					: v.status === 'no-entry'
						? 'No selected entry under target conditions; often deliberate host/tooling scope.'
						: v.status === 'type-or-asset-only'
							? 'No runtime parity requirement inferred for types/assets.'
							: 'Resolve dependency/entry and qualify target behavior.'

		lines.push(
			[
				row.package,
				row.subpath,
				row.symbol,
				scope(row),
				v.status,
				v.entry,
				v.file ? `${v.file}:${v.line ?? 1}` : (v.external ?? v.missing ?? ''),
				v.signature,
				subset,
				gap,
				matches.map((f) => f.id).join(','),
				(v.signals ?? [])
					.map((s) => `${s.line}:${s.text ?? s.code ?? JSON.stringify(s)}`)
					.join(' | '),
			]
				.map(cell)
				.join('\t'),
		)
	}

	writeFileSync(`${directory}/${target}.tsv`, lines.join('\n') + '\n')
	summary.counts[target] = data.rows.reduce(
		(acc, r) => ((acc[r.targets[target].status] = (acc[r.targets[target].status] ?? 0) + 1), acc),
		{},
	)
}

const candidates = {}
for (const [target, graph] of Object.entries(data.dependencyGraphs)) {
	candidates[target] = Object.fromEntries(
		Object.entries(graph)
			.map(([file, edges]) => [
				file,
				edges.filter((e) => e.foreign || e.missingShimExports?.length || e.missing),
			])
			.filter(([, edges]) => edges.length),
	)
}

writeFileSync(`${directory}/dependency-candidates.json`, JSON.stringify(candidates, null, 2) + '\n')
writeFileSync(`${directory}/snapshot.json`, JSON.stringify(summary, null, 2) + '\n')
console.log(
	JSON.stringify({
		revision: data.revision,
		rows: data.rows.length,
		findings: findings.length,
		parseErrors: data.parseErrors.length,
	}),
)
