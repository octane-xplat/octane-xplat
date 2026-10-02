import { dataRequests, dataShared$, dataModuleRequests } from './data-probe-state'
import 'octane/signals'

export interface DataTraceAdapter {
	text(root: number, id: string): string | undefined
	tap(root: number, id: string): void | Promise<void>
	unmount(root: number): void | Promise<void>
	wait(): Promise<void>
	activate?(root: number): Promise<void>
}

/** Same observable assertions for browser DOM and real NativeScript views. */
export async function runDataTrace(adapter: DataTraceAdapter) {
	let assertions = 0
	const check = (name: string, condition: boolean) => {
		if (!condition) {
			throw new Error('[data] FAIL ' + name)
		}

		assertions++
		console.log('[data] OK ' + name)
	}

	const until = async (condition: () => boolean) => {
		const deadline = Date.now() + 10_000
		while (!condition() && Date.now() < deadline) {
			await adapter.wait()
		}

		if (!condition()) {
			throw new Error('[data] timed out waiting for state')
		}
	}

	const state = (root: number) => adapter.text(root, 'data-status')
	await until(() => dataRequests.length === 2)
	check(
		'independent initial selectors',
		dataRequests[0].id === 'first' && dataRequests[1].id === 'second',
	)

	check(
		'initial pending',
		state(0) === 'first:pending:none:false' && state(1) === 'second:pending:none:false',
	)

	dataRequests[0].resolve('one')
	dataRequests[1].reject(new Error('offline'))
	await until(() => state(0) === 'first:ready:one:false' && state(1) === 'second:error:none:false')
	check('ready and error independently', true)
	await adapter.tap(1, 'data-retry')
	await until(() => dataRequests.length === 3)
	check('retry re-pends', state(1) === 'second:pending:none:false')
	dataRequests[2].resolve('two')
	await until(() => state(1) === 'second:ready:two:false')
	await adapter.tap(1, 'data-refetch')
	await until(() => dataRequests.length === 4)
	check('background refetch retains data', state(1) === 'second:ready:two:true')
	await adapter.tap(1, 'data-change')
	await until(() => dataRequests.length === 5)
	check('selection change aborts obsolete request', dataRequests[3].signal.aborted)
	dataRequests[4].resolve('next')
	await until(() => state(1) === 'second-next:ready:next:false')
	dataRequests[3].resolve('late')
	await adapter.wait()
	check('late response cannot replace new selection', state(1) === 'second-next:ready:next:false')
	check('covered instance keeps original data', state(0) === 'first:ready:one:false')
	await adapter.tap(1, 'data-reset')
	await until(() => dataRequests.length === 6)
	check('reset pending preserves latest value', state(1) === 'second-next:pending:next:false')
	await adapter.unmount(1)
	check('unmount aborts request', dataRequests[5].signal.aborted)
	dataRequests[5].resolve('after-unmount')
	await adapter.wait()
	check('unmounted root stays empty', adapter.text(1, 'data-status') === undefined)
	dataShared$.set(1)
	await until(() =>
		[0, 2, 3].every(
			(root) =>
				adapter.text(root, 'data-shared') === 'shared:1' &&
				adapter.text(root, 'data-module-query') === 'module:1',
		),
	)

	check('module signal and query cross three roots', dataModuleRequests.join(',') === '0,1')
	await adapter.activate?.(0)
	await until(() => state(0) === 'first:ready:one:false')
	await adapter.tap(0, 'data-skip')
	await until(() => state(0)?.startsWith(':idle:') === true)
	check('skip does not start a request', dataRequests.length === 6)
	console.log('[data] PASS ' + assertions + ' assertions')
	return assertions
}
