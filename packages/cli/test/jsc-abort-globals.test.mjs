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

test('abort dispatch works with the minimal native console', () => {
	const errors = []
	const context = vm.createContext({
		console: { log() {}, warn() {}, error() {} },
		__hostLog: (...values) => {
			if (values[0] === 'Assertion failed:') {
				errors.push(values)
			}
		},
		NSFileManager: { defaultManager: {} },
		__setTimeout: setTimeout,
		__setInterval: setInterval,
		__clearTimer: clearTimeout,
		__hostNow: Date.now,
	})
	vm.runInContext(source, context)
	// Match native bootstrap order: the host shim replaces console after globals.
	vm.runInContext(
		readFileSync(new URL('../src/macos/jsc-host/shim.js', import.meta.url), 'utf8'),
		context,
	)
	const controller = new context.AbortController()
	let aborted = false
	controller.signal.addEventListener('abort', () => {
		aborted = true
	})
	assert.doesNotThrow(() => controller.abort())
	assert.equal(aborted, true)
	assert.equal(errors.length, 0)
	context.console.assert(false, 'fixture assertion')
	assert.deepEqual(errors[0], ['Assertion failed:', 'fixture assertion'])
})
