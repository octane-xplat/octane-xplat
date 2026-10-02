import type { Mark } from './marks'
import type { PlotBox } from './scales'

/** Mark[] → one `<svg>` markup string. Emits only the androidsvg ∩ SVGKit
 *  subset: `<svg>`/`<g>` structure, path/rect/circle/line shapes, solid fills
 *  and strokes, `translate` transforms, opacity attributes. Never `<text>`,
 *  filters, masks, patterns, or gradients — labels are real elements in the
 *  leaf overlay (docs/primitive-notes.md). */

function num(v: number): string {
	if (!Number.isFinite(v)) {
		return '0'
	}

	return Number.isInteger(v) ? String(v) : String(+v.toFixed(2))
}

function esc(v: string): string {
	return v
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

function paintAttrs(m: Mark): string {
	let out = ''
	if (m.fill !== undefined) {
		out += ` fill="${esc(m.fill)}"`
	}

	if (m.fillOpacity !== undefined) {
		out += ` fill-opacity="${num(m.fillOpacity)}"`
	}

	if (m.stroke !== undefined) {
		out += ` stroke="${esc(m.stroke)}"`
	}

	if (m.strokeOpacity !== undefined) {
		out += ` stroke-opacity="${num(m.strokeOpacity)}"`
	}

	if (m.strokeWidth !== undefined) {
		out += ` stroke-width="${num(m.strokeWidth)}"`
	}

	if (m.strokeLinecap !== undefined) {
		out += ` stroke-linecap="${m.strokeLinecap}"`
	}

	if (m.transform !== undefined) {
		out += ` transform="${esc(m.transform)}"`
	}

	return out
}

function markXml(m: Mark): string {
	switch (m.kind) {
		case 'path':
			return `<path d="${esc(m.d)}"${paintAttrs(m)}/>`
		case 'rect':
			return `<rect x="${num(m.x)}" y="${num(m.y)}" width="${num(m.width)}" height="${num(m.height)}"${paintAttrs(m)}/>`
		case 'circle':
			return `<circle cx="${num(m.cx)}" cy="${num(m.cy)}" r="${num(m.r)}"${paintAttrs(m)}/>`
		case 'line':
			return `<line x1="${num(m.x1)}" y1="${num(m.y1)}" x2="${num(m.x2)}" y2="${num(m.y2)}"${paintAttrs(m)}/>`
	}
}

/** Chart marks are plot-space; axis rules are chart-space. Paint order:
 *  gridlines under the translated marks group, frame (spine + stubs) over. */
export function svgDocument(
	marks: Mark[],
	grid: Mark[],
	frame: Mark[],
	plot: PlotBox,
	width: number,
	height: number,
): string {
	const body = `${grid.map(markXml).join('')}<g transform="translate(${num(plot.x)} ${num(plot.y)})">${marks.map(markXml).join('')}</g>${frame.map(markXml).join('')}`
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(width)} ${num(height)}" width="${num(width)}" height="${num(height)}">${body}</svg>`
}
