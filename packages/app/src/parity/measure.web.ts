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

function measureTextLineAdvances(value: string, font: string): number[] | undefined {
	if (!value || !font) {
		return undefined
	}
	const context = document.createElement('canvas').getContext('2d')
	if (!context) {
		return undefined
	}
	context.font = font
	return value.split(/\r\n|\r|\n/).map((line) => round(context.measureText(line).width))
}

function measureTextLineCount(el: any): number | undefined {
	if (!el.childNodes?.length) {
		return undefined
	}
	const range = document.createRange()
	range.selectNodeContents(el)
	const tops = [...range.getClientRects()]
		.filter((rect) => rect.width > 0 && rect.height > 0)
		.map((rect) => rect.top)
		.sort((a, b) => a - b)

	const lineTops: number[] = []
	for (const top of tops) {
		if (lineTops.every((existing) => Math.abs(existing - top) > 1)) {
			lineTops.push(top)
		}
	}

	return lineTops.length || undefined
}

function measureContentBox(el: any, bounds: DOMRect, box: DOMRect, cs: CSSStyleDeclaration) {
	if (!['input', 'textarea'].includes(el.tagName.toLowerCase())) {
		return undefined
	}
	const styleNumber = (name: string) => Number.parseFloat((cs as any)[name]) || 0
	const left = styleNumber('borderLeftWidth') + styleNumber('paddingLeft')
	const right = styleNumber('borderRightWidth') + styleNumber('paddingRight')
	const top = styleNumber('borderTopWidth') + styleNumber('paddingTop')
	const bottom = styleNumber('borderBottomWidth') + styleNumber('paddingBottom')
	return {
		x: round(bounds.left - box.left + left),
		y: round(bounds.top - box.top + top),
		w: round(Math.max(0, bounds.width - left - right)),
		h: round(Math.max(0, bounds.height - top - bottom)),
	}
}

function nodeFor(el: any, boxEl: any) {
	const box = boxEl.getBoundingClientRect()
	const r = el.getBoundingClientRect()
	const cs = getComputedStyle(el)
	const value = typeof el.value === 'string' ? el.value : undefined
	const textValue = value ?? ownText(el)
	const text = textValue?.trim()
	const textLineAdvances =
		textValue !== undefined ? measureTextLineAdvances(textValue, cs.font) : undefined
	const textLineCount = measureTextLineCount(el)
	const contentBox = measureContentBox(el, r, box, cs)
	const placeholder = typeof el.placeholder === 'string' ? el.placeholder || undefined : undefined
	const placeholderCss = placeholder ? getComputedStyle(el, '::placeholder') : undefined
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
		text,
		textLineAdvances,
		textLineCount,
		contentBox,
		placeholder,
		placeholderStyle: placeholderCss
			? { color: String(placeholderCss.color), opacity: String(placeholderCss.opacity) }
			: undefined,
	}
}

export function measureTree(stageEl: any) {
	const cells: Record<string, any[]> = {}
	for (const cell of stageEl.querySelectorAll('.parity-cell')) {
		const name = String(cell.id ?? '').replace(/^cell-/, '')
		const box = cell.querySelector('.parity-box') ?? cell
		const marker = `.parity-portal--${name}`
		const portal = document.querySelector(marker)
		const portalNodes = portal ? [portal, ...portal.querySelectorAll('*')] : []
		cells[name] = [box, ...box.querySelectorAll('*'), ...portalNodes].map((el) => nodeFor(el, box))
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
