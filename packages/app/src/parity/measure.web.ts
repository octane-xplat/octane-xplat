import { STYLE_FACETS } from './style-facets'

// Measured-dump seam (web leaf): walks the parity stage and records, per
// element, its bounding box *relative to the fixture's .parity-box* plus a
// whitelisted computed-style set. Rel-to-box keeps fixture geometry
// independent of label metrics and scroll position — the dump is stable
// regardless of where the stage sits on screen.
const round = (n: number) => Math.round(n * 100) / 100

function ownText(el: any): string | undefined {
	let t = ''
	for (const n of el.childNodes ?? []) {
		if (n.nodeType === 3) {
			t += n.textContent
		}
	}

	t = t.trim()
	return t || undefined
}

function nodeFor(el: any, boxEl: any) {
	const box = boxEl.getBoundingClientRect()
	const r = el.getBoundingClientRect()
	const cs = getComputedStyle(el)
	const style: Record<string, string> = {}
	for (const f of STYLE_FACETS) {
		const v = (cs as any)[f]
		if (v !== undefined && v !== null && v !== '') {
			style[f] = String(v)
		}
	}

	return {
		tag: el.tagName.toLowerCase(),
		id: el.id || undefined,
		classes: [...el.classList],
		box: {
			x: round(r.left - box.left),
			y: round(r.top - box.top),
			w: round(r.width),
			h: round(r.height),
		},
		style,
		text: ownText(el),
		placeholder: typeof el.placeholder === 'string' ? el.placeholder || undefined : undefined,
	}
}

export function measureTree(stageEl: any) {
	const cells: Record<string, any[]> = {}
	for (const cell of stageEl.querySelectorAll('.parity-cell')) {
		const name = String(cell.id ?? '').replace(/^cell-/, '')
		const box = cell.querySelector('.parity-box') ?? cell
		cells[name] = [box, ...box.querySelectorAll('*')].map((el) => nodeFor(el, box))
	}

	return { target: 'web', cells }
}

/** Registers globalThis.__xplatParity() → the stage dump. Called by
 *  ParityStage on mount; the Playwright script and (Phase B) the native
 *  sweep read the same global name. */
export function installParityDump() {
	;(globalThis as any).__xplatParity = () => {
		const stage = document.getElementById('parity-stage')
		return stage ? measureTree(stage) : null
	}
}
