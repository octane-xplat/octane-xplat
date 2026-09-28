import { navigate } from './nav'

let running = false
let lastDump = ''

function stableDump() {
	const dump = (globalThis as any).__xplatParity?.()
	if (!dump) {
		lastDump = ''
		return null
	}

	const json = JSON.stringify(dump)
	if (json === lastDump) {return dump}
	lastDump = json
	return null
}

function waitForDump(tries = 60): void {
	const dump = stableDump()
	if (dump) {
		console.log('[parity-json] ' + JSON.stringify(dump))
		return
	}
	if (--tries <= 0) {
		console.log('[parity] FAIL — stage never produced a stable dump')
		return
	}

	setTimeout(() => waitForDump(tries), 100)
}

export function runParity(): void {
	if (running) {return}
	running = true
	lastDump = ''
	navigate('parity')
	setTimeout(() => waitForDump(), 100)
}

if ((globalThis as any).__xplatMacOSDebug) {
	;(globalThis as any).__xplatMacOSRunParity = runParity
}
