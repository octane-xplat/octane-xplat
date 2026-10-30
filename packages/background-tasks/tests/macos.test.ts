import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

const SOURCE = readFileSync(new URL('../src/background-tasks.macos.ts', import.meta.url), 'utf8')
	.replace(/import\s*\{[\s\S]*?\}\s*from '@octane-xplat\/platform\/macos'/, '')
	.replace(/import type.*\n/, '')
	.replace('export const', 'const')

function fixture() {
	const created: any[] = []
	const context = vm.createContext({
		NSBackgroundActivityScheduler: {
			alloc: () => ({
				initWithIdentifier(id: string) {
					const scheduler: any = { identifier: id, invalidated: false, shouldDefer: false }
					scheduler.scheduleWithBlock = (block: any) => (scheduler.block = block)
					scheduler.invalidate = () => (scheduler.invalidated = true)
					created.push(scheduler)
					return scheduler
				},
			}),
		},
	})
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', context)
	return { leaf, created, context }
}

test('register schedules a repeating maintenance task and unregister invalidates it', async () => {
	const f = fixture()
	f.leaf.defineTask('sync', async () => 'success')
	await f.leaf.register('sync', { minimumInterval: 900 })
	const scheduler = f.created[0]
	assert.equal(scheduler.identifier, 'xplat.background.sync')
	assert.equal(scheduler.repeats, true)
	assert.equal(scheduler.interval, 900)
	assert.equal(await f.leaf.isRegistered('sync'), true)
	await f.leaf.unregister('sync')
	assert.equal(scheduler.invalidated, true)
	assert.equal(await f.leaf.isRegistered('sync'), false)
})

test('the scheduled block runs the executor and finishes or defers by result', async () => {
	const f = fixture()
	let ran = false
	f.leaf.defineTask('ok', async () => ((ran = true), 'success'))
	f.leaf.defineTask('bad', async () => 'failed')
	await f.leaf.register('ok', {})
	await f.leaf.register('bad', {})
	const completions: number[] = []
	await new Promise<void>((resolve) =>
		f.created[0].block((result: number) => (completions.push(result), resolve())),
	)
	assert.equal(ran, true)
	await new Promise<void>((resolve) =>
		f.created[1].block((result: number) => (completions.push(result), resolve())),
	)
	assert.equal(completions[0], 2)
	assert.equal(completions[1], 1)

	// A deferral request short-circuits the executor entirely.
	f.created[0].shouldDefer = true
	const deferred: number[] = []
	await new Promise<void>((resolve) =>
		f.created[0].block((result: number) => (deferred.push(result), resolve())),
	)
	assert.equal(deferred[0], 1)
})

test('unregistered names and missing bridges reject honestly', async () => {
	const f = fixture()
	await assert.rejects(f.leaf.register('ghost'), /no task defined/)
	assert.equal(await f.leaf.getStatus(), 'available')
	const bare = vm.createContext({ NSBackgroundActivityScheduler: undefined })
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\nbackgroundTasks', bare)
	assert.equal(leaf.supported, false)
	assert.equal(await leaf.getStatus(), 'unavailable')
	leaf.defineTask('x', async () => 'success')
	await assert.rejects(leaf.register('x'), /unavailable/)
})
