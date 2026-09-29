import { Application, RootLayout, Utils, getRootLayout } from '@nativescript/core'
import { getStack } from '@octane-xplat/ui'
import { STYLE_FACETS } from './style-facets'

// Measured-dump seam (native leaf) — same JSON shape as measure.web.ts.
// Boxes are stage-of-cell relative dips: getLocationOnScreen reports
// screen coordinates, so rel = child.loc − cell's .parity-box loc.
const round = (n: number) => Math.round(n * 100) / 100

function rootLayoutFor(view: any): RootLayout | undefined {
	for (let parent = view?.parent; parent; parent = parent.parent) {
		if (parent instanceof RootLayout) {
			return parent
		}
	}

	return getRootLayout()
}

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

function contentBoxOf(
	view: any,
	loc: { x: number; y: number },
	size: { width: number; height: number },
	boxLoc: { x: number; y: number },
) {
	const inset = (edge: 'Left' | 'Top' | 'Right' | 'Bottom') => {
		const px =
			Number(view?.[`effectivePadding${edge}`] ?? 0) +
			Number(view?.[`effectiveBorder${edge}Width`] ?? 0)

		return Utils.layout.toDeviceIndependentPixels(px)
	}

	const left = inset('Left')
	const top = inset('Top')
	const right = inset('Right')
	const bottom = inset('Bottom')

	return {
		x: round(loc.x - boxLoc.x + left),
		y: round(loc.y - boxLoc.y + top),
		w: round(Math.max(0, size.width - left - right)),
		h: round(Math.max(0, size.height - top - bottom)),
	}
}

function nodeFor(view: any, boxView: any, boxLoc: { x: number; y: number }) {
	const loc = view.getLocationOnScreen?.()
	const size = view.getActualSize?.()
	const classes: string[] = view?.cssClasses ? [...view.cssClasses] : []
	const textControl = hasClass(view, 'vx-input') || hasClass(view, 'vx-textarea')
	const placeholder = textControl && view?.hint ? String(view.hint) : undefined
	const placeholderColor = textControl ? view?.style?.placeholderColor : undefined
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
		contentBox: textControl && loc && size ? contentBoxOf(view, loc, size, boxLoc) : undefined,
		placeholder,
		placeholderStyle:
			placeholder && placeholderColor
				? {
						color: String(placeholderColor),
						opacity: String(round(Number(placeholderColor.a ?? 255) / 255)),
					}
				: undefined,
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
	const rootNodes = childrenOf(rootLayoutFor(stageView))
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

		const marker = `parity-portal--${name}`
		const portalRoot = rootNodes.find((c) => hasClass(c, marker))
		const portalNodes = portalRoot ? [portalRoot, ...childrenOf(portalRoot)] : []
		cells[name] = [box, ...childrenOf(box), ...portalNodes].map((c) => nodeFor(c, box, boxLoc))
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
