import assert from 'node:assert/strict'
import test from 'node:test'
import { auditRetainedRun, distribution, parseJsonLines } from './linux-gtk-evidence.mjs'

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
