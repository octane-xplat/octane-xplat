import { expect, it } from 'vitest'
import { attachHost } from './host'

it('decodes Core percent/physical values and restores raw baselines through the native style lease', () => {
  const original = { unit: '%', value: 0.25 }
  const style: Record<string, unknown> = {
    paddingLeft: original,
    paddingTop: { unit: 'px', value: 20 },
    clipPath: 'none',
  }
  const host = attachHost({
    style,
    ios: { getStyle() {} },
    getActualSize: () => ({ width: 200, height: 100 }),
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
  })
  expect(host.styles!.read('paddingLeft')).toBe('25%')
  expect(host.styles!.read('paddingTop')).toBe('10dip')
  host.styles!.write({ paddingLeft: '40px', clipPath: 'inset(10px)' })
  expect(style.paddingLeft).toBe(40)
  host.styles!.release()
  expect(style.paddingLeft).toBe(original)
  expect(style.clipPath).toBe('none')
})
