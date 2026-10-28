import { setThemePreference } from '@octane-xplat/ui'
import { Parity } from '../app/parity'

let running = false
// The AppKit route host presents pushed root routes as dialog surfaces that
// tear down under automation before the stage settles; mount the stage inline
// instead (see _layout.tsrx).
let openStage: (() => void) | undefined
export function onParityStageOpen(fn: () => void): void {
	openStage = fn
}
let lastDump = ''
let lastParsed: any = null
let prevParsed: any = null

function stableDump() {
	const dump = (globalThis as any).__xplatParity?.()
	if (!dump) {
		lastDump = ''
		lastParsed = null
		return null
	}

	const json = JSON.stringify(dump)
	if (json === lastDump) {
		return dump
	}

	prevParsed = lastParsed
	lastParsed = dump
	lastDump = json
	return null
}

function diffCells(a: any, b: any): string {
	if (!a?.cells || !b?.cells) {
		return 'no-cells a=' + !!a?.cells + ' b=' + !!b?.cells
	}

	const out: string[] = []
	for (const name of Object.keys(b.cells)) {
		const ja = JSON.stringify(a.cells[name])
		const jb = JSON.stringify(b.cells[name])
		if (ja !== jb) {
			out.push(name)
		}
	}

	return out.slice(0, 8).join(',') + (out.length > 8 ? ' …+' + (out.length - 8) : '')
}

// The fixture stage can take a while to mount and settle on the AppKit host;
// keep polling well past the worst observed settle time.
function waitForDump(tries = 300): void {
	const dump = stableDump()
	if (dump) {
		console.log('[parity-json] ' + JSON.stringify(dump))
		return
	}

	if (--tries <= 0) {
		console.log(
			'[parity] FAIL — stage never produced a stable dump; seam=' +
				typeof (globalThis as any).__xplatParity +
				'; changed: ' +
				diffCells(prevParsed, lastParsed),
		)

		return
	}

	setTimeout(() => waitForDump(tries), 100)
}

// The sweep's stdin handler runs inside a CFRunLoopTimer callback, which is a
// valid place to drive a nested run loop — the same mechanism modal sessions
// use. Pump DefaultMode slices between polls instead of deferring to
// setTimeout: the outer AppKit loop can stall in a state where host timers
// never fire (observed parked in mach_msg at 0% CPU), which starves both the
// stage mount and a timer-driven poll loop.
function pumpRunLoop(): boolean {
	const runLoop = (globalThis as any).NSRunLoop?.currentRunLoop
	const NSDate = (globalThis as any).NSDate
	const mode = (globalThis as any).NSDefaultRunLoopMode ?? 'kCFRunLoopDefaultMode'
	if (!runLoop || !NSDate || typeof runLoop.runModeBeforeDate !== 'function') {
		return false
	}

	// A nil limiting date means no sources are registered in this mode —
	// nothing left to drive (and runModeBeforeDate would busy-return).
	if (typeof runLoop.limitDateForMode === 'function' && runLoop.limitDateForMode(mode) == null) {
		return false
	}

	try {
		runLoop.runModeBeforeDate(mode, NSDate.dateWithTimeIntervalSinceNow(0.1))
	} catch (error) {
		console.error('[parity] run-loop pump failed', error)
		return false
	}

	return true
}

export function runParity(): void {
	if (running) {
		return
	}

	running = true
	lastDump = ''
	// The sweep compares against the web dump's light-theme facets — pin the
	// stage to light so a dark host scheme doesn't skew the measurements.
	setThemePreference('light')

	// Mount the stage on a dedicated window root, which renders synchronously,
	// rather than through the app root's deferred flush — the AppKit run loop
	// can stall so host timers never fire (observed parked in mach_msg at 0%
	// CPU), which can starve the inline mount's render indefinitely.
	const controller = (globalThis as any).__xplatAppKitOpenWindow?.({
		component: Parity,
		title: 'parity',
		size: { width: 1600, height: 1100 },
	})
	if (!controller) {
		openStage?.()
	}

	if (!(globalThis as any).NSRunLoop?.currentRunLoop) {
		setTimeout(() => waitForDump(), 100)
		return
	}

	// Nested pump deadline stays under the parity driver's kill so a
	// wedged stage reports cleanly instead of timing out silently.
	const deadline = Date.now() + 90000
	let lastPoll = 0
	while (Date.now() < deadline) {
		const now = Date.now()
		if (now - lastPoll >= 100) {
			lastPoll = now
			const dump = stableDump()
			if (dump) {
				console.log('[parity-json] ' + JSON.stringify(dump))
				controller?.close?.()
				return
			}
		}

		if (!pumpRunLoop()) {
			break
		}
	}

	// Animating fixtures and scroll geometry churn can keep consecutive dumps
	// different forever — emit the last measured dump with an explicit marker
	// rather than hanging until the driver kills the host.
	if (lastParsed) {
		console.log(
			'[parity] dump never stabilized; emitting last measurement — changed: ' +
				diffCells(prevParsed, lastParsed),
		)
		console.log('[parity-json] ' + JSON.stringify(lastParsed))
	} else {
		console.log(
			'[parity] FAIL — stage never produced a dump; seam=' +
				typeof (globalThis as any).__xplatParity +
				'; changed: ' +
				diffCells(prevParsed, lastParsed),
		)
	}
	controller?.close?.()
}

if ((globalThis as any).__xplatMacOSDebug) {
	;(globalThis as any).__xplatMacOSRunParity = runParity
}
