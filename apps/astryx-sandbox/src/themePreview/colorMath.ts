// Port of upstream themePreview/colorMath.ts (Astryx 0.6.4, MIT) — the
// tonal-ramp math the palette preview pages render. sRGB → linear →
// XYZ(D65) → Lab; "HCT" is approximate (Lab polar hue/chroma, tone = L*),
// matching upstream's approximation, not CAM16.

export type Rgb = [number, number, number]
export interface HCT { hue: number; chroma: number; tone: number }

export function hexToRgb(hex: string): Rgb {
	const h = hex.replace('#', '').slice(0, 6)
	const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
	const n = parseInt(full, 16)
	return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
	return '#' + clamp(r) + clamp(g) + clamp(b)
}

function srgbToLinear(c: number): number {
	const s = c / 255
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
function linearToSrgb(c: number): number {
	const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
	return Math.round(Math.min(255, Math.max(0, s * 255)))
}
function linearRgbToXyz(r: number, g: number, b: number): Rgb {
	return [
		0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
		0.2126729 * r + 0.7151522 * g + 0.072175 * b,
		0.0193339 * r + 0.119192 * g + 0.9503041 * b,
	]
}
function xyzToLinearRgb(x: number, y: number, z: number): Rgb {
	return [
		3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
		-0.969266 * x + 1.8760108 * y + 0.041556 * z,
		0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
	]
}
const D65: Rgb = [0.95047, 1.0, 1.08883]
function labF(t: number): number {
	const d = 6 / 29
	return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29
}
function labFInv(t: number): number {
	const d = 6 / 29
	return t > d ? t * t * t : 3 * d * d * (t - 4 / 29)
}
function xyzToLab(x: number, y: number, z: number): Rgb {
	const fx = labF(x / D65[0]), fy = labF(y / D65[1]), fz = labF(z / D65[2])
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
function labToXyz(L: number, a: number, b: number): Rgb {
	const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
	return [labFInv(fx) * D65[0], labFInv(fy) * D65[1], labFInv(fz) * D65[2]]
}

export function hexToLab(hex: string): Rgb {
	const [r, g, b] = hexToRgb(hex)
	return xyzToLab(...linearRgbToXyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)))
}

export function hexToHct(hex: string): HCT {
	const [L, a, b] = hexToLab(hex)
	let hue = (Math.atan2(b, a) * 180) / Math.PI
	if (hue < 0) hue += 360
	return { hue, chroma: Math.sqrt(a * a + b * b), tone: L }
}

/** HCT → sRGB hex. Out-of-gamut chroma is binary-searched down until the
 *  linear channels land inside [0,1] — the same gamut-fit upstream uses. */
export function hctToHex({ hue, chroma, tone }: HCT): string {
	const rad = (hue * Math.PI) / 180
	const tryC = (c: number): [number, number, number] => {
		const [x, y, z] = labToXyz(tone, c * Math.cos(rad), c * Math.sin(rad))
		return xyzToLinearRgb(x, y, z)
	}
	let lo = 0, hi = Math.max(0, chroma)
	let best: Rgb = [0, 0, 0]
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2
		const [r, g, b] = tryC(mid)
		if (r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001) {
			best = [r, g, b]
			lo = mid
		} else {
			hi = mid
		}
	}
	return rgbToHex(linearToSrgb(best[0]), linearToSrgb(best[1]), linearToSrgb(best[2]))
}

export const TONE_STEPS = [
	0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
] as const
export type ToneStep = (typeof TONE_STEPS)[number]

/** Light-mode tonal palette: 21 tones; low tones get a chroma boost
 *  (1 + (50 - tone) / 40, capped at chroma × 1.8). */
export function tonalPalette(hue: number, chroma: number): Record<number, string> {
	const result: Record<number, string> = {}
	const maxChroma = chroma * 1.8
	for (const t of TONE_STEPS) {
		const boost = t < 50 ? 1 + (50 - t) / 40 : 1
		result[t] = hctToHex({ hue, chroma: Math.min(chroma * boost, maxChroma), tone: t })
	}
	return result
}

/** Dark-mode ramp: mid-tones lift +5 tapered between T80/T95, chroma × 0.85. */
const DARK_TONE_LIFT = 5
const DARK_LIFT_TAPER_START = 80
const DARK_LIFT_TAPER_END = 95
const DARK_CHROMA_FACTOR = 0.85

export function darkTonalPalette(hue: number, chroma: number): Record<number, string> {
	const adjustedChroma = chroma * DARK_CHROMA_FACTOR
	const maxChroma = adjustedChroma * 1.8
	const result: Record<number, string> = {}
	for (const t of TONE_STEPS) {
		let lift = DARK_TONE_LIFT
		if (t >= DARK_LIFT_TAPER_END) lift = 0
		else if (t > DARK_LIFT_TAPER_START) {
			lift = (DARK_TONE_LIFT * (DARK_LIFT_TAPER_END - t)) / (DARK_LIFT_TAPER_END - DARK_LIFT_TAPER_START)
		}
		const liftedTone = Math.min(100, t + lift)
		const boost = liftedTone < 50 ? 1 + (50 - liftedTone) / 40 : 1
		result[t] = hctToHex({ hue, chroma: Math.min(adjustedChroma * boost, maxChroma), tone: liftedTone })
	}
	return result
}

export type Mode = 'light' | 'dark'

export function tonalPaletteForMode(hue: number, chroma: number, mode: Mode): Record<number, string> {
	return mode === 'dark' ? darkTonalPalette(hue, chroma) : tonalPalette(hue, chroma)
}

/** CIE76 ΔE in Lab — the "close enough" distance for swatch matching. */
export function deltaE(labA: Rgb, labB: Rgb): number {
	return Math.sqrt(
		(labA[0] - labB[0]) ** 2 + (labA[1] - labB[1]) ** 2 + (labA[2] - labB[2]) ** 2,
	)
}
