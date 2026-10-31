/** AppKit border style resolution shared by painting and Mason edge sizing. */
export type Side = 'top' | 'right' | 'bottom' | 'left'
const sides: Side[] = ['top', 'right', 'bottom', 'left']
const styles = new Set(['none', 'hidden', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'])
const sideKeys: Record<string, Side> = Object.assign(Object.create(null), { borderTopStyle: 'top', borderRightStyle: 'right', borderBottomStyle: 'bottom', borderLeftStyle: 'left' })
const edgeKeys: Record<string, Side> = Object.assign(Object.create(null), { borderTop: 'top', borderRight: 'right', borderBottom: 'bottom', borderLeft: 'left' })

export function borderStyleSides(style: Record<string, unknown>): Record<Side, string> {
	// Width-only native styles retain the existing implicit solid default.
	const out = { top: 'solid', right: 'solid', bottom: 'solid', left: 'solid' }
	for (const [key, value] of Object.entries(style)) {
		if (value == null || (key !== 'borderStyle' && key !== 'border' && !sideKeys[key] && !edgeKeys[key])) {continue}
		const text = String(value).trim().toLowerCase()
		if (key === 'borderStyle') {
			const parts = text.split(/\s+/)
			if (parts.length > 4) {continue}
			const values = [parts[0], parts[1] ?? parts[0], parts[2] ?? parts[0], parts[3] ?? parts[1] ?? parts[0]]
			for (let i = 0; i < sides.length; i++) {out[sides[i]] = values[i]}
		} else if (sideKeys[key]) {out[sideKeys[key]] = text}
		else if (key === 'border' || edgeKeys[key]) {
			const named = text.split(/\s+/).find(part => styles.has(part)) ?? 'solid'
			for (const side of key === 'border' ? sides : [edgeKeys[key]]) {out[side] = named}
		}
	}
	return out
}

export function hiddenBorderStyle(style: string): boolean { return style === 'none' || style === 'hidden' }

export function borderStrokeStyle(style: string, width: number): { pattern: number[]; cap: 'butt' | 'round' } | null {
	if (!(width > 0) || !Number.isFinite(width * 3)) {return null}
	if (style === 'dashed') {return { pattern: [width * 3, width * 3], cap: 'butt' }}
	if (style === 'dotted') {return { pattern: [0, width * 2], cap: 'round' }}
	return null
}

export type BorderBand = { from: number; to: number; shade: 'base' | 'dark' }

/** Bands across one side's width, as fractions from the outer edge (0) to
 *  the inner edge (1) — Chromium's double/groove/ridge/inset/outset
 *  partition: top and left shades face the light. */
export function borderBands(style: string, side: Side, width: number): BorderBand[] {
	const topLeft = side === 'top' || side === 'left'
	switch (style) {
		case 'double':
			return width >= 3
				? [{ from: 0, to: 1 / 3, shade: 'base' }, { from: 2 / 3, to: 1, shade: 'base' }]
				: [{ from: 0, to: 1, shade: 'base' }]
		case 'inset':
			return [{ from: 0, to: 1, shade: topLeft ? 'dark' : 'base' }]
		case 'outset':
			return [{ from: 0, to: 1, shade: topLeft ? 'base' : 'dark' }]
		case 'groove':
			return [
				{ from: 0, to: 0.5, shade: topLeft ? 'dark' : 'base' },
				{ from: 0.5, to: 1, shade: topLeft ? 'base' : 'dark' },
			]
		case 'ridge':
			return [
				{ from: 0, to: 0.5, shade: topLeft ? 'base' : 'dark' },
				{ from: 0.5, to: 1, shade: topLeft ? 'dark' : 'base' },
			]
		default:
			return [{ from: 0, to: 1, shade: 'base' }]
	}
}

/** Chromium Color::Dark() equivalent (components 0..1) used for 3D border shading. */
export function darkBorderComponents(c: { red: number; green: number; blue: number; alpha: number }): {
	red: number
	green: number
	blue: number
	alpha: number
} {
	if (c.red === 0 && c.green === 0 && c.blue === 0) {
		return { red: 84 / 255, green: 84 / 255, blue: 84 / 255, alpha: c.alpha }
	}

	const v = Math.max(c.red, c.green, c.blue)
	const m = Math.max(0, (v - 0.33) / v)
	return { red: c.red * m, green: c.green * m, blue: c.blue * m, alpha: c.alpha }
}

/** Polygon (y-up layer coordinates, same convention as borderSideCGPath)
 *  for one band of one side — `from`/`to` are fractions of the side's width
 *  measured from the outer edge, and each adjacent side's inset follows the
 *  same fraction so bands still meet at the miters. */
export function borderBandPoints(
	side: Side,
	w: number,
	h: number,
	widths: Record<Side, number>,
	from: number,
	to: number,
): [number, number][] {
	const a = { top: widths.top * from, right: widths.right * from, bottom: widths.bottom * from, left: widths.left * from }
	const b = { top: widths.top * to, right: widths.right * to, bottom: widths.bottom * to, left: widths.left * to }
	switch (side) {
		case 'top':
			return [[a.left, h - a.top], [w - a.right, h - a.top], [w - b.right, h - b.top], [b.left, h - b.top]]
		case 'right':
			return [[w - a.right, h - a.top], [w - a.right, a.bottom], [w - b.right, b.bottom], [w - b.right, h - b.top]]
		case 'bottom':
			return [[w - a.right, a.bottom], [a.left, a.bottom], [b.left, b.bottom], [w - b.right, b.bottom]]
		case 'left':
			return [[a.left, a.bottom], [a.left, h - a.top], [b.left, h - b.top], [b.left, b.bottom]]
	}
}
