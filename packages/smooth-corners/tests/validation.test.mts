import assert from 'node:assert/strict'
import { test } from 'node:test'
import { colorChannels, validateSurfaceProps } from '../src/validation.ts'
import { generateCommands, smoothPathD } from '../src/path.ts'

test('invalid geometry never reaches a path serializer or native engine', () => {
  for (const radius of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => generateCommands(200, 120, radius), RangeError)
    assert.throws(() => smoothPathD(0, 0, radius), RangeError)
  }

  for (const width of [-1, NaN, Infinity]) {
    assert.throws(() => generateCommands(width, 100, 24), RangeError)
    assert.throws(() => smoothPathD(width, 100, 24), RangeError)
  }

  for (const config of [
    { radius: 24, smoothing: 1.1 },
    { radius: 24, exponent: 1 },
    { radius: 24, curve: 'invalid' },
  ]) {
    assert.throws(() => generateCommands(200, 120, config))
  }
})

test('portable colors use CSS alpha ordering on every adapter', () => {
  assert.deepEqual(colorChannels('#f008'), [255, 0, 0, 136 / 255])
  assert.deepEqual(colorChannels('#ff000080'), [255, 0, 0, 128 / 255])
  assert.deepEqual(colorChannels('rgba(255, 0, 0, 0.5)'), [255, 0, 0, 0.5])
  assert.deepEqual(colorChannels('transparent'), [0, 0, 0, 0])
  for (const color of ['blue', '#12', '#xxxxxx', 'rgb(300,0,0)', 'rgba(0,0,0,2)', 'rgb(0,0,0,1)']) {
    assert.throws(() => colorChannels(color))
  }
})

test('native elevation is distinct from a custom shadow', () => {
  assert.throws(
    () => validateSurfaceProps({ corners: 24, shadow: { blur: 8 } }, 'android'),
    /android=|android\.elevation|elevation/,
  )

  validateSurfaceProps({ corners: 24, android: { elevation: 8 } }, 'android')
  assert.throws(
    () => validateSurfaceProps({ corners: 24, android: { elevation: -1 } }, 'android'),
    RangeError,
  )

  for (const shadow of [{ blur: -1 }, { opacity: 1.1 }, { spread: Infinity }, { offsetX: NaN }]) {
    assert.throws(() => validateSurfaceProps({ corners: 24, shadow }, 'web'), RangeError)
  }

  validateSurfaceProps({ corners: 24, shadow: { spread: -4 } }, 'ios')
})

test('invalid border widths and unsupported style forms fail consistently', () => {
  for (const target of ['web', 'ios', 'android', 'macos']) {
    assert.throws(
      () => validateSurfaceProps({ corners: 24, border: { width: -1, color: '#fff' } }, target),
      RangeError,
    )

    assert.throws(
      () => validateSurfaceProps({ corners: 24, style: 'width: 200px' }, target),
      TypeError,
    )
  }
})

test('mixed curves retain finite geometry over small boxes and oversized radii', () => {
  const curves = ['continuous', 'squircle', 'superellipse', 'clothoid', 'arc']

  for (const curve of curves) {
    for (const [w, h] of [
      [1, 1],
      [200, 1],
      [1, 200],
      [200, 120],
    ]) {
      const d = smoothPathD(w, h, {
        topLeft: { radius: 1000, curve },
        bottomRight: { radius: 12, curve: 'continuous' },
      })

      assert.ok(!/NaN|Infinity/.test(d), `${curve} at ${w}×${h}`)
      assert.ok(d.endsWith('Z') || d.endsWith('z'))
    }
  }
})

test('parent placement rejects invalid grid and flex metadata before layout', () => {
  for (const layout of [
    { row: -1 },
    { col: 0.5 },
    { rowSpan: 0 },
    { colSpan: NaN },
    { flexGrow: -1 },
    { top: Infinity },
  ]) {
    assert.throws(() => validateSurfaceProps({ corners: 24, ...layout }, 'web'), RangeError)
  }

  validateSurfaceProps({ corners: 24, top: -10, order: -1, row: 0, colSpan: 2 }, 'android')
})
