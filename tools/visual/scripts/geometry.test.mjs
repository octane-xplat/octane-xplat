import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertSwitchGeometry } from '../src/geometry.ts'

function geometry(checked = false, displacement = 0) {
  return {
    stage: { x: 0, y: 0, width: 96, height: 64 },
    track: { x: 28 + displacement, y: 20, width: 40, height: 24 },
    thumb: {
      x: (checked ? 46 : 32) + displacement,
      y: checked ? 22 : 24,
      width: checked ? 20 : 16,
      height: checked ? 20 : 16,
    },
  }
}

test('accepts both states and the declared rendered one-pixel diagnostic', () => {
  for (const checked of [false, true]) {
    for (const displacement of [0, 1]) {
      assert.doesNotThrow(() =>
        assertSwitchGeometry(geometry(checked, displacement), checked, displacement),
      )
    }
  }
})

test('rejects one-pixel and fractional layout drift without rounding or alignment', () => {
  for (const part of ['stage', 'track', 'thumb']) {
    for (const axis of ['x', 'y', 'width', 'height']) {
      for (const drift of [-1, 1, 0.01, NaN]) {
        const actual = geometry()

        actual[part][axis] += drift
        assert.throws(() => assertSwitchGeometry(actual, false), /Invalid Switch geometry/)
      }
    }
  }
})

test('a shifted control cannot enter an unchanged capture or hide behind a shifted stage', () => {
  assert.throws(() => assertSwitchGeometry(geometry(false, 1), false), /track.x/)

  const actual = geometry(false, 1)

  actual.stage.x = 1
  assert.throws(() => assertSwitchGeometry(actual, false, 1), /stage.x/)
  assert.throws(() => assertSwitchGeometry(geometry(), false, 2), /displacement/)
})
