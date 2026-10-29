/** AppKit border style resolution shared by painting and Mason edge sizing. */
type Side = 'top' | 'right' | 'bottom' | 'left'
const sides: Side[] = ['top', 'right', 'bottom', 'left']
const styles = new Set(['none', 'hidden', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'])
const sideKeys: Record<string, Side> = Object.assign(Object.create(null), { borderTopStyle: 'top', borderRightStyle: 'right', borderBottomStyle: 'bottom', borderLeftStyle: 'left' })
const edgeKeys: Record<string, Side> = Object.assign(Object.create(null), { borderTop: 'top', borderRight: 'right', borderBottom: 'bottom', borderLeft: 'left' })

export function borderStyleSides(style: Record<string, unknown>): Record<Side, string> {
	// Width-only native styles retain the existing implicit solid default.
	const out = { top: 'solid', right: 'solid', bottom: 'solid', left: 'solid' }
	for (const [key, value] of Object.entries(style)) {
		if (value == null || (key !== 'borderStyle' && key !== 'border' && !sideKeys[key] && !edgeKeys[key])) continue
		const text = String(value).trim().toLowerCase()
		if (key === 'borderStyle') {
			const parts = text.split(/\s+/)
			if (parts.length > 4) continue
			const values = [parts[0], parts[1] ?? parts[0], parts[2] ?? parts[0], parts[3] ?? parts[1] ?? parts[0]]
			for (let i = 0; i < sides.length; i++) out[sides[i]] = values[i]
		} else if (sideKeys[key]) out[sideKeys[key]] = text
		else if (key === 'border' || edgeKeys[key]) {
			const named = text.split(/\s+/).find(part => styles.has(part)) ?? 'solid'
			for (const side of key === 'border' ? sides : [edgeKeys[key]]) out[side] = named
		}
	}
	return out
}

export function hiddenBorderStyle(style: string): boolean { return style === 'none' || style === 'hidden' }

export function borderStrokeStyle(style: string, width: number): { pattern: number[]; cap: 'butt' | 'round' } | null {
	if (!(width > 0) || !Number.isFinite(width * 3)) return null
	if (style === 'dashed') return { pattern: [width * 3, width * 3], cap: 'butt' }
	if (style === 'dotted') return { pattern: [0, width * 2], cap: 'round' }
	return null
}
