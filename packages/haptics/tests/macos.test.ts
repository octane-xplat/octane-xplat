import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

test('AppKit presets, unsupported operations, and disposal', () => {
	const calls: unknown[] = []
	const source = readFileSync(new URL('../src/haptics.macos.ts', import.meta.url), 'utf8')
		.replace(/import[\s\S]*?from '@octane-xplat\/platform\/macos'/, '')
		.replace(/import type.*\n/, '').replace('export const', 'const')
	const context = vm.createContext({
		NSHapticFeedbackManager: { defaultPerformer: { performFeedbackPatternPerformanceTime: (...args: unknown[]) => calls.push(args) } },
		NSHapticFeedbackPattern: { Alignment: 1, LevelChange: 2, Generic: 0 },
		NSHapticFeedbackPerformanceTime: { Now: 1 },
	})
	const engine = vm.runInContext(stripTypeScriptTypes(source) + '\ncreateHaptics()', context)
	assert.equal(engine.capabilities().patterns, false)
	assert.equal(engine.capabilities().realtime, false)
	for (const preset of ['selection', 'impact-light', 'impact-medium', 'impact-heavy', 'success', 'warning', 'error']) {
		assert.equal(engine.play(preset), true)
	}
	assert.deepEqual(calls, [[1, 1], [2, 1], [2, 1], [2, 1], [0, 1], [0, 1], [0, 1]])
	assert.equal(engine.playPattern({ duration: 1, points: [] }), false)
	engine.dispose()
	assert.equal(engine.play('selection'), false)
	assert.equal(engine.capabilities().supported, false)
})
