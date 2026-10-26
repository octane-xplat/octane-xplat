/**
 * clip-path parsing and box resolution — port of NS 9.1.3
 * `style-properties.js` parseClipPath plus the resolve semantics of
 * `background.ios.js` (percent lengths resolve against the element box:
 * x/widths against width, y/heights/radii against height).
 */

export type ClipPath =
	| { type: 'none' }
	| { type: 'inset'; top: number; right: number; bottom: number; left: number; radii: [number, number][] }
	| { type: 'circle'; radius: number; cx: number; cy: number }
	| { type: 'ellipse'; rx: number; ry: number; cx: number; cy: number }
	| { type: 'polygon'; points: [number, number][] }

function parseLength(text: string): number | { value: number; unit: '%' } {
	const s = text.trim()
	const p = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(s)
	if (p) {
		return { value: Number(p[1]) / 100, unit: '%' }
	}
	const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|dip|pt)?$/.exec(s)
	return m ? Number(m[1]) : 0
}

function resolveX(v: number | { value: number; unit: '%' }, w: number): number {
	return typeof v === 'object' ? w * v.value : v
}
function resolveY(v: number | { value: number; unit: '%' }, h: number): number {
	return typeof v === 'object' ? h * v.value : v
}
/** Percent radii resolve against the reference box diagonal per CSS
 *  (`sqrt(w²+h²)/sqrt(2)`); numbers are dips. */
function resolveRadius(v: number | { value: number; unit: '%' }, w: number, h: number): number {
	return typeof v === 'object' ? (Math.sqrt(w * w + h * h) / Math.SQRT2) * v.value : v
}

/** NS shorthand edges: 1–4 values → top/right/bottom/left. */
function edgeParts(parts: string[]): [any, any, any, any] {
	const vals = parts.map(parseLength)
	if (vals.length === 1) return [vals[0], vals[0], vals[0], vals[0]]
	if (vals.length === 2) return [vals[0], vals[1], vals[0], vals[1]]
	if (vals.length === 3) return [vals[0], vals[1], vals[2], vals[1]]
	if (vals.length === 4) return [vals[0], vals[1], vals[2], vals[3]]
	throw new Error(`clip-path: expected 1-4 inset values, got ${parts.length}`)
}

function centerAt(at: string | undefined, w: number, h: number): [number, number] {
	if (!at) {
		return [w / 2, h / 2]
	}
	const [x, y] = at.trim().split(/\s+/).map(parseLength)
	return [resolveX(x ?? 0, w), resolveY(y ?? 0, h)]
}

/**
 * `clip-path` text → geometry resolved against a (width, height) box.
 * Grammar per NS parseClipPath: `rect(t r b l)`, `inset(t r b l round radii)`,
 * `circle(r at x y)`, `ellipse(rx ry at x y)`, `polygon(x1 y1, ...)`, `none`.
 */
export function resolveClipPath(value: string | null | undefined, width: number, height: number): ClipPath {
	if (value == null || value === 'none' || value === '') {
		return { type: 'none' }
	}
	const open = value.indexOf('(')
	const close = value.lastIndexOf(')')
	if (open === -1 || close === -1) {
		return { type: 'none' }
	}
	const shape = value.substring(0, open).trim()
	const rule = value.substring(open + 1, close)

	switch (shape) {
		case 'rect':
		case 'inset': {
			const [edgesPart, radiiPart] = rule.split(/\bround\b/)
			const edges = edgesPart.trim().split(/[\s,]+/).filter(Boolean)
			const [top, right, bottom, left] = edgeParts(edges)
			const radii: [number, number][] = []
			if (radiiPart) {
				// Corner groups: "rx ry / rx ry" or single pairs per corner.
				const corners = radiiPart.trim().split('/')
				for (const corner of corners) {
					const [rx, ry] = corner.trim().split(/[\s,]+/).map(parseLength)
					radii.push([resolveRadius(rx ?? 0, width, height), resolveRadius(ry ?? rx ?? 0, width, height)])
				}
			}
			return {
				type: 'inset',
				top: resolveY(top, height),
				right: resolveX(right, width),
				bottom: resolveY(bottom, height),
				left: resolveX(left, width),
				radii,
			}
		}
		case 'circle':
		case 'ellipse': {
			const atIdx = rule.search(/\bat\b/)
			const sizes = (atIdx === -1 ? rule : rule.slice(0, atIdx)).trim().split(/[\s,]+/)
			const at = atIdx === -1 ? undefined : rule.slice(atIdx + 2)
			const [cx, cy] = centerAt(at, width, height)
			if (shape === 'circle') {
				return { type: 'circle', radius: resolveRadius(parseLength(sizes[0] ?? '0'), width, height), cx, cy }
			}
			return {
				type: 'ellipse',
				rx: resolveX(parseLength(sizes[0] ?? '0'), width),
				ry: resolveY(parseLength(sizes[1] ?? sizes[0] ?? '0'), height),
				cx,
				cy,
			}
		}
		case 'polygon': {
			const points: [number, number][] = rule
				.split(',')
				.map((pair) => pair.trim().split(/\s+/).map(parseLength))
				.map(([x, y]) => [resolveX(x, width), resolveY(y ?? 0, height)])
			return { type: 'polygon', points }
		}
		default:
			return { type: 'none' }
	}
}
