import { routeFor, screenFor } from '@octane-xplat/ui'

type MacOSDebug = {
	snapshot(): { labels: string[]; buttons: string[]; pressables: (string | undefined)[] }
	metrics(): { mountedRowCount: number }
	pressId(id: string): void
	setText(idOrPlaceholder: string, value: string): void
}

declare global {
	var __xplatMacOSDebug: MacOSDebug | undefined
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(predicate: () => boolean, timeout = 6000): Promise<boolean> {
	const deadline = Date.now() + timeout
	while (Date.now() < deadline) {
		if (predicate()) {return true}
		await pause(100)
	}
	return predicate()
}

function assert(name: string, result: boolean): void {
	console.log(`[assert] macOS ${name}: ${result ? 'OK' : 'FAIL'}`)
}

async function run(): Promise<void> {
	const debug = globalThis.__xplatMacOSDebug
	if (!debug) {return}
	const has = (text: string) => debug.snapshot().labels.some((label) => label.includes(text))
	const demoCases: {
		id: string
		title: string
		matches: (labels: string[]) => boolean
	}[] = [
		{ id: 'watch', title: 'Watch', matches: (labels) => labels.some((label) => /^\d{2}:\d{2}:\d{2}$/.test(label)) },
		{ id: 'stopwatch', title: 'Stopwatch', matches: (labels) => labels.includes('0:00.0') },
		{ id: 'todo', title: 'Todo', matches: (labels) => labels.some((label) => label.includes('Nothing yet')) },
		{ id: 'ttt', title: 'Tic-Tac-Toe', matches: (labels) => labels.includes('X to play') },
		{ id: 'dialer', title: 'Dialer', matches: (labels) => labels.includes('Enter number') },
		{ id: 'vlist', title: 'List ×500', matches: (labels) => labels.some((label) => label.includes('500 rows')) },
		{ id: 'weather', title: 'Weather', matches: (labels) => labels.includes('Forecast') },
		{ id: 'list-demo', title: 'Feed', matches: (labels) => labels.includes('Doors open') },
	]
	const demoMounted = (demo: (typeof demoCases)[number]) =>
		waitFor(() => {
			const labels = debug.snapshot().labels
			return labels.some((label) => label.includes(demo.title)) && labels.includes('demo layout') && demo.matches(labels)
		})
	const backToApps = async () => {
		debug.pressId('demo-back')
		return waitFor(() => has('Apps') && has('Counter') && !has('demo layout'))
	}

	const homeMounted = await waitFor(() => has('Kitchen sink') && has('Count: 0'))
	assert('harness Home mounted', homeMounted)
	if (!homeMounted) {return}

	debug.pressId('a11y-btn')
	assert('Home counter updates', await waitFor(() => has('Count: 1')))

	debug.pressId('tab-1')
	const appsMounted = await waitFor(() => has('Apps') && has('Counter'))
	assert('Apps tab mounted shared gallery', appsMounted)
	if (appsMounted) {
		debug.pressId('menu-counter')
		const counterMounted = await waitFor(() => has('Demo count: 0') && has('demo layout'))
		assert('shared Counter demo mounted through route', counterMounted)
		if (!counterMounted) {
			console.log('[sweep] demos route=' + JSON.stringify(routeFor('demos')) + ' screen=' + Boolean(screenFor('demo/:id')))
			console.log('[sweep] labels=' + JSON.stringify(debug.snapshot().labels))
		}
		if (counterMounted) {
			debug.pressId('counter-inc')
			assert('shared Counter demo responds', await waitFor(() => has('Demo count: 1')))
			assert('Counter route returns to the gallery', await backToApps())
		}

		for (const demo of demoCases) {
			debug.pressId('menu-' + demo.id)
			const mounted = await demoMounted(demo)
			assert('shared ' + demo.title + ' demo mounts with its nested layout', mounted)
			if (mounted && demo.id === 'stopwatch') {
				debug.pressId('sw-toggle')
				assert('Stopwatch starts', await waitFor(() => debug.snapshot().labels.includes('Stop')))
				debug.pressId('sw-toggle')
			}
			if (mounted && demo.id === 'todo') {
				debug.setText('Add a todo', 'Finish the macOS harness')
				debug.pressId('todo-add')
				assert('Todo adds typed text', await waitFor(() => has('Finish the macOS harness')))
			}
			if (mounted && demo.id === 'ttt') {
				debug.pressId('ttt-0')
				assert('Tic-Tac-Toe updates after a move', await waitFor(() => has('O to play')))
			}
			if (mounted && demo.id === 'dialer') {
				debug.pressId('key-1')
				assert('Dialer accumulates a digit', await waitFor(() => has('1') && !has('Enter number')))
			}
			if (mounted && demo.id === 'vlist') {
				const mountedRows = debug.metrics().mountedRowCount
				assert(
					'AppKit VirtualList mounts all 500 row components (' + mountedRows + ')',
					mountedRows === 500,
				)
				debug.pressId('vl-drop')
				assert(
					'shared List removes a dropped row',
					await waitFor(() => has('499 rows') && debug.metrics().mountedRowCount === 499),
				)
			}
			assert(demo.title + ' route returns to the gallery', await backToApps())
		}
	}

	debug.pressId('tab-2')
	const testMounted = await waitFor(() => has('Test') && has('Platform services'))
	assert('Test tab mounted probes and services', testMounted)
	if (testMounted) {
		debug.pressId('multi-pressable')
		assert('shared probe responds', await waitFor(() => has('Count: 1')))
	}
}

if (!(globalThis as any).__xplatMacOSParityOnly) {
	setTimeout(() => { void run().catch((error) => console.error('[sweep] macOS failed', error)) }, 1500)
}
