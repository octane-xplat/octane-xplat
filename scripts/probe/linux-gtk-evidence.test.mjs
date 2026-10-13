import assert from 'node:assert/strict'
import test from 'node:test'
import {
	RUN_POLICY,
	assessContractRun,
	auditRetainedRun,
	declaredPolicySatisfies,
	distribution,
	inputTier,
	pairDurations,
	parseJsonLines,
} from './linux-gtk-evidence.mjs'

test('truncated, empty and non-object evidence is rejected', () => {
	for (const input of ['', '{"seq":1', 'null', '[]', '{}\n\n{}']) {
		assert.throws(() => parseJsonLines(input))
	}

	assert.deepEqual(parseJsonLines('{}\n'), [{}])
})

test('small or invalid distributions cannot pass regardless of their p95', () => {
	assert.equal(distribution(Array(40).fill(1), 100).sufficient, false)
	assert.equal(distribution(Array(100).fill(1), 16).sufficient, true)
	assert.equal(distribution(Array(100).fill(17), 16).sufficient, false)
	for (const invalid of [null, [NaN], [Infinity], [-1], ['1']]) {
		assert.equal(distribution(invalid, 100).sufficient, false)
	}
})

test('nested retained schema is read without treating exit zero as a gate pass', () => {
	// Parser fixtures only; no toolkit or OS input is simulated by this test.
	const phase = (name, data) => ({ domain: 'case', phase: name, kind: data })
	const proof = [
		phase('signal-latency', { raw: Array(100).fill(1) }),
		phase('resize', { labelSamples: Array(40).fill(1), timerSamples: Array(40).fill(50) }),
		phase('reorder-commit-latency', { ms: 1 }),
		phase('editing-controlled', { text: 'world', syntheticChanges: 0, selection: [0, 5] }),
		phase('lifecycle', { cycles: 20 }),
		phase('drain', { lateCallbacks: 0, liveSources: 0, nodesAfterUnmount: 0 }),
	]

	const result = auditRetainedRun(proof, [{ kind: 'app-exited', data: { code: 0 } }])
	assert.equal(result.distributions.idleSignal.samples, 100)
	assert.equal(result.distributions.resizeSignal.samples, 40)
	assert.equal(result.distributions.reorder.samples, 1)
	assert.equal(result.status, 'insufficient-evidence')
	assert.equal(result.independentGate, 'not-assessed')
	assert.ok(result.gaps.some((gap) => gap.includes('per-cycle')))
	assert.ok(result.gaps.some((gap) => gap.includes('wall-clock')))
})

test('missing or duplicate phase records cannot be silently substituted', () => {
	const result = auditRetainedRun([
		{ domain: 'case', phase: 'signal-latency', kind: { raw: Array(100).fill(1) } },
		{ domain: 'case', phase: 'signal-latency', kind: { raw: Array(100).fill(1) } },
	], [])

	assert.equal(result.distributions.idleSignal.samples, 0)
	assert.ok(result.gaps.some((gap) => gap.includes('exactly one signal-latency')))
	assert.ok(result.gaps.some((gap) => gap.includes('process exit')))
})

// ---------------------------------------------------------------------------
// Schema-2 contract assessment. Fixture-only: no GTK, VM or input injection
// is simulated by these tests; they verify the fail-closed contract.

const phase = (name, data) => ({ domain: 'case', phase: name, kind: data })
const monotonicPairs = (count, durationMs, startKey = 'startMs', endKey = 'endMs') =>
	Array.from({ length: count }, (_, index) => ({
		[startKey]: index * 10,
		[endKey]: index * 10 + durationMs,
	}))

function validPolicy() {
	return JSON.parse(JSON.stringify(RUN_POLICY))
}

function validProof() {
	return [
		phase('contract-header', {
			schema: 2,
			caseId: 'linux-gtk-proof',
			revision: 'd6f9f713967363c50e3aba57a06a870e99cb01ae',
			octaneVersion: '0.11.0',
			octanePatch: 'dc0b2a2b',
			bundleHash: 'e149a206095f8cc9226cf8d0d3526ca4',
			invocation: 'DISPLAY=:0 gjs -m proof-bundle.mjs',
			policy: validPolicy(),
		}),
		phase('environment', {
			os: 'Debian GNU/Linux 13', kernel: '6.12.111', arch: 'aarch64',
			gjs: '1.82.3', gtk: '4.18.6', glib: '2.84.4',
			displayServer: 'x11', session: 'xorg', vmIdentity: 'qemu-hvf',
			inputTool: 'xdotool 3.20160805.1',
		}),
		phase('globals', {
			inventory: 'complete',
			dereferenced: ['setTimeout', 'Promise', 'TextEncoder', 'window'],
			unguardedForbidden: [],
		}),
		phase('load', { result: 'bundle-loaded' }),
		phase('mount', {
			nodes: 10, widgets: 8,
			surfaces: { label: true, control: true, editable: true, reorderContainer: true },
		}),
		phase('ordering', {
			microtaskBeforeSameTurnCallbacks: true,
			promiseBeforePendingTimer: true,
			reorderBeforeNextInput: true,
			labelCheckInSameTurnCallback: true,
		}),
		phase('signal-latency', { clock: 'monotonic', pairs: monotonicPairs(100, 1) }),
		phase('resize', {
			clock: 'monotonic',
			signalPairs: monotonicPairs(100, 5),
			timerSamples: Array(100).fill(50),
			inputDuringResize: 2,
		}),
		phase('input-latency', {
			clock: 'monotonic', inputClass: 'os', mechanism: 'xtest/xdotool',
			pairs: monotonicPairs(100, 50, 'injectMs', 'callbackMs'),
		}),
		phase('reorder', {
			clock: 'monotonic',
			pairs: monotonicPairs(100, 2, 'commitMs', 'pickMs'),
			stackingChanged: true, overlapped: true,
			osHitTop: true, osInputClass: 'os', osMechanism: 'xtest',
		}),
		phase('stable-identity', { updates: 25, preserved: true }),
		phase('activation', {
			callbackCount: 1, sharedStateChanged: true,
			inputClass: 'os', mechanism: 'qemu-hid',
		}),
		phase('callback-replacement', { latestOnly: true, staleCalls: 0 }),
		phase('editing-user', {
			changes: 5, submits: 1, inputClass: 'os', mechanism: 'xdotool',
		}),
		phase('editing-controlled', {
			text: 'world', syntheticChanges: 0, selection: [0, 5],
			caretInterruption: { covered: true, preserved: true },
		}),
		phase('lifecycle', {
			cycles: 20,
			baseline: { subscriptions: 0, controllers: 0, scheduledSources: 0, queuedCallbacks: 0 },
			perCycle: Array.from({ length: 20 }, () => ({
				subscriptions: 0, controllers: 0, scheduledSources: 0, queuedCallbacks: 0,
			})),
			connectionsBalanced: true,
		}),
		phase('drain', {
			drainMs: 5000, lateCallbacks: 0, disposedAccesses: 0,
			liveSources: 0, nodesAfterUnmount: 0,
		}),
		phase('failure-load', {
			observed: true, cause: true, processState: 'exit-2',
			boundedShutdown: true, shutdownMs: 120, reportedReady: false,
		}),
		phase('failure-handler', {
			observed: true, cause: true, processState: 'responsive-exit-0',
			boundedShutdown: true, appResponsive: true,
		}),
		phase('failure-rejection', {
			observed: true, cause: true, processState: 'responsive-exit-0',
			boundedShutdown: true, stderrRetained: true,
		}),
		phase('run-status', { status: 'complete', wallMs: 60000 }),
	]
}

function validOrchestrator() {
	return [
		{ kind: 'inject', data: { mechanism: 'xtest/xdotool', action: 'click', target: 'activate-button' } },
		{ kind: 'inject', data: { mechanism: 'xtest/xdotool', action: 'type', text: 'hello' } },
		{ kind: 'inject', data: { mechanism: 'xtest/xdotool', action: 'click', target: 'chip-a' } },
		{ kind: 'app-exited', data: { code: 0 } },
	]
}

const phaseIndex = (proof, name) => proof.findIndex(
	(record) => record.domain === 'case' && record.phase === name)

const removePhase = (proof, name) => proof.filter(
	(record) => !(record.domain === 'case' && record.phase === name))

const mutatePhase = (proof, name, patch) => proof.map((record) =>
	record.domain === 'case' && record.phase === name ?
		{ ...record, kind: { ...record.kind, ...patch(record.kind) } } : record)

test('a complete contract-satisfying run produces a pass verdict', () => {
	const result = assessContractRun(validProof(), validOrchestrator())
	assert.equal(result.status, 'pass')
	assert.deepEqual(result.gaps, [])
	assert.equal(result.independentGate, 'not-assessed')
	assert.equal(result.measured.idleSignal.samples, 100)
	assert.equal(result.measured.idleSignal.p95Ms, 1)
	assert.equal(result.measured.osInput.p95Ms, 50)
	assert.equal(result.measured.reorder.p95Ms, 2)
	assert.equal(result.measured.lifecycle.baselineReturned, true)
	assert.equal(result.measured.drain.clean, true)
})

test('every missing required phase fails with a named gap', () => {
	for (const name of ['contract-header', 'environment', 'globals', 'load', 'mount', 'ordering',
		'signal-latency', 'resize', 'input-latency', 'reorder', 'stable-identity',
		'activation', 'callback-replacement', 'editing-user', 'editing-controlled',
		'lifecycle', 'drain', 'failure-load', 'failure-handler', 'failure-rejection',
		'run-status']) {
		const result = assessContractRun(removePhase(validProof(), name), validOrchestrator())
		assert.equal(result.status, 'fail', name)
		assert.ok(result.gaps.some((gap) => gap.includes(name)), name)
	}
})

test('a pass requires 100 samples and an in-bound p95 per distribution', () => {
	for (const name of ['signal-latency', 'resize', 'input-latency', 'reorder']) {
		const start = name === 'input-latency' ? 'injectMs' : name === 'reorder' ? 'commitMs' : 'startMs'
		const end = name === 'input-latency' ? 'callbackMs' : name === 'reorder' ? 'pickMs' : 'endMs'
		const pairsKey = name === 'resize' ? 'signalPairs' : 'pairs'
		for (const count of [0, 40, 99]) {
			const proof = mutatePhase(validProof(), name, () => ({ [pairsKey]: monotonicPairs(count, 1, start, end) }))
			assert.equal(assessContractRun(proof, validOrchestrator()).status, 'fail', `${name} x${count}`)
		}

		const over = name === 'signal-latency' ? 17 : name === 'input-latency' ? 151 : 101
		const proof = mutatePhase(validProof(), name, () => ({ [pairsKey]: monotonicPairs(100, over, start, end) }))
		assert.equal(assessContractRun(proof, validOrchestrator()).status, 'fail', `${name} over bound`)
	}
})

test('reported aggregates inconsistent with measured pairs fail integrity', () => {
	const wrong = mutatePhase(validProof(), 'signal-latency', () => ({ p95: 0.5, samples: 100 }))
	const result = assessContractRun(wrong, validOrchestrator())
	assert.equal(result.status, 'fail')
	assert.ok(result.gaps.some((gap) => gap.includes('reported p95')))

	const wrongRaw = mutatePhase(validProof(), 'resize', () => ({ raw: Array(100).fill(5).with(0, 999) }))
	assert.equal(assessContractRun(wrongRaw, validOrchestrator()).status, 'fail')
})

test('non-monotonic or reversed pairs cannot pass', () => {
	assert.equal(pairDurations([{ a: 0, b: -1 }], 'a', 'b').valid, false)
	const reversed = [...monotonicPairs(100, 1)].reverse()
	assert.equal(pairDurations(reversed, 'startMs', 'endMs').ordered, false)
	const proof = mutatePhase(validProof(), 'signal-latency', () => ({ pairs: reversed }))
	assert.equal(assessContractRun(proof, validOrchestrator()).status, 'fail')
})

test('resize timers below 100 samples or outside [40,200] ms fail', () => {
	for (const timers of [Array(40).fill(50), Array(100).fill(39), Array(100).fill(201)]) {
		const proof = mutatePhase(validProof(), 'resize', () => ({ timerSamples: timers }))
		assert.equal(assessContractRun(proof, validOrchestrator()).status, 'fail')
	}

	const starved = mutatePhase(validProof(), 'resize', () => ({ inputDuringResize: 0 }))
	assert.equal(assessContractRun(starved, validOrchestrator()).status, 'fail')
})

test('lifecycle aggregates cannot hide a cycle that misses baseline', () => {
	const proof = mutatePhase(validProof(), 'lifecycle', (kind) => ({
		perCycle: kind.perCycle.with(7, {
			subscriptions: 1, controllers: 0, scheduledSources: 0, queuedCallbacks: 0,
		}),
	}))

	const result = assessContractRun(proof, validOrchestrator())
	assert.equal(result.status, 'fail')
	assert.ok(result.gaps.some((gap) => gap.includes('baseline')))

	const short = mutatePhase(validProof(), 'lifecycle', (kind) => ({
		cycles: 19, perCycle: kind.perCycle.slice(0, 19),
	}))

	assert.equal(assessContractRun(short, validOrchestrator()).status, 'fail')
})

test('blocked requires a declared missing-resource reason, never a verdict upgrade', () => {
	const blocked = [...removePhase(validProof(), 'run-status'),
		phase('run-status', { status: 'blocked', reason: 'missing-input-tooling' })]

	assert.equal(assessContractRun(blocked, []).status, 'blocked')

	const laundered = [...removePhase(validProof(), 'run-status'),
		phase('run-status', { status: 'blocked', reason: 'p95-over-bound' })]

	assert.equal(assessContractRun(laundered, []).status, 'fail')
})

test('toolkit-dispatched input and rejected mechanisms cannot satisfy OS input', () => {
	assert.equal(inputTier('xtest/xdotool'), 'b')
	assert.equal(inputTier('qemu-hid'), 'a')
	assert.equal(inputTier('g-signal-emit'), null)
	for (const [name, field] of [['activation', 'mechanism'], ['editing-user', 'mechanism'], ['input-latency', 'mechanism']]) {
		const toolkit = mutatePhase(validProof(), name, () => ({ inputClass: 'toolkit' }))
		assert.equal(assessContractRun(toolkit, validOrchestrator()).status, 'fail', name)

		const rejected = mutatePhase(validProof(), name, () => ({ [field]: 'gtk-widget-activate' }))
		assert.equal(assessContractRun(rejected, validOrchestrator()).status, 'fail', name)
	}

	const badInject = [...validOrchestrator().slice(0, 3),
		{ kind: 'inject', data: { mechanism: 'g-signal-emit', action: 'click' } },
		{ kind: 'app-exited', data: { code: 0 } }]

	assert.equal(assessContractRun(validProof(), badInject).status, 'fail')
})

test('a declared policy that relaxes any contract bound fails', () => {
	const relaxed = validPolicy()
	relaxed.boundsMs.idleSignal = 20
	assert.equal(declaredPolicySatisfies(relaxed), false)
	const proof = mutatePhase(validProof(), 'contract-header', () => ({ policy: relaxed }))
	assert.equal(assessContractRun(proof, validOrchestrator()).status, 'fail')

	for (const mutate of [
		(policy) => { policy.minSamples = 99 },
		(policy) => { policy.minMountCycles = 19 },
		(policy) => { policy.minDrainMs = 4999 },
		(policy) => { policy.resizeTimerMs.max = 250 },
		(policy) => { delete policy.failureShutdownBoundMs },
	]) {
		const policy = validPolicy()
		mutate(policy)
		assert.equal(declaredPolicySatisfies(policy), false)
	}

	const tightened = validPolicy()
	tightened.boundsMs.idleSignal = 8
	tightened.minSamples = 200
	assert.equal(declaredPolicySatisfies(tightened), true)
})

test('contract-header must declare the policy before measured evidence', () => {
	const proof = validProof()
	const headerIndex = phaseIndex(proof, 'contract-header')
	const latencyIndex = phaseIndex(proof, 'signal-latency')
	const held = proof[headerIndex]
	proof[headerIndex] = proof[latencyIndex]
	proof[latencyIndex] = held
	const result = assessContractRun(proof, validOrchestrator())
	assert.equal(result.status, 'fail')
	assert.ok(result.gaps.some((gap) => gap.includes('predeclared')))
})

test('editing must cover zero synthetic echoes and selection interruption', () => {
	const synthetic = mutatePhase(validProof(), 'editing-controlled', () => ({ syntheticChanges: 1 }))
	assert.equal(assessContractRun(synthetic, validOrchestrator()).status, 'fail')

	const noInterrupt = mutatePhase(validProof(), 'editing-controlled', () => ({
		caretInterruption: { covered: false, preserved: false },
	}))

	assert.equal(assessContractRun(noInterrupt, validOrchestrator()).status, 'fail')
})

test('failure classes need cause, process state and bounded shutdown', () => {
	const ready = mutatePhase(validProof(), 'failure-load', () => ({ reportedReady: true }))
	assert.equal(assessContractRun(ready, validOrchestrator()).status, 'fail')

	const slow = mutatePhase(validProof(), 'failure-load', () => ({ shutdownMs: 5001 }))
	assert.equal(assessContractRun(slow, validOrchestrator()).status, 'fail')

	const noStderr = mutatePhase(validProof(), 'failure-rejection', () => ({ stderrRetained: false }))
	assert.equal(assessContractRun(noStderr, validOrchestrator()).status, 'fail')
})

test('exit nonzero, extra case records after run-status and over-bound wall time fail', () => {
	const doubleExit = [...validOrchestrator(), { kind: 'app-exited', data: { code: 1 } }]
	assert.equal(assessContractRun(validProof(), doubleExit).status, 'fail')

	const trailing = [...validProof(), phase('signal-latency', { clock: 'monotonic', pairs: monotonicPairs(100, 1) })]
	assert.equal(assessContractRun(trailing, validOrchestrator()).status, 'fail')

	const overWall = mutatePhase(validProof(), 'run-status', () => ({ wallMs: RUN_POLICY.maxRunWallMs + 1 }))
	assert.equal(assessContractRun(overWall, validOrchestrator()).status, 'fail')
})
