import assert from 'node:assert/strict'
import test from 'node:test'
import { argumentsFor } from './probe.mjs'
import { executeCase } from './probe/runtime.mjs'
import { selectDevice } from './probe/doctor.mjs'
import { validateResult } from './probe/runner.mjs'

const options = { case: '/probe.ts', target: 'web', runId: 'run', timeout: 100 }
const host = (dispose = () => {}) => ({
	host: {},
	identity: 'test',
	interaction: 'dispatch',
	dispose,
})

const execute = (probe, adapter = host(), extra = {}) =>
	executeCase(probe, adapter, { ...options, ...extra }, () => {})

test('run parsing refuses unsupported targets and ambiguous device selection', () => {
	assert.throws(
		() => argumentsFor(['run', 'case.ts', '--target', 'windows']),
		/Windows is excluded/,
	)

	assert.throws(
		() => argumentsFor(['run', 'case.ts', '--targets', 'ios,android', '--device', 'one']),
		/--ios-device/,
	)

	assert.throws(
		() => argumentsFor(['run', 'case.ts', '--watch', '--targets', 'web,macos']),
		/one target/,
	)

	assert.throws(() => argumentsFor(['run', 'case.ts', '--timeout', 'NaN']), /positive/)
	assert.deepEqual(argumentsFor(['run', 'case.ts', '--targets', 'web,web,linux']).targets, [
		'web',
		'linux',
	])
})

test('device discovery selects only an unambiguous active device', () => {
	const state = {
		devices: [
			{ id: 'a', state: 'Booted' },
			{ id: 'b', state: 'Shutdown' },
		],
	}

	assert.equal(selectDevice('ios', state), 'a')
	assert.equal(selectDevice('ios', state, 'b'), 'b')
	assert.throws(() => selectDevice('android', state), /explicit/)
	assert.throws(() => selectDevice('ios', state, 'missing'), /Unknown/)
})

test('script results include assertions and recorded data', async () => {
	const result = await execute({
		run(ctx) {
			ctx.assert('truth', true)
			ctx.record('answer', 42)
		},
	})

	assert.equal(result.status, 'pass')
	assert.equal(result.assertions.length, 1)
	assert.equal(result.measurements.answer, 42)
	assert.equal(validateResult(result, options), true)
})

test('components mount after readiness and retire after cleanup in reverse order', async () => {
	const events = []
	function Component() {}
	await execute(
		{
			default: Component,
			run(ctx) {
				ctx.onCleanup(() => events.push('first'))
				ctx.onCleanup(() => events.push('second'))
			},
		},
		{
			...host(() => events.push('dispose')),
			ready() {
				events.push('ready')
			},
			mount(value) {
				assert.equal(value, Component)
				events.push('mount')
			},
		},
	)

	assert.deepEqual(events, ['ready', 'mount', 'second', 'first', 'dispose'])
})

test('assertions, runtime errors, and cleanup failures cannot pass', async () => {
	const failed = await execute({
		run(ctx) {
			ctx.assert('counter', 0, 1)
		},
	})

	assert.equal(failed.status, 'fail')
	assert.equal(failed.assertions[0].pass, false)
	let reportError
	const runtime = await execute(
		{
			run() {
				reportError(new Error('native error'))
			},
		},
		{
			...host(),
			onError(report) {
				reportError = report
			},
		},
	)

	assert.equal(runtime.status, 'fail')
	const cleanup = await execute(
		{ run() {} },
		host(() => {
			throw new Error('cleanup failed')
		}),
	)

	assert.equal(cleanup.status, 'fail')
	assert.match(cleanup.errors[0].message, /cleanup failed/)
})

test('a hung case times out, disposes, and cannot act after completion', async () => {
	let context
	let disposed = false
	const result = await execute(
		{
			run(ctx) {
				context = ctx
				return new Promise(() => {})
			},
		},
		host(() => {
			disposed = true
		}),
		{ timeout: 10 },
	)

	assert.equal(result.status, 'fail')
	assert.equal(disposed, true)
	assert.throws(() => context.mount(() => {}), /no longer active/)
})

test('nonserializable recorded values fail instead of losing the completion packet', async () => {
	const circular = {}
	circular.self = circular
	const result = await execute({
		run(ctx) {
			ctx.record('bad', circular)
		},
	})

	assert.equal(result.status, 'fail')
	assert.doesNotThrow(() => JSON.stringify(result))
})

test('completion validation rejects stale, wrong-target, and contradictory results', () => {
	const result = {
		schema: 1,
		...options,
		status: 'pass',
		assertions: [],
		measurements: {},
		errors: [],
	}

	assert.equal(validateResult(result, options), true)
	assert.equal(validateResult({ ...result, runId: 'stale' }, options), false)
	assert.equal(validateResult({ ...result, target: 'linux' }, options), false)
	assert.equal(validateResult({ ...result, errors: [{}] }, options), false)
	assert.equal(validateResult({ ...result, assertions: [{ pass: false }] }, options), false)
})

test('case ownership refuses a second runner and releases for the next run', async () => {
	const { acquireCaseLock } = await import('./probe/lock.mjs')
	const caseFile = `/tmp/xplat-probe-lock-test-${process.pid}.ts`
	const release = await acquireCaseLock('web', caseFile)
	try {
		await assert.rejects(acquireCaseLock('web', caseFile), /already has a web runner/)
	} finally {
		await release()
	}

	const releaseNext = await acquireCaseLock('web', caseFile)
	await releaseNext()
})

test('resource edits and additions invalidate the build fingerprint', async () => {
	const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
	const { tmpdir } = await import('node:os')
	const { join } = await import('node:path')
	const { fingerprint } = await import('./probe/project.mjs')
	const resources = await mkdtemp(join(tmpdir(), 'xplat-probe-resource-test-'))
	const deps = { nativeFiles: [], resolved: new Map() }
	try {
		await writeFile(join(resources, 'resource.txt'), 'before')
		const first = await fingerprint(deps, resources)
		await writeFile(join(resources, 'resource.txt'), 'after')
		const edited = await fingerprint(deps, resources)
		assert.notEqual(first.key, edited.key)
		await writeFile(join(resources, 'new-resource.txt'), 'added')
		const added = await fingerprint(deps, resources)
		assert.notEqual(edited.key, added.key)
	} finally {
		await rm(resources, { recursive: true })
	}
})

test('native probe resolves gesturehandler and its pnpm runtime dependency', async () => {
	const { dependencies, repo } = await import('./probe/project.mjs')
	const { join } = await import('node:path')
	const deps = await dependencies('ios', join(repo, 'examples/probes/motion.tsrx'), [
		'@octane-xplat/motion',
	])

	assert.equal(deps.names.has('@nativescript-community/gesturehandler'), true)
	assert.ok(deps.resolved.get('@nativescript-community/observable'))
	assert.ok(
		deps.nativeFiles.includes(
			join(deps.resolved.get('@nativescript-community/observable'), 'package.json'),
		),
	)
})

test('only allowlisted web host diagnostics can pass with recorded errors', async () => {
	const message = 'ResizeObserver loop completed with undelivered notifications.'
	for (const [target, messages, status] of [
		['web', [message], 'pass'],
		['web', [message, 'actual failure'], 'fail'],
		['web', [message + ' extra'], 'fail'],
		['ios', [message], 'fail'],
	]) {
		let report
		const result = await execute(
			{
				run() {
					messages.forEach((message) => report(message))
				},
			},
			{
				...host(),
				onError(callback) {
					report = callback
				},
			},
			{ target },
		)

		assert.equal(result.status, status)
		assert.equal(result.errors.length, messages.length)
		assert.equal(validateResult(result, { ...options, target }), true)
	}

	const thrown = await execute({
		run() {
			throw new Error(message)
		},
	})

	assert.equal(thrown.status, 'fail')
	const cleanup = await execute(
		{ run() {} },
		host(() => {
			throw new Error(message)
		}),
	)

	assert.equal(cleanup.status, 'fail')
	assert.equal(validateResult({ ...thrown, status: 'pass' }, options), false)
})

test('scrub delivers touch actions and local coordinates with observer context', async () => {
	const { dispatchScrub } = await import('./probe/touch.mjs')
	const received = []
	const receiver = {}
	const view = {
		id: 'chart',
		isLoaded: true,
		getGestureObservers(type) {
			assert.equal(type, 128)
			return [
				{
					context: receiver,
					callback(event) {
						assert.equal(this, receiver)
						assert.equal(event.object, view)
						assert.equal(event.eventName, 'touch')
						assert.equal(event.getPointerCount(), 1)
						assert.equal(event.getActivePointers()[0].getX(), event.getX())
						received.push([event.action, event.getX(), event.getY()])
					},
				},
			]
		},
	}

	const result = await execute(
		{
			run(ctx) {
				ctx.scrub('chart', [
					{ x: 10, y: 20 },
					{ x: 30, y: 40 },
				])
			},
		},
		{
			...host(),
			scrub(id, points) {
				assert.equal(id, 'chart')
				dispatchScrub(view, points, 128)
			},
		},
		{ target: 'ios' },
	)

	assert.equal(result.status, 'pass')
	assert.deepEqual(received, [
		['down', 10, 20],
		['move', 30, 40],
		['up', 30, 40],
	])

	assert.throws(() => dispatchScrub(view, [], 128), /nonempty/)
	assert.throws(() => dispatchScrub(view, [{ x: NaN, y: 0 }], 128), /finite/)
	assert.throws(
		() => dispatchScrub({ ...view, isLoaded: false }, [{ x: 0, y: 0 }], 128),
		/loaded touch/,
	)
	const unsupported = await execute({
		run(ctx) {
			ctx.scrub('chart', [{ x: 0, y: 0 }])
		},
	})

	assert.equal(unsupported.status, 'fail')
	assert.match(unsupported.errors[0].message, /only supported/)
})
