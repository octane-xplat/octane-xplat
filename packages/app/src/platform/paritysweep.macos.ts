import { navigate } from './nav'
import { setThemePreference } from '@octane-xplat/ui'

let running = false
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

function waitForDump(tries = 60): void {
	const dump = stableDump()
	if (dump) {
		console.log('[parity-json] ' + JSON.stringify(dump))
		return
	}

	if (--tries <= 0) {
		console.log(
			'[parity] FAIL — stage never produced a stable dump; changed: ' +
				diffCells(prevParsed, lastParsed),
		)

		return
	}

	setTimeout(() => waitForDump(tries), 100)
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
	navigate('parity')
	setTimeout(() => waitForDump(), 100)
}

if ((globalThis as any).__xplatMacOSDebug) {
	;(globalThis as any).__xplatMacOSRunParity = runParity
}
