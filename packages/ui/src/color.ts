/** Pure color helpers for the color suite — HSB is the working space because
 *  the area/slider map directly onto it. Public `value` stays hex. */

export interface Rgb {
	r: number
	g: number
	b: number
}
export interface Hsb {
	h: number // 0–360
	s: number // 0–1
	b: number // 0–1
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Parse '#rgb', '#rrggbb', optional '#', any case. Null on anything else. */
export function parseHex(input: string | null | undefined): Rgb | null {
	if (!input) { return null }
	let h = input.trim()
	if (h.startsWith('#')) { h = h.slice(1) }
	if (/^[0-9a-fA-F]{3}$/.test(h)) { h = h.split('').map((c) => c + c).join('') }
	if (!/^[0-9a-fA-F]{6}$/.test(h)) { return null }
	const n = parseInt(h, 16)
	return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

/** Normalize an accepted hex input to lowercase '#rrggbb', or null. */
export function normalizeHex(input: string | null | undefined): string | null {
	const rgb = parseHex(input)
	return rgb ? formatHex(rgb) : null
}

export function formatHex(rgb: Rgb): string {
	const to2 = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
	return `#${to2(rgb.r)}${to2(rgb.g)}${to2(rgb.b)}`
}

export function rgbToHsb({ r, g, b }: Rgb): Hsb {
	const rr = r / 255, gg = g / 255, bb = b / 255
	const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
	const d = max - min
	let h = 0
	if (d !== 0) {
		if (max === rr) { h = ((gg - bb) / d) % 6 }
		else if (max === gg) { h = (bb - rr) / d + 2 }
		else { h = (rr - gg) / d + 4 }
		h *= 60
		if (h < 0) { h += 360 }
	}
	return { h, s: max === 0 ? 0 : d / max, b: max }
}

export function hsbToRgb({ h, s, b }: Hsb): Rgb {
	const hh = ((h % 360) + 360) % 360
	const c = b * s
	const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
	const m = b - c
	let rr = 0, gg = 0, bb = 0
	if (hh < 60) { rr = c; gg = x }
	else if (hh < 120) { rr = x; gg = c }
	else if (hh < 180) { gg = c; bb = x }
	else if (hh < 240) { gg = x; bb = c }
	else if (hh < 300) { rr = x; bb = c }
	else { rr = c; bb = x }
	return { r: (rr + m) * 255, g: (gg + m) * 255, b: (bb + m) * 255 }
}

export function hsbToHex(hsb: Hsb): string {
	return formatHex(hsbToRgb(hsb))
}

/** HSB for an incoming hex value that preserves the previous hue (and, at
 *  black, saturation) when the color carries no chroma — achromatic and
 *  black inputs otherwise reset h (and s at b=0), so dragging brightness
 *  to 0 and back would lose the hue the user picked. */
export function hsbForValue(prev: Hsb | null, hex: string): Hsb {
	const rgb = parseHex(hex)
	if (!rgb) { return prev ?? { h: 0, s: 0, b: 0 } }
	const next = rgbToHsb(rgb)
	if (prev && (next.s === 0 || next.b === 0)) {
		next.h = prev.h
		if (next.b === 0) { next.s = prev.s }
	}
	return next
}

export function clampHsb(hsb: Hsb): Hsb {
	return { h: Math.min(360, Math.max(0, hsb.h)), s: clamp01(hsb.s), b: clamp01(hsb.b) }
}
