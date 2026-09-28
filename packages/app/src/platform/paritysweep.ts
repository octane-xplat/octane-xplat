import { Application, knownFolders } from '@nativescript/core'

import { navigate, goBack } from './nav'

// Parity sweep step — pushes the parity route on the root stack, dumps the
// fixture stage's measured tree via the __xplatParity seam (installed by
// ParityStage on mount), and writes it to app documents so it can be pulled
// into parity-report/<target>.json for scripts/parity-check.mjs.
//
// Runs only after demosweep's step chain ends (__xplatSweepDone) — pushing
// a root page mid-sweep corrupts its page lookups. The long timer is the
// fallback for the Android SKIP path where the chain never runs.

let ran = false
let lastDump = ''

// Native layout settles in passes — leaf ResizeObserver-equivalents and
// grid overlays lag the frame push by a beat. Two identical dumps back to
// back is the settled signal; a single nonzero probe catches stale sizes.
function stableDump() {
	const dump = (globalThis as any).__xplatParity?.()
	if (!dump) {
		return null
	}

	const json = JSON.stringify(dump)
	if (json === lastDump) {
		return dump
	}

	lastDump = json
	return null
}

function waitFor(cond: () => boolean, then: () => void, tries = 60) {
	const tick = () => {
		if (cond() || --tries <= 0) {
			then()
		} else {
			setTimeout(tick, 100)
		}
	}

	tick()
}

export function runParity() {
	if (ran) {
		return
	}

	ran = true

	navigate('parity')
	waitFor(
		() => stableDump() != null,
		() => {
			const dump = stableDump()
			const cells = Object.keys(dump?.cells ?? {}).length
			if (!dump) {
				console.log('[parity] FAIL — stage never produced a dump')
			} else {
				try {
					const file = knownFolders.documents().getFile('parity-report.json')
					file.writeTextSync(JSON.stringify(dump))
					console.log('[parity] dump ' + cells + ' fixtures → ' + file.path)
				} catch (e) {
					console.log('[parity] write failed: ' + e)
				}
			}

			goBack()
			console.log('[parity] done')
		},
	)
}

const g = globalThis as any
g.__xplatSweepDone = runParity
if (Application.android != null) {
	setTimeout(runParity, 120000)
}
