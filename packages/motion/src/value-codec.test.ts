import { describe, expect, it } from 'vitest'
import { compatibleMotionValues, parseMotionValue, MotionTargetError } from './value-codec'

const refs = {
  width: 200,
  height: 100,
  parentWidth: 400,
  parentHeight: 300,
  viewportWidth: 800,
  viewportHeight: 600,
  fontSize: 20,
  rootFontSize: 16,
}

describe('unit and clip codecs', () => {
  it('resolves percentages against each property reference, retaining authored angle windings', () => {
    expect(parseMotionValue('50%', 'x', refs).numbers).toEqual([100])
    expect(parseMotionValue('50%', 'height', refs).numbers).toEqual([150])
    expect(parseMotionValue('50%', 'paddingTop', refs).numbers).toEqual([200])
    expect(parseMotionValue('1turn', 'rotate', refs).numbers).toEqual([360])
    expect(parseMotionValue('2em', 'width', refs).numbers).toEqual([40])
    expect(parseMotionValue('10vw', 'x', refs).numbers).toEqual([80])
  })
  it('reuses upstream serialization for matching compound slots', () => {
    const from = parseMotionValue('inset(10% 20%)', 'clipPath')
    const to = parseMotionValue('inset(5% 10% round 20px)', 'clipPath')
    expect(() => compatibleMotionValues(from, to, 'clipPath')).not.toThrow()
    expect(parseMotionValue('1turn').serialize([180])).toBe('180deg')
    const shadow = parseMotionValue(
      '0px 2px 8px rgba(0,0,0,0.2), 1px 1px 4px rgba(255,0,0,0.5)',
      'boxShadow',
      refs,
    )
    expect(shadow.numbers).toHaveLength(16)
    expect(shadow.serialize(shadow.numbers)).toContain('rgba(255, 0, 0, 0.5)')
    expect(() => parseMotionValue('0 0 -2px rgba(0,0,0,1)', 'boxShadow', refs)).toThrow(/blur/)
    expect(() => parseMotionValue('inset 0 0 2px rgba(0,0,0,1)', 'boxShadow', refs)).toThrow()
  })
  it('rejects incomplete tokens, invalid dimensions and missing references', () => {
    for (const value of ['1px garbage', 'NaN', 'Infinity', 'calc(10px + 2%)', 'var(--x)']) {
      expect(() => parseMotionValue(value, 'width', refs)).toThrow(MotionTargetError)
    }
    expect(() => parseMotionValue('circle(20px)', 'width', refs)).toThrow()
    expect(() => parseMotionValue(20, 'backgroundColor', refs)).toThrow(/unsupported/)
    expect(() => parseMotionValue(-20, 'width', refs)).toThrow(/negative/)
    expect(parseMotionValue('20% 30%', 'borderTopLeftRadius', refs).numbers).toEqual([40, 30])
    expect(() => parseMotionValue('20%', 'opacity', refs)).toThrow(/unitless/)
    expect(() => parseMotionValue('10deg', 'x', refs)).toThrow(/angle/)
    expect(() => parseMotionValue('10%', 'width', { width: 200, height: 100 })).toThrow(
      /definite reference/,
    )
  })
  it('expands inset shorthand and resolves elliptical corners against the inset box', () => {
    const parsed = parseMotionValue('inset(10% 20% round 50% / 25%)', 'clipPath', refs)
    expect(parsed.numbers).toEqual([10, 40, 10, 40, 60, 60, 60, 60, 20, 20, 20, 20])
    expect(parsed.serialize(parsed.numbers)).toBe(
      'inset(10px 40px 10px 40px round 60px 60px 60px 60px / 20px 20px 20px 20px)',
    )
  })
  it('uses the normalized diagonal for circle percentages and axes for ellipse', () => {
    expect(parseMotionValue('circle(50% at 25% 50%)', 'clipPath', refs).numbers).toEqual([
      Math.hypot(200, 100) / Math.SQRT2 / 2,
      50,
      50,
    ])
    expect(parseMotionValue('ellipse(50% 50% at 25% 50%)', 'clipPath', refs).numbers).toEqual([
      100, 50, 50, 50,
    ])
  })
  it('normalizes relative paths and horizontal/vertical segments before compatibility checks', () => {
    const a = parseMotionValue('path("m 0 0 h 100 v 50 h -100 z")', 'clipPath')
    const b = parseMotionValue('path("M 10 20 L 90 20 L 90 60 L 10 60 Z")', 'clipPath')
    expect(() => compatibleMotionValues(a, b, 'clipPath')).not.toThrow()
    expect(a.serialize(a.numbers)).toBe('path(nonzero, "M 0 0 L 100 0 L 100 50 L 0 50 Z")')
  })
  it('expands smooth curves using their reflected control points', () => {
    const a = parseMotionValue('path("M0 0 C10 0 20 10 30 10 S50 20 60 20")', 'clipPath')
    expect(a.numbers.slice(-6)).toEqual([40, 10, 50, 20, 60, 20])
  })
  it('rejects equal-number-count paths with incompatible commands, arc flags, closure or fill rule', () => {
    const check = (a: string, b: string) =>
      expect(() =>
        compatibleMotionValues(
          parseMotionValue(a, 'clipPath'),
          parseMotionValue(b, 'clipPath'),
          'clipPath',
        ),
      ).toThrow(/incompatible/)
    check('path("M0 0 L10 10 L20 20")', 'path("M0 0 Q10 10 20 20")')
    check('path("M0 0 A10 10 0 0 0 20 20")', 'path("M0 0 A10 10 0 1 0 20 20")')
    check('path("M0 0 L10 10 Z")', 'path("M0 0 L10 10")')
    check('path(evenodd, "M0 0 L10 10 Z")', 'path(nonzero, "M0 0 L10 10 Z")')
  })
  it('rejects malformed paths, external clips and changing polygon correspondence', () => {
    for (const value of [
      'path("M 0 0 L 1")',
      'path("M0 0 A-1 1 0 0 0 2 2")',
      'path("M0% 0 L10 10")',
      'path("M1e308 0 l1e308 0")',
      'url(#crop)',
    ]) {
      expect(() => parseMotionValue(value, 'clipPath', refs)).toThrow(MotionTargetError)
    }
    expect(() =>
      compatibleMotionValues(
        parseMotionValue('polygon(0% 0%,100% 0%,0% 100%)', 'clipPath', refs),
        parseMotionValue('polygon(0% 0%,100% 0%,100% 100%,0% 100%)', 'clipPath', refs),
        'clipPath',
      ),
    ).toThrow(/incompatible/)
  })
})
