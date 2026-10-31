import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

test('native layout reentry is bounded per view and released after errors', () => {
	let calls = 0
	let fail = false
	class BaseView {
		static alloc() {
			return new this()
		}
		initWithFrame() {
			return this
		}
		layout() {
			calls++
			if (calls > 10) {
				throw new Error('unbounded native reentry')
			}
			;(this as BaseView).layout()
			if (fail) {
				throw new Error('native failure')
			}
		}
	}
	const { create } = runSlice(
		sourceWithoutImports(new URL('../src/mason.ts', import.meta.url)).replaceAll('export ', '') +
			'\ndeps = { baseView: NSView }; MasonLayoutView = createMasonLayoutView(); ({ create: () => MasonLayoutView.alloc().initWithFrame() })',
		{ NSView: BaseView, NativeClass: () => {} },
	)
	const first = create()
	const second = create()
	first.layout()
	second.layout()
	assert.equal(calls, 2, 'another view still receives its own layout')
	fail = true
	assert.throws(() => first.layout(), /native failure/)
	fail = false
	first.layout()
	assert.equal(calls, 4, 'a later pass is admitted after failure')
})
