import { Application, Frame, Page, GridLayout, RootLayout } from '@nativescript/core'
import {
	createNativeScriptRoot,
	nativeScriptDriver,
	type NativeScriptContainer,
} from '@nativescript-community/octane'

import { createUniversalRoot } from 'octane/universal/native'
import { DataScreen, DataSharedReader, DataRetained, dataShared$ } from '@xplat/app/data-probe.tsrx'
import { runDataTrace } from '@xplat/app/data-trace'
import 'octane/signals'
import '@octane-xplat/ui/theme/tokens.css'

// Dedicated app ID and entry: never resets the shared harness's root or data.
const frame = new Frame()
const pages = [new Page(), new Page()]
const layouts = pages.map((page) => {
	page.actionBarHidden = true
	const layout = new RootLayout()
	page.content = layout
	return layout
})

const hosts = [new GridLayout(), new GridLayout(), new GridLayout(), new GridLayout()]
layouts[0].addChild(hosts[0])
layouts[1].addChild(hosts[1])
let uncaught = 0
const roots = hosts.map((host) => createNativeScriptRoot(host))
const wait = () => new Promise<void>((done) => setTimeout(done, 25))
async function until(condition: () => boolean) {
	const deadline = Date.now() + 10_000
	while (!condition() && Date.now() < deadline) {
		await wait()
	}

	if (!condition()) {
		throw new Error('native data probe timed out')
	}
}

function find(root: number, id: string): any {
	return hosts[root].getViewById(id)
}

function tap(root: number, id: string) {
	const view = find(root, id)
	if (!view || !view.isLoaded) {
		throw new Error('data control not loaded: ' + id)
	}

	const observers = view.getGestureObservers(1) ?? []
	if (!observers.length) {
		throw new Error('data control has no tap observers: ' + id)
	}

	for (const observer of observers) {
		observer.callback({ eventName: 'tap', object: view })
	}
}

Application.run({ create: () => frame })
frame.navigate({ create: () => pages[0], animated: false })

async function run() {
	await until(() => pages[0].isLoaded)
	roots[0].render(DataScreen as any, { id: 'first' })
	frame.navigate({ create: () => pages[1], animated: false })
	await until(() => pages[1].isLoaded)
	roots[1].render(DataScreen as any, { id: 'second' })
	roots[2].render(DataSharedReader as any, {})
	roots[3].render(DataSharedReader as any, {})
	await layouts[1].open(hosts[2], { shadeCover: { opacity: 0.1, tapToClose: false } })
	pages[1].showModal(hosts[3], { context: {}, fullscreen: false, animated: false })
	await until(() => hosts[3].isLoaded)
	await runDataTrace({
		text: (root, id) => find(root, id)?.text,
		tap,
		unmount: (root) => roots[root].unmount(),
		wait,
		activate: async () => {
			hosts[3].closeModal()
			await layouts[1].close(hosts[2])
			frame.goBack()
			await until(() => frame.currentPage === pages[0] && pages[0].isLoaded)
		},
	})

	// A popped NativeScript Page has retired native backing views. Give the
	// separate suspense phase a fresh host instead of navigating that Page again.
	const retainedPage = new Page()
	retainedPage.actionBarHidden = true
	hosts[1] = new GridLayout()
	retainedPage.content = hosts[1]
	frame.navigate({ create: () => retainedPage, animated: false })
	await until(() => retainedPage.isLoaded)
	// Root 1 retired in the trace; exercise suspense in a new renderer root.
	// Compose the public driver/container ABI to configure the universal root's
	// error callback. This dedicated, non-HMR probe never replaces elements.
	const retainedContainer: NativeScriptContainer = {
		host: hosts[1],
		nodes: new Map(),
		children: [],
		root: null,
	}

	const retainedRoot = createUniversalRoot(retainedContainer, nativeScriptDriver, {
		onUncaughtError: () => {
			uncaught++
		},
	})

	retainedContainer.root = retainedRoot
	let resolve!: (value: string) => void
	const pending = new Promise<string>((done) => {
		resolve = done
	})

	retainedRoot.render(DataRetained as any, {
		pending,
		fail: () => {
			throw new Error('probe handler failure')
		},
	})

	await until(() => find(1, 'data-suspend')?.isLoaded === true)
	const body = find(1, 'data-suspend')
	tap(1, 'data-suspend')
	await until(() => find(1, 'data-pending')?.isLoaded === true)
	if (body.visibility !== 'collapse') {
		throw new Error('retained native body not collapsed')
	}

	console.log('[data] OK native retained body hidden after tap')
	resolve('resolved')
	await until(() => find(1, 'data-body')?.text === 'resolved')
	if (find(1, 'data-suspend') !== body || body.visibility !== 'visible') {
		throw new Error('retained native body not restored')
	}

	tap(1, 'data-throw')
	if (uncaught !== 1) {
		throw new Error('native uncaught event callback missing')
	}

	console.log('[data] NATIVE PASS retained identity, visibility, tap, uncaught error')
	retainedRoot.unmount()
	frame.goBack()
	await until(() => frame.currentPage === pages[0] && pages[0].isLoaded)
	console.log('[data] READY_BACKGROUND')
}

Application.on(Application.suspendEvent, () => {
	dataShared$.set(dataShared$.get() + 1)
	console.log('[data] background shared=' + dataShared$.get())
})

Application.on(Application.resumeEvent, () => {
	void until(() => find(0, 'data-shared')?.text === 'shared:' + dataShared$.get()).then(
		() => console.log('[data] RESUME PASS shared=' + dataShared$.get()),
		(error) => console.log('[data] RESUME FAIL ' + String(error)),
	)
})

void run().catch((error) =>
	console.log('[data] NATIVE FAIL ' + ((error as Error).stack ?? String(error))),
)
