import { expect, it } from 'vitest'
import { formatHex, hsbForValue, hsbToHex, hsbToRgb, parseHex, rgbToHsb } from './color'

it('parses 6-digit hex with and without #, any case', () => {
	expect(parseHex('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
	expect(parseHex('ff8800')).toEqual({ r: 255, g: 136, b: 0 })
	expect(parseHex('#FF8800')).toEqual({ r: 255, g: 136, b: 0 })
})

it('expands 3-digit hex', () => {
	expect(parseHex('#f80')).toEqual({ r: 255, g: 136, b: 0 })
	expect(parseHex('f80')).toEqual({ r: 255, g: 136, b: 0 })
})

it('rejects invalid input', () => {
	for (const s of ['', '#f8', 'rgb(1,2,3)', '#gggggg', null, undefined]) {
		expect(parseHex(s as string)).toBeNull()
	}
})

it('round-trips hex → hsb → hex on a sample set', () => {
	const samples = [
		'#ff0000', '#00ff00', '#0000ff', '#ff8800', '#80ff80',
		'#123456', '#abcdef', '#f0e1d2', '#07a1c3', '#c3a107',
	]
	for (const hex of samples) {
		expect(hsbToHex(rgbToHsb(parseHex(hex)!))).toBe(hex)
	}
})

it('formats clamped components', () => {
	expect(formatHex({ r: 255.4, g: -3, b: 300 })).toBe('#ff00ff')
})

it('hsbToRgb wraps hue', () => {
	expect(formatHex(hsbToRgb({ h: 360, s: 1, b: 1 }))).toBe('#ff0000')
	expect(formatHex(hsbToRgb({ h: -60, s: 1, b: 1 }))).toBe('#ff00ff')
})

it('keeps the previous hue for achromatic values', () => {
	const red = rgbToHsb({ r: 255, g: 0, b: 0 })
	expect(hsbForValue(red, '#808080').h).toBe(0)
	expect(hsbForValue(red, '#ffffff').h).toBe(0)
	const blue = rgbToHsb({ r: 0, g: 0, b: 255 })
	expect(hsbForValue(blue, '#808080').h).toBeCloseTo(240)
	expect(hsbForValue(blue, '#ffffff').h).toBeCloseTo(240)
})

it('keeps hue and saturation at black, restoring color when brightness returns', () => {
	const red = rgbToHsb({ r: 255, g: 0, b: 0 })
	const black = hsbForValue(red, '#000000')
	expect(black).toEqual({ h: 0, s: 1, b: 0 })
	// Dragging brightness back up from black lands on red again.
	expect(hsbToHex({ h: black.h, s: black.s, b: 1 })).toBe('#ff0000')
})
