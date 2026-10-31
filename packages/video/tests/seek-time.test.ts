import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seekToTime } from '../src/seek-time.ts'

function surface() {
	const calls: number[] = []
	return { calls, video: { seekToTime: (time: number) => calls.push(time) } }
}

test('iOS converts public milliseconds to plugin seconds', () => {
	const env = surface()
	seekToTime(env.video, 10000, 'ios')
	seekToTime(env.video, 0, 'ios')
	assert.deepEqual(env.calls, [10, 0])
})

test('Android forwards public milliseconds to the plugin unchanged', () => {
	const env = surface()
	seekToTime(env.video, 10000, 'android')
	seekToTime(env.video, 0, 'android')
	assert.deepEqual(env.calls, [10000, 0])
})
