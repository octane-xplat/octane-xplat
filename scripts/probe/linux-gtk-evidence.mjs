// Nonvisual audit of retained item-3 evidence. This never certifies item 4.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function parseJsonLines(text) {
	const lines = text.trimEnd().split('\n')
	if (lines.length === 1 && lines[0] === '') {throw new Error('Empty evidence')}
	return lines.map((line, index) => {
		let record
		try {
			record = JSON.parse(line)
		} catch {
			throw new Error(`Invalid JSON evidence at line ${index + 1}`)
		}

		if (record === null || typeof record !== 'object' || Array.isArray(record)) {
			throw new Error(`Invalid evidence record at line ${index + 1}`)
		}

		return record
	})
}

// Rosemary's phase payload is the object stored under `kind`; `phase` is
// the event name. Do not interpret the historical nested schema as flat data.
function phaseData(records, phase) {
	return records.filter((record) => record.domain === 'case' && record.phase === phase)
		.map((record) => record.kind)
}

export function distribution(samples, boundMs, minimum = 100) {
	const valid = Array.isArray(samples) && samples.every((value) =>
		typeof value === 'number' && Number.isFinite(value) && value >= 0)

	const sorted = valid ? [...samples].sort((a, b) => a - b) : []
	const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null
	return {
		samples: sorted.length,
		p95Ms: p95,
		boundMs,
		minimum,
		sufficient: valid && sorted.length >= minimum && p95 <= boundMs,
	}
}

export function auditRetainedRun(proof, orchestrator) {
	const gaps = []
	const one = (phase) => {
		const records = phaseData(proof, phase)
		if (records.length !== 1 || records[0] === null || typeof records[0] !== 'object') {
			gaps.push(`Expected exactly one ${phase} record`)
			return {}
		}

		return records[0]
	}

	const signal = one('signal-latency')
	const resize = one('resize')
	const reorder = phaseData(proof, 'reorder-commit-latency')
	const distributions = {
		idleSignal: distribution(signal.raw, 16),
		resizeSignal: distribution(resize.labelSamples, 100),
		resizeTimer: distribution(resize.timerSamples, 200),
		reorder: distribution(reorder.map((record) => record?.ms), 100),
	}

	for (const [name, result] of Object.entries(distributions)) {
		if (!result.sufficient) {gaps.push(`${name}: missing, invalid, insufficient or out-of-bound samples`)}
	}

	if (!Array.isArray(resize.timerSamples) || resize.timerSamples.some((ms) => ms < 40 || ms > 200)) {
		gaps.push('Resize timers must all remain in the original [40,200] ms interval')
	}

	// Rounded aggregate arrays cannot establish paired monotonic timings.
	// Even complete counts here remain an inventory, not new runtime evidence.
	gaps.push('Retained format has no per-sample monotonic start/end pairs for every distribution')
	gaps.push('Retained OS injection uses wall-clock timestamps without 100 paired OS-event/callback observations')
	gaps.push('Retained scheduling check is later than the same-turn idle/timer callbacks')
	gaps.push('Retained source/logs have no explicit stable native identity assertions')
	gaps.push('Retained lifecycle aggregates do not contain per-cycle controller, subscription and queued-callback baselines')
	gaps.push('Retained selection checks do not cover caret/selection-only user interruption')
	gaps.push('Retained failure evidence lacks all load/handler/scheduled cause, process-state and bounded-shutdown cases')
	const editing = one('editing-controlled')
	const lifecycle = one('lifecycle')
	const drain = one('drain')
	const exit = orchestrator.filter((record) => record.kind === 'app-exited')
	if (exit.length !== 1 || exit[0].data?.code !== 0) {gaps.push('Missing single successful normal-process exit')}
	if (editing.text !== 'world' || editing.syntheticChanges !== 0 ||
		JSON.stringify(editing.selection) !== '[0,5]') {gaps.push('Controlled edit/selection result differs from preserved result')}

	if (drain.lateCallbacks !== 0 || drain.liveSources !== 0 || drain.nodesAfterUnmount !== 0) {
		gaps.push('Close drain has missing or nonzero residual counts')
	}

	return {
		schema: 1,
		status: 'insufficient-evidence',
		independentGate: 'not-assessed',
		distributions,
		preservedObservations: { editing, lifecycle, drain, processExit: exit[0]?.data?.code ?? null },
		gaps,
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		if (process.argv.length !== 4) {throw new Error('Usage: node scripts/probe/linux-gtk-evidence.mjs PROOF_JSONL ORCHESTRATOR_JSONL')}
		const [proof, orchestrator] = await Promise.all(process.argv.slice(2).map(async (path) =>
			parseJsonLines(await readFile(path, 'utf8'))))

		console.log(JSON.stringify(auditRetainedRun(proof, orchestrator), null, 2))
		process.exitCode = 1
	} catch {
		// Input files may live at private paths; never print errors containing them.
		console.error('GTK evidence audit failed: provide two readable, valid JSONL evidence files')
		process.exitCode = 2
	}
}
