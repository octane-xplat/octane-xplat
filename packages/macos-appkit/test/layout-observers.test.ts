import assert from 'node:assert/strict'
import { test } from 'node:test'
import { observeLayoutCommits, notifyLayoutCommit } from '../src/layout-observers.ts'

test('layout commit subscriptions preserve root identity and unsubscribe', () => {
	const seen: unknown[] = []
	const first = {}
	const second = {}
	const stop = observeLayoutCommits(({ hostView }) => seen.push(hostView))
	notifyLayoutCommit(first)
	notifyLayoutCommit(second)
	stop()
	notifyLayoutCommit(first)
	assert.deepEqual(seen, [first, second])
})
