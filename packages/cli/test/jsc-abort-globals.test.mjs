import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'

const source = readFileSync(
	new URL('../dist/macos/jsc-host/abort-globals.cjs', import.meta.url),
	'utf8',
)

test('AppKit bootstrap supplies abort events and preserves an existing host implementation', () => {
	assert.match(source, /Copyright \(c\) 2017 Toru Nagashima/)
	assert.match(source, /Copyright \(c\) 2015 Toru Nagashima/)
	assert.match(source, /Permission is hereby granted/)
	const context = vm.createContext({ console })
	vm.runInContext(source, context)
	const controller = new context.AbortController()
	let calls = 0
	controller.signal.addEventListener(
		'abort',
		() => {
			calls++
		},
		{ once: true },
	)
	controller.abort()
	controller.abort()
	assert.equal(controller.signal.aborted, true)
	assert.equal(calls, 1)
	const controllerType = context.AbortController
	const signalType = context.AbortSignal
	vm.runInContext(source, context)
	assert.equal(context.AbortController, controllerType)
	assert.equal(context.AbortSignal, signalType)
})
