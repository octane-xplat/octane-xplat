// Nonvisual audit of retained item-3 evidence. This never certifies item 4.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function parseJsonLines(text) {
	const lines = text.trimEnd().split('\n')
	if (lines.length === 1 && lines[0] === '') {
		throw new Error('Empty evidence')
	}

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
	return records
		.filter((record) => record.domain === 'case' && record.phase === phase)
		.map((record) => record.kind)
}

export function distribution(samples, boundMs, minimum = 100) {
	const valid =
		Array.isArray(samples) &&
		samples.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)

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
		reorder: distribution(
			reorder.map((record) => record?.ms),
			100,
		),
	}

	for (const [name, result] of Object.entries(distributions)) {
		if (!result.sufficient) {
			gaps.push(`${name}: missing, invalid, insufficient or out-of-bound samples`)
		}
	}

	if (
		!Array.isArray(resize.timerSamples) ||
		resize.timerSamples.some((ms) => ms < 40 || ms > 200)
	) {
		gaps.push('Resize timers must all remain in the original [40,200] ms interval')
	}

	// Rounded aggregate arrays cannot establish paired monotonic timings.
	// Even complete counts here remain an inventory, not new runtime evidence.
	gaps.push('Retained format has no per-sample monotonic start/end pairs for every distribution')
	gaps.push(
		'Retained OS injection uses wall-clock timestamps without 100 paired OS-event/callback observations',
	)

	gaps.push('Retained scheduling check is later than the same-turn idle/timer callbacks')
	gaps.push('Retained source/logs have no explicit stable native identity assertions')
	gaps.push(
		'Retained lifecycle aggregates do not contain per-cycle controller, subscription and queued-callback baselines',
	)

	gaps.push('Retained selection checks do not cover caret/selection-only user interruption')
	gaps.push(
		'Retained failure evidence lacks all load/handler/scheduled cause, process-state and bounded-shutdown cases',
	)

	const editing = one('editing-controlled')
	const lifecycle = one('lifecycle')
	const drain = one('drain')
	const exit = orchestrator.filter((record) => record.kind === 'app-exited')
	if (exit.length !== 1 || exit[0].data?.code !== 0) {
		gaps.push('Missing single successful normal-process exit')
	}

	if (
		editing.text !== 'world' ||
		editing.syntheticChanges !== 0 ||
		JSON.stringify(editing.selection) !== '[0,5]'
	) {
		gaps.push('Controlled edit/selection result differs from preserved result')
	}

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

// ---------------------------------------------------------------------------
// Schema 2: strengthened-run contract assessment.
//
// Assesses a NEW proof run's JSONL evidence against the exact item-1 contract
// (plans/linux-gtk-original-environment-contract.md section 6) and Rory's
// required continuation. This is a producer-side completeness verdict only;
// it never substitutes for the item-4 independent review.

// Bounds fixed by the item-1 contract. A run may tighten them in its declared
// policy but may never relax them.
export const CONTRACT_BOUNDS = {
	minSamples: 100,
	idleSignalMs: 16,
	resizeSignalMs: 100,
	osInputMs: 150,
	reorderPickMs: 100,
	resizeTimerMinMs: 40,
	resizeTimerMaxMs: 200,
	minMountCycles: 20,
	minDrainMs: 5000,
	minResizeOsInputs: 1,
}

// Bounded run policy. The original contract fixes the latency/drain criteria
// but leaves the failure-shutdown and whole-run bounds open; this policy
// declares them and must be emitted in the run's contract-header before any
// measured evidence is produced.
export const RUN_POLICY = {
	schema: 2,
	minSamples: CONTRACT_BOUNDS.minSamples,
	boundsMs: {
		idleSignal: CONTRACT_BOUNDS.idleSignalMs,
		resizeSignal: CONTRACT_BOUNDS.resizeSignalMs,
		osInput: CONTRACT_BOUNDS.osInputMs,
		reorderPick: CONTRACT_BOUNDS.reorderPickMs,
	},
	resizeTimerMs: { min: CONTRACT_BOUNDS.resizeTimerMinMs, max: CONTRACT_BOUNDS.resizeTimerMaxMs },
	minMountCycles: CONTRACT_BOUNDS.minMountCycles,
	minDrainMs: CONTRACT_BOUNDS.minDrainMs,
	minResizeOsInputs: CONTRACT_BOUNDS.minResizeOsInputs,
	failureShutdownBoundMs: 5000,
	maxRunWallMs: 1200000,
}

// Accepted OS-input mechanisms per contract section 4. Tier A is emulated-HID
// input through the VM/console path; tier B is named X11 XTEST injection.
// Toolkit dispatch, GDK event synthesis and headless backends never qualify.
const INPUT_MECHANISM_TIERS = {
	'qemu-hid': 'a',
	'qemu-monitor': 'a',
	qmp: 'a',
	xtest: 'b',
	xdotool: 'b',
	'python-xlib': 'b',
	'xtest-fake': 'b',
}

export function inputTier(mechanism) {
	if (typeof mechanism !== 'string' || mechanism === '') {
		return null
	}

	return INPUT_MECHANISM_TIERS[mechanism.split('/')[0]] ?? null
}

// A blocked verdict exists only for missing resources named by the contract:
// no display session, no input tooling, denied injection permission, or no
// reachable environment. A failed measurement is never "blocked".
const BLOCKED_REASONS = new Set([
	'missing-display-session',
	'missing-input-tooling',
	'input-permission-denied',
	'missing-environment',
])

// A declared run policy must carry every contract bound and may only tighten
// them (lower latency bounds, higher minimums, narrower timer window).
export function declaredPolicySatisfies(declared) {
	if (declared === null || typeof declared !== 'object' || Array.isArray(declared)) {
		return false
	}

	const bounds = declared.boundsMs
	const timer = declared.resizeTimerMs
	if (
		bounds === null ||
		typeof bounds !== 'object' ||
		timer === null ||
		typeof timer !== 'object'
	) {
		return false
	}

	const tightened = [
		bounds.idleSignal <= RUN_POLICY.boundsMs.idleSignal,
		bounds.resizeSignal <= RUN_POLICY.boundsMs.resizeSignal,
		bounds.osInput <= RUN_POLICY.boundsMs.osInput,
		bounds.reorderPick <= RUN_POLICY.boundsMs.reorderPick,
		timer.min >= RUN_POLICY.resizeTimerMs.min,
		timer.max <= RUN_POLICY.resizeTimerMs.max,
		timer.min <= timer.max,
		declared.minSamples >= RUN_POLICY.minSamples,
		declared.minMountCycles >= RUN_POLICY.minMountCycles,
		declared.minDrainMs >= RUN_POLICY.minDrainMs,
		declared.minResizeOsInputs >= RUN_POLICY.minResizeOsInputs,
		Number.isFinite(declared.failureShutdownBoundMs) &&
			declared.failureShutdownBoundMs > 0 &&
			declared.failureShutdownBoundMs <= RUN_POLICY.failureShutdownBoundMs,
		Number.isFinite(declared.maxRunWallMs) &&
			declared.maxRunWallMs > 0 &&
			declared.maxRunWallMs <= RUN_POLICY.maxRunWallMs,
	]

	return tightened.every(Boolean)
}

// Resolves a declared policy to the effective bounds used for assessment.
// Every field is guaranteed present by declaredPolicySatisfies.
function effectivePolicy(declared) {
	return {
		minSamples: declared.minSamples,
		idleSignalMs: declared.boundsMs.idleSignal,
		resizeSignalMs: declared.boundsMs.resizeSignal,
		osInputMs: declared.boundsMs.osInput,
		reorderPickMs: declared.boundsMs.reorderPick,
		timerMinMs: declared.resizeTimerMs.min,
		timerMaxMs: declared.resizeTimerMs.max,
		minMountCycles: declared.minMountCycles,
		minDrainMs: declared.minDrainMs,
		minResizeOsInputs: declared.minResizeOsInputs,
		failureShutdownBoundMs: declared.failureShutdownBoundMs,
		maxRunWallMs: declared.maxRunWallMs,
	}
}

// Extracts durations from [{startKey, endKey}] monotonic pairs. `ordered`
// records whether sample start times are nondecreasing, so a producer cannot
// reorder or hand-pick measurements after the fact.
export function pairDurations(pairs, startKey, endKey) {
	if (!Array.isArray(pairs)) {
		return { durations: [], valid: false, ordered: false }
	}

	const durations = []
	let ordered = true
	let previous = -Infinity
	for (const pair of pairs) {
		const start = pair?.[startKey]
		const end = pair?.[endKey]
		if (
			typeof start !== 'number' ||
			typeof end !== 'number' ||
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			end < start
		) {
			return { durations: [], valid: false, ordered }
		}

		if (start < previous) {
			ordered = false
		}

		previous = start
		durations.push(end - start)
	}

	return { durations, valid: true, ordered }
}

function summarize(durations) {
	const sorted = [...durations].sort((a, b) => a - b)
	return {
		samples: sorted.length,
		minMs: sorted[0] ?? null,
		p95Ms: sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null,
		maxMs: sorted[sorted.length - 1] ?? null,
	}
}

// Reported aggregates must equal what the measured pairs recompute to.
// Predeclared-bounds evidence cannot mix hand-written summaries with real
// measurements.
function aggregateGaps(name, payload, durations) {
	const gaps = []
	const actual = summarize(durations)
	for (const [reported, expected] of [
		['samples', actual.samples],
		['p95', actual.p95Ms],
		['min', actual.minMs],
		['max', actual.maxMs],
	]) {
		if (payload[reported] !== undefined && payload[reported] !== expected) {
			gaps.push(`${name}: reported ${reported} does not match measured pairs`)
		}
	}

	if (payload.raw !== undefined) {
		const rawSorted = Array.isArray(payload.raw) ? [...payload.raw].sort((a, b) => a - b) : []
		const measuredSorted = [...durations].sort((a, b) => a - b)
		if (
			rawSorted.length !== measuredSorted.length ||
			rawSorted.some((value, index) => value !== measuredSorted[index])
		) {
			gaps.push(`${name}: reported raw samples do not match measured pairs`)
		}
	}

	return gaps
}

const MEASURED_PHASES = ['signal-latency', 'resize', 'input-latency', 'reorder']

// Assesses one strengthened (schema 2) proof run fail-closed against the
// contract. `proof` and `orchestrator` are parsed JSONL record arrays.
// Returns 'pass' only when every criterion is met; 'blocked' only for a
// declared missing-resource reason; otherwise 'fail'.
export function assessContractRun(proof, orchestrator) {
	const gaps = []
	const checks = {}
	const one = (phase) => {
		const records = phaseData(proof, phase)
		if (
			records.length !== 1 ||
			records[0] === null ||
			typeof records[0] !== 'object' ||
			Array.isArray(records[0])
		) {
			return null
		}

		return records[0]
	}

	const require = (name, ok, gap) => {
		checks[name] = ok ? 'ok' : 'unmet'
		if (!ok) {
			gaps.push(gap)
		}

		return ok
	}

	const requirePhase = (name) =>
		require(name, one(name) !== null, `Expected exactly one ${name} object record`)

	const status = one('run-status')
	if (status?.status === 'blocked') {
		const reason = typeof status.reason === 'string' ? status.reason : null
		return {
			schema: 2,
			status: BLOCKED_REASONS.has(reason) ? 'blocked' : 'fail',
			independentGate: 'not-assessed',
			blockedReason: reason,
			checks: { 'run-status': BLOCKED_REASONS.has(reason) ? 'blocked' : 'unmet' },
			gaps: BLOCKED_REASONS.has(reason)
				? []
				: ['Blocked claims require a missing-resource reason named by the contract'],
			measured: {},
		}
	}

	require('run-status', status?.status ===
		'complete', 'Missing terminal run-status record declaring status "complete"')

	// No case evidence may be emitted after the terminal marker.
	const statusIndex = proof.findIndex(
		(record) => record.domain === 'case' && record.phase === 'run-status',
	)

	if (
		statusIndex !== -1 &&
		proof
			.slice(statusIndex + 1)
			.some((record) => record.domain === 'case' && record.phase !== undefined)
	) {
		checks['run-status'] = 'unmet'
		gaps.push('run-status must be the terminal case record')
	}

	const header = one('contract-header')
	let policy = null
	if (requirePhase('contract-header')) {
		require('contract-header.schema', header.schema === 2, 'contract-header must declare schema 2')

		for (const field of [
			'caseId',
			'revision',
			'octaneVersion',
			'octanePatch',
			'bundleHash',
			'invocation',
		]) {
			require(`contract-header.${field}`, typeof header[field] === 'string' &&
				header[field] !== '', `contract-header must record ${field}`)
		}

		require('contract-header.policy', declaredPolicySatisfies(
			header.policy,
		), 'Declared run policy missing or relaxes a contract bound')

		if (declaredPolicySatisfies(header.policy)) {
			policy = effectivePolicy(header.policy)
		}

		// The policy must be emitted before any measured distribution so
		// post-hoc bounds cannot pass as predeclared.
		const headerIndex = proof.findIndex(
			(record) => record.domain === 'case' && record.phase === 'contract-header',
		)

		const firstMeasured = Math.min(
			...MEASURED_PHASES.map((phase) =>
				proof.findIndex((record) => record.domain === 'case' && record.phase === phase),
			).filter((index) => index !== -1),
		)

		require('contract-header.order', headerIndex !== -1 &&
			(firstMeasured === Infinity ||
				headerIndex <
					firstMeasured), 'contract-header must precede all measured evidence (predeclared bounds)')
	}

	if (policy === null) {
		// Without a satisfying declared policy no evidence criterion can be
		// evaluated against the contract; report the remaining required phases
		// for producer visibility but fail.
		policy = effectivePolicy(RUN_POLICY)
	}

	const environment = one('environment')
	if (requirePhase('environment')) {
		for (const field of [
			'os',
			'kernel',
			'arch',
			'gjs',
			'gtk',
			'glib',
			'displayServer',
			'session',
			'vmIdentity',
			'inputTool',
		]) {
			require(`environment.${field}`, typeof environment[field] === 'string' &&
				environment[field] !== '', `environment must record ${field}`)
		}

		require('environment.display', environment.displayServer ===
			'x11', 'First proof requires an X11 graphical session; Wayland cannot inherit the result')

		if (environment.session === 'xvfb') {
			require('environment.contingency', environment.contingencyLabeled ===
				true, 'Xvfb contingency sessions must be explicitly labeled')
		}
	}

	const globals = one('globals')
	if (requirePhase('globals')) {
		require('globals.inventory', globals.inventory === 'complete' &&
			Array.isArray(
				globals.dereferenced,
			), 'globals must record an exhaustive dereferenced-global inventory')

		require('globals.unguarded', Array.isArray(globals.unguardedForbidden) &&
			globals.unguardedForbidden.length ===
				0, 'No unguarded DOM/Node/NativeScript-only global may be dereferenced')
	}

	require('load', one('load')?.result ===
		'bundle-loaded', 'Bundle must load under gjs -m (bundle-loaded)')

	const mount = one('mount')
	if (requirePhase('mount')) {
		const surfaces = mount.surfaces
		require('mount.surfaces', surfaces !== null &&
			typeof surfaces === 'object' &&
			surfaces.label === true &&
			surfaces.control === true &&
			surfaces.editable === true &&
			surfaces.reorderContainer ===
				true, 'Mount must cover label, activating control, editable field and reorderable container')

		require('mount.universal', Number.isFinite(mount.nodes) &&
			mount.nodes >= 1 &&
			Number.isFinite(mount.widgets) &&
			mount.widgets >=
				4, 'Mount must report nodes and at least 4 native widgets created via the universal root')
	}

	const ordering = one('ordering')
	if (requirePhase('ordering')) {
		require('ordering.invariants', ordering.microtaskBeforeSameTurnCallbacks === true &&
			ordering.promiseBeforePendingTimer === true &&
			ordering.reorderBeforeNextInput ===
				true, 'Ordering invariants: microtask before same-turn idle/timeout, promises before pending timer, reorder before next input')

		require('ordering.sameTurn', ordering.labelCheckInSameTurnCallback ===
			true, 'Label check must run directly inside each same-turn timer/idle callback')
	}

	const measured = {}
	const latency = (phase, pairStart, pairEnd, boundMs, name) => {
		const payload = one(phase)
		const result = { samples: 0, p95Ms: null, boundMs, sufficient: false }
		measured[name] = result
		if (!requirePhase(phase)) {
			return
		}

		const pairs = pairDurations(payload.pairs, pairStart, pairEnd)
		const stats = summarize(pairs.durations)
		result.samples = stats.samples
		result.p95Ms = stats.p95Ms
		result.sufficient =
			pairs.valid && pairs.ordered && stats.samples >= policy.minSamples && stats.p95Ms <= boundMs

		require(`${phase}.clock`, payload.clock ===
			'monotonic', `${phase} must declare a monotonic clock`)

		require(`${phase}.pairs`, pairs.valid &&
			pairs.ordered, `${phase} requires valid monotonic start/end pairs in collection order`)

		require(`${phase}.sufficient`, pairs.valid &&
			stats.samples >= policy.minSamples &&
			stats.p95Ms <= boundMs, `${phase}: insufficient samples or p95 above the ${boundMs} ms bound`)

		for (const gap of aggregateGaps(phase, payload, pairs.durations)) {
			checks[`${phase}.integrity`] = 'unmet'
			gaps.push(gap)
		}
	}

	latency('signal-latency', 'startMs', 'endMs', policy.idleSignalMs, 'idleSignal')
	latency('input-latency', 'injectMs', 'callbackMs', policy.osInputMs, 'osInput')
	latency('reorder', 'commitMs', 'pickMs', policy.reorderPickMs, 'reorder')

	const inputLatency = one('input-latency')
	if (inputLatency !== null) {
		require('input-latency.class', inputLatency.inputClass === 'os' &&
			inputTier(inputLatency.mechanism) !==
				null, 'input-latency requires OS-input-class pairs with an accepted tier A/B mechanism')
	}

	const reorder = one('reorder')
	if (reorder !== null) {
		require('reorder.stacking', reorder.stackingChanged === true &&
			reorder.overlapped ===
				true, 'Reorder must change actual stacking including overlapping children')

		require('reorder.osHit', reorder.osHitTop === true &&
			reorder.osInputClass === 'os' &&
			inputTier(reorder.osMechanism) !== null, 'An OS-input click must hit the reordered top child')
	}

	const resize = one('resize')
	measured.resizeSignal = {
		samples: 0,
		p95Ms: null,
		boundMs: policy.resizeSignalMs,
		sufficient: false,
	}

	measured.resizeTimers = {
		samples: 0,
		withinWindow: 0,
		windowMs: [policy.timerMinMs, policy.timerMaxMs],
		sufficient: false,
	}

	if (requirePhase('resize')) {
		const pairs = pairDurations(resize.signalPairs, 'startMs', 'endMs')
		const stats = summarize(pairs.durations)
		measured.resizeSignal.samples = stats.samples
		measured.resizeSignal.p95Ms = stats.p95Ms
		measured.resizeSignal.sufficient =
			pairs.valid &&
			pairs.ordered &&
			stats.samples >= policy.minSamples &&
			stats.p95Ms <= policy.resizeSignalMs

		require('resize.clock', resize.clock === 'monotonic', 'resize must declare a monotonic clock')
		require('resize.signalPairs', pairs.valid &&
			pairs.ordered, 'resize requires valid monotonic signal pairs in collection order')

		require('resize.signalSufficient', measured.resizeSignal
			.sufficient, `resize signal: insufficient samples or p95 above the ${policy.resizeSignalMs} ms bound`)

		for (const gap of aggregateGaps('resize', resize, pairs.durations)) {
			checks['resize.integrity'] = 'unmet'
			gaps.push(gap)
		}

		const timers = resize.timerSamples
		const timersValid =
			Array.isArray(timers) &&
			timers.length >= policy.minSamples &&
			timers.every(
				(ms) =>
					typeof ms === 'number' &&
					Number.isFinite(ms) &&
					ms >= policy.timerMinMs &&
					ms <= policy.timerMaxMs,
			)

		measured.resizeTimers.samples = Array.isArray(timers) ? timers.length : 0
		measured.resizeTimers.withinWindow = Array.isArray(timers)
			? timers.filter((ms) => ms >= policy.timerMinMs && ms <= policy.timerMaxMs).length
			: 0

		measured.resizeTimers.sufficient = timersValid === true
		require('resize.timers', timersValid, `resize requires >= ${policy.minSamples} timer samples all within [${policy.timerMinMs},${policy.timerMaxMs}] ms`)

		require('resize.starvation', Number.isFinite(resize.inputDuringResize) &&
			resize.inputDuringResize >=
				policy.minResizeOsInputs, 'OS input must continue during sustained resize (no starvation)')
	}

	const identity = one('stable-identity')
	if (requirePhase('stable-identity')) {
		require('stable-identity.assertion', identity.preserved === true &&
			Number.isFinite(identity.updates) &&
			identity.updates >=
				1, 'Stable native identity must be explicitly asserted across ordinary updates')
	}

	const activation = one('activation')
	if (requirePhase('activation')) {
		require('activation.once', activation.callbackCount === 1 &&
			activation.sharedStateChanged ===
				true, 'One physical activation must produce exactly one application callback reaching shared state')

		require('activation.osInput', activation.inputClass === 'os' &&
			inputTier(activation.mechanism) !==
				null, 'Activation must be exercised through accepted tier A/B OS input')
	}

	const replacement = one('callback-replacement')
	if (requirePhase('callback-replacement')) {
		require('callback-replacement.latest', replacement.latestOnly === true &&
			replacement.staleCalls ===
				0, 'Callback replacement must invoke the latest handler only with no accumulated observers')
	}

	const editingUser = one('editing-user')
	if (requirePhase('editing-user')) {
		require('editing-user.osInput', editingUser.inputClass === 'os' &&
			inputTier(editingUser.mechanism) !==
				null, 'Editing must be exercised through accepted tier A/B OS input')

		require('editing-user.edits', Number.isFinite(editingUser.changes) &&
			editingUser.changes >= 1 &&
			Number.isFinite(editingUser.submits) &&
			editingUser.submits >= 1, 'Real keyboard editing must produce change callbacks and a submit')
	}

	const editingControlled = one('editing-controlled')
	if (requirePhase('editing-controlled')) {
		require('editing-controlled.synthetic', typeof editingControlled.text === 'string' &&
			editingControlled.text !== '' &&
			editingControlled.syntheticChanges ===
				0, 'Controlled writes must produce zero synthetic user-edit callbacks')

		require('editing-controlled.selection', Array.isArray(editingControlled.selection) &&
			editingControlled.selection.length === 2 &&
			editingControlled.selection.every((value) =>
				Number.isFinite(value),
			), 'Programmatic updates must leave a recorded caret/selection intact')

		const interrupt = editingControlled.caretInterruption
		require('editing-controlled.interruption', interrupt !== null &&
			typeof interrupt === 'object' &&
			interrupt.covered === true &&
			interrupt.preserved ===
				true, 'Selection-only user interruption during the settle window must be covered and preserved')
	}

	const lifecycle = one('lifecycle')
	measured.lifecycle = { cycles: 0, required: policy.minMountCycles, baselineReturned: false }
	if (requirePhase('lifecycle')) {
		const baseline = lifecycle.baseline
		const counters = ['subscriptions', 'controllers', 'scheduledSources', 'queuedCallbacks']
		const baselineOk =
			baseline !== null &&
			typeof baseline === 'object' &&
			counters.every((counter) => Number.isFinite(baseline[counter]))

		const perCycle = lifecycle.perCycle
		measured.lifecycle.cycles = Number.isFinite(lifecycle.cycles) ? lifecycle.cycles : 0
		const perCycleOk =
			baselineOk &&
			Array.isArray(perCycle) &&
			perCycle.length === lifecycle.cycles &&
			lifecycle.cycles >= policy.minMountCycles &&
			perCycle.every(
				(entry) =>
					entry !== null &&
					typeof entry === 'object' &&
					counters.every((counter) => entry[counter] === baseline[counter]),
			)

		measured.lifecycle.baselineReturned = perCycleOk === true
		require('lifecycle.cycles', perCycleOk, `>= ${policy.minMountCycles} cycles must each return subscriptions/controllers/sources/callbacks to baseline ±0`)

		require('lifecycle.balanced', lifecycle.connectionsBalanced ===
			true, 'Native observation connections must balance at run end')
	}

	const drain = one('drain')
	measured.drain = { drainMs: 0, required: policy.minDrainMs, clean: false }
	if (requirePhase('drain')) {
		measured.drain.drainMs = Number.isFinite(drain.drainMs) ? drain.drainMs : 0
		const clean =
			drain.drainMs >= policy.minDrainMs &&
			drain.lateCallbacks === 0 &&
			drain.disposedAccesses === 0 &&
			drain.liveSources === 0 &&
			drain.nodesAfterUnmount === 0

		measured.drain.clean = clean === true
		require('drain.clean', clean, `Close must drain >= ${policy.minDrainMs} ms with zero late callbacks, disposed accesses, sources and nodes`)
	}

	const failurePhase = (phase, extra) => {
		const payload = one(phase)
		if (!requirePhase(phase)) {
			return
		}

		require(`${phase}.evidence`, payload.observed === true &&
			payload.cause === true &&
			typeof payload.processState === 'string' &&
			payload.processState !== '' &&
			payload.boundedShutdown ===
				true, `${phase} requires retained cause, process state and bounded-shutdown assertion`)

		if (extra) {
			extra(payload)
		}
	}

	failurePhase('failure-load', (payload) => {
		require('failure-load.ready', payload.reportedReady ===
			false, 'A failing load cannot leave a hung or blank process reported as ready')

		require('failure-load.shutdown', Number.isFinite(payload.shutdownMs) &&
			payload.shutdownMs >= 0 &&
			payload.shutdownMs <=
				policy.failureShutdownBoundMs, `A failing load must shut down within the declared ${policy.failureShutdownBoundMs} ms bound`)
	})

	failurePhase('failure-handler')
	failurePhase('failure-rejection', (payload) => {
		require('failure-rejection.stderr', payload.stderrRetained ===
			true, 'Promise-rejection failure must retain guest stderr evidence')
	})

	// Orchestrator corroboration: every injection uses an accepted mechanism,
	// click and keyboard actions both occur, and a complete run exits cleanly.
	const injects = orchestrator.filter((record) => record.kind === 'inject')
	require('orchestrator.injects', injects.length >= 2 &&
		injects.every(
			(record) => inputTier(record.data?.mechanism) !== null,
		), 'Every orchestrator injection must record an accepted tier A/B mechanism')

	const actions = new Set(injects.map((record) => record.data?.action))
	require('orchestrator.actions', actions.has('click') &&
		(actions.has('type') ||
			actions.has('key')), 'OS-input coverage requires at least one click and one keyboard action')

	const exits = orchestrator.filter((record) => record.kind === 'app-exited')
	require('orchestrator.exit', exits.length === 1 &&
		exits[0].data?.code === 0, 'Missing single successful normal-process exit')

	require('run-status.wallMs', Number.isFinite(status?.wallMs) &&
		status.wallMs >= 0 &&
		status.wallMs <=
			policy.maxRunWallMs, `Run wall time must be recorded and stay within the declared ${policy.maxRunWallMs} ms bound`)

	return {
		schema: 2,
		status: gaps.length === 0 ? 'pass' : 'fail',
		independentGate: 'not-assessed',
		blockedReason: null,
		policy: header?.policy ?? null,
		measured,
		checks,
		gaps,
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const USAGE =
		'Usage: node scripts/probe/linux-gtk-evidence.mjs [--retained|--contract] PROOF_JSONL ORCHESTRATOR_JSONL'

	try {
		const args = process.argv.slice(2)
		const flags = args.filter((arg) => arg.startsWith('--'))
		const paths = args.filter((arg) => !arg.startsWith('--'))
		const contract = flags.includes('--contract')
		if (
			paths.length !== 2 ||
			flags.length > 1 ||
			!flags.every((flag) => flag === '--contract' || flag === '--retained')
		) {
			throw new Error(USAGE)
		}

		const [proof, orchestrator] = await Promise.all(
			paths.map(async (path) => parseJsonLines(await readFile(path, 'utf8'))),
		)

		if (contract) {
			const result = assessContractRun(proof, orchestrator)
			console.log(JSON.stringify(result, null, 2))
			process.exitCode = result.status === 'pass' ? 0 : result.status === 'blocked' ? 3 : 1
		} else {
			console.log(JSON.stringify(auditRetainedRun(proof, orchestrator), null, 2))
			process.exitCode = 1
		}
	} catch {
		// Input files may live at private paths; never print errors containing them.
		console.error('GTK evidence audit failed: provide two readable, valid JSONL evidence files')
		process.exitCode = 2
	}
}
