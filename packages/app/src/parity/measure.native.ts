import { Application } from '@nativescript/core'
import { getStack } from '@octane-xplat/ui'
import { STYLE_FACETS } from './style-facets'

// Measured-dump seam (native leaf) — same JSON shape as measure.web.ts.
// Boxes are stage-of-cell relative dips: getLocationOnScreen reports
// screen coordinates, so rel = child.loc − cell's .parity-box loc.
const round = (n: number) => Math.round(n * 100) / 100

function styleOf(view: any): Record<string, string> {
	const out: Record<string, string> = {}
	const s = view?.style ?? {}
	for (const f of STYLE_FACETS) {
		let v = s[f]
		if (v === undefined || v === null) {
			v = view?.[f]
		}

		if (v !== undefined && v !== null && v !== '') {
			out[f] = String(v)
		}
	}

	return out
}

function nodeFor(view: any, boxView: any, boxLoc: { x: number; y: number }) {
	const loc = view.getLocationOnScreen?.()
	const size = view.getActualSize?.()
	const classes: string[] = view?.cssClasses ? [...view.cssClasses] : []
	return {
		tag: String(view?.typeName ?? view?.constructor?.name ?? 'view').toLowerCase(),
		id: view?.id || undefined,
		classes,
		box:
			loc && size
				? {
						x: round(loc.x - boxLoc.x),
						y: round(loc.y - boxLoc.y),
						w: round(size.width),
						h: round(size.height),
					}
				: null,
		style: styleOf(view),
		text: typeof view?.text === 'string' && view.text ? view.text : undefined,
	}
}

function childrenOf(view: any, out: any[] = []): any[] {
	view?.eachChildView?.((c: any) => {
		out.push(c)
		childrenOf(c, out)
		return true
	})

	return out
}

function hasClass(view: any, cls: string) {
	return view?.cssClasses?.has?.(cls) === true
}

export function measureTree(stageView: any) {
	const cells: Record<string, any[]> = {}
	for (const v of childrenOf(stageView)) {
		if (!hasClass(v, 'parity-cell')) {
			continue
		}

		const name = String(v.id ?? '').replace(/^cell-/, '')
		const box = childrenOf(v).find((c) => hasClass(c, 'parity-box')) ?? v
		const boxLoc = box.getLocationOnScreen?.()
		if (!boxLoc) {
			continue
		}

		cells[name] = [box, ...childrenOf(box)].map((c) => nodeFor(c, box, boxLoc))
	}

	return { target: Application.android ? 'android' : 'ios', cells }
}

/** Same seam as the web leaf — the sweep calls __xplatParity() once the
 *  parity route is pushed on the root stack. */
export function installParityDump() {
	;(globalThis as any).__xplatParityPage = () => getStack('root')?.currentPage

	;(globalThis as any).__xplatParity = () => {
		const page = getStack('root')?.currentPage as any
		const stage = page?.getViewById?.('parity-stage')
		return stage ? measureTree(stage) : null
	}
}
